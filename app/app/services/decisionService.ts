import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Platform } from 'react-native';
import {
  DEVNET_RPC,
  fetchProgramSnapshot,
  getSolPriceUsd,
  getUserStatePDA,
  getVaultPDA,
  PROGRAM_ID,
  SOLSTICE_IDL,
} from '../lib/sdk';
import { DashboardSnapshot, Decision, DecisionAction } from '../types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const connection = new Connection(DEVNET_RPC, 'confirmed');

const randomTxId = () => {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  return Array.from({ length: 88 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const REASONS: Record<DecisionAction, string[]> = {
  BUY: [
    'Momentum breakout confirmed above key resistance. Position opened with conservative risk.',
    'RSI oversold with bullish divergence on 4H chart. Strong accumulation signal detected.',
    'Volume surge confirms uptrend continuation. AI entering long position.',
  ],
  SELL: [
    'Take-profit triggered after RSI divergence on short timeframe. Position closed.',
    'Price rejected at major resistance with bearish engulfing candle. Exit executed.',
    'Overbought RSI with fading volume. Locking in gains.',
  ],
  HOLD: [
    'Market entered range-bound phase. AI paused until volatility normalizes.',
    'Mixed signals across timeframes. Waiting for directional confirmation.',
    'Low-conviction setup. No edge detected — preserving capital.',
  ],
};

let idCounter = 10;
let liveDecisions: Decision[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    action: 'BUY',
    explanation: 'Initial checkpoint trade signal generated from SOL trend context.',
    price: 155.2,
    confidence: 78,
    txId: randomTxId(),
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    action: 'HOLD',
    explanation: 'Market indecision detected. Waiting for clearer confirmation.',
    price: 156.0,
    confidence: 57,
    txId: randomTxId(),
  },
];
let priceHistory: number[] = [153.8, 154.2, 154.9, 155.2, 156.0];
let lastPrice: number | null = priceHistory[priceHistory.length - 1] ?? null;
let simulatedVaultBalanceSol = 0;
let vaultBalanceOverride: number | null = null;

const getInstructionDiscriminator = (name: string): Uint8Array => {
  const idl = SOLSTICE_IDL as { instructions?: Array<{ name: string; discriminator: number[] }> };
  const ix = idl.instructions?.find((entry) => entry.name === name);
  if (!ix?.discriminator) {
    throw new Error(`Missing discriminator for ${name}`);
  }
  return Uint8Array.from(ix.discriminator);
};

const encodeU64 = (value: bigint): Uint8Array => {
  const bytes = new Uint8Array(8);
  let v = value;
  for (let i = 0; i < 8; i += 1) {
    bytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return bytes;
};

const buildIxData = (name: string, amountLamports?: bigint): Uint8Array => {
  const discriminator = getInstructionDiscriminator(name);
  if (amountLamports === undefined) {
    return discriminator;
  }
  const data = new Uint8Array(16);
  data.set(discriminator, 0);
  data.set(encodeU64(amountLamports), 8);
  return data;
};

const getPhantomProvider = () => {
  if (Platform.OS !== 'web') {
    return null;
  }
  const provider = (window as any)?.solana;
  if (provider?.isPhantom) {
    return provider;
  }
  return null;
};

const ensureWalletReady = async () => {
  const provider = getPhantomProvider();
  if (!provider) {
    throw new Error('Phantom wallet is only available on web.');
  }
  if (!provider.isConnected) {
    await provider.connect();
  }
  if (!provider.publicKey) {
    throw new Error('Wallet not connected');
  }
  return provider;
};

const buildIx = (name: string, keys: Array<{ pubkey: PublicKey; isSigner: boolean; isWritable: boolean }>, data: Uint8Array) =>
  new TransactionInstruction({ programId: PROGRAM_ID, keys, data });

const getVaultBalance = async (vaultPda: PublicKey): Promise<number> => {
  const lamports = await connection.getBalance(vaultPda);
  return lamports / LAMPORTS_PER_SOL;
};

const prepareVaultAndUserIxs = async (user: PublicKey) => {
  const [vaultPda] = getVaultPDA();
  const [userStatePda] = getUserStatePDA(user);

  const [vaultAccount, userStateAccount] = await Promise.all([
    connection.getAccountInfo(vaultPda),
    connection.getAccountInfo(userStatePda),
  ]);

  const ixs: TransactionInstruction[] = [];

  if (!vaultAccount) {
    ixs.push(
      buildIx(
        'init_vault',
        [
          { pubkey: vaultPda, isSigner: false, isWritable: true },
          { pubkey: user, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        buildIxData('init_vault')
      )
    );
  }

  if (!userStateAccount) {
    ixs.push(
      buildIx(
        'init_user',
        [
          { pubkey: userStatePda, isSigner: false, isWritable: true },
          { pubkey: user, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        buildIxData('init_user')
      )
    );
  }

  return { vaultPda, userStatePda, ixs };
};

const sendVaultTransaction = async (ixs: TransactionInstruction[], feePayer: PublicKey) => {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ feePayer, recentBlockhash: blockhash });
  ixs.forEach((ix) => tx.add(ix));

  const provider = await ensureWalletReady();
  const result = await provider.signAndSendTransaction(tx);
  const signature = typeof result === 'string' ? result : result?.signature;
  if (!signature) {
    throw new Error('Failed to send transaction');
  }

  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
  return signature;
};

const generateDecision = (price: number, prevPrice: number | null): Decision => {
  let action: DecisionAction = 'HOLD';
  let confidence = 55;

  if (prevPrice !== null) {
    const changePct = ((price - prevPrice) / prevPrice) * 100;
    if (changePct > 0.35) {
      action = Math.random() > 0.3 ? 'BUY' : 'HOLD';
      confidence = 65 + Math.floor(Math.random() * 25);
    } else if (changePct < -0.35) {
      action = Math.random() > 0.3 ? 'SELL' : 'HOLD';
      confidence = 62 + Math.floor(Math.random() * 25);
    } else {
      action = 'HOLD';
      confidence = 48 + Math.floor(Math.random() * 16);
    }
  }

  const reasons = REASONS[action];
  return {
    id: String(++idCounter),
    timestamp: new Date().toISOString(),
    action,
    explanation: reasons[Math.floor(Math.random() * reasons.length)],
    price,
    confidence,
    txId: randomTxId(),
  };
};

export const decisionService = {
  async fetchDecisions(): Promise<Decision[]> {
    await wait(120);
    return [...liveDecisions].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  },

  async fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
    const [price, snapshot] = await Promise.all([
      getSolPriceUsd(),
      fetchProgramSnapshot(connection),
    ]);

    const solPrice = price ?? lastPrice ?? 155;
    const nextDecision = generateDecision(solPrice, lastPrice);
    liveDecisions = [...liveDecisions, nextDecision].slice(-20);
    priceHistory = [...priceHistory, solPrice].slice(-12);
    lastPrice = solPrice;

    const onChainVaultBalance = snapshot.vaultExists
      ? snapshot.vaultLamports / 1_000_000_000
      : null;

    if (vaultBalanceOverride === null && onChainVaultBalance !== null) {
      simulatedVaultBalanceSol = onChainVaultBalance;
    }

    const vaultBalance = vaultBalanceOverride ?? onChainVaultBalance ?? simulatedVaultBalanceSol;

    const profitLoss = Number(
      liveDecisions
        .slice(-10)
        .reduce((acc, d) => acc + (d.action === 'BUY' ? 1 : d.action === 'SELL' ? -0.6 : 0), 0)
        .toFixed(2)
    );

    return {
      solPrice,
      profitLoss,
      tradesCount: liveDecisions.filter((d) => d.action !== 'HOLD').length,
      agentStatus: nextDecision.action === 'HOLD' ? 'Idle' : 'Active',
      vaultBalance,
      history: priceHistory,
      latestDecision: nextDecision,
    };
  },

  async deposit(amount: number) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const provider = await ensureWalletReady();
    const user = new PublicKey(provider.publicKey.toString());
    const lamports = BigInt(Math.round(amount * LAMPORTS_PER_SOL));

    const { vaultPda, userStatePda, ixs } = await prepareVaultAndUserIxs(user);
    ixs.push(
      buildIx(
        'deposit',
        [
          { pubkey: vaultPda, isSigner: false, isWritable: true },
          { pubkey: userStatePda, isSigner: false, isWritable: true },
          { pubkey: user, isSigner: true, isWritable: true },
        ],
        buildIxData('deposit', lamports)
      )
    );

    await sendVaultTransaction(ixs, user);
    const vaultBalance = await getVaultBalance(vaultPda);
    vaultBalanceOverride = vaultBalance;
    return { success: true, vaultBalance };
  },

  async withdraw(amount: number) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const provider = await ensureWalletReady();
    const user = new PublicKey(provider.publicKey.toString());
    const lamports = BigInt(Math.round(amount * LAMPORTS_PER_SOL));

    const [vaultPda] = getVaultPDA();
    const [userStatePda] = getUserStatePDA(user);
    const userStateAccount = await connection.getAccountInfo(userStatePda);
    if (!userStateAccount) {
      throw new Error('User state not initialized. Deposit first.');
    }

    const ixs: TransactionInstruction[] = [
      buildIx(
        'withdraw',
        [
          { pubkey: vaultPda, isSigner: false, isWritable: true },
          { pubkey: userStatePda, isSigner: false, isWritable: true },
          { pubkey: user, isSigner: true, isWritable: true },
        ],
        buildIxData('withdraw', lamports)
      ),
    ];

    await sendVaultTransaction(ixs, user);
    const vaultBalance = await getVaultBalance(vaultPda);
    vaultBalanceOverride = vaultBalance;
    return { success: true, vaultBalance };
  },
};
