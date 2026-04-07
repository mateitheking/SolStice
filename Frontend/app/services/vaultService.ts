import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction, clusterApiUrl } from '@solana/web3.js';
import { Buffer } from 'buffer';

const PROGRAM_ID = new PublicKey('yRxrK31ibWBXorgH1g1VVXmDzZotzVhv3AudE48W44f');
const DEVNET_RPC = clusterApiUrl('devnet');
const VAULT_SEED = new TextEncoder().encode('vault');
const USER_STATE_SEED = new TextEncoder().encode('user_state');
const DEPOSIT_DISCRIMINATOR = Uint8Array.from([242, 35, 198, 137, 82, 225, 242, 182]);
const WITHDRAW_DISCRIMINATOR = Uint8Array.from([183, 18, 70, 156, 148, 109, 161, 34]);

type PhantomProvider = {
  isPhantom?: boolean;
  isConnected?: boolean;
  publicKey?: PublicKey;
  connect: () => Promise<{ publicKey: PublicKey }>;
  signAndSendTransaction: (tx: Transaction) => Promise<{ signature: string } | string>;
};

const connection = new Connection(DEVNET_RPC, 'confirmed');

function getProvider(): PhantomProvider {
  const provider = (window as any).solana as PhantomProvider | undefined;

  if (!provider?.isPhantom) {
    throw new Error('Phantom wallet extension not found.');
  }

  return provider;
}

function getVaultPda() {
  return PublicKey.findProgramAddressSync([VAULT_SEED], PROGRAM_ID)[0];
}

function getUserStatePda(userPubkey: PublicKey) {
  return PublicKey.findProgramAddressSync([USER_STATE_SEED, userPubkey.toBytes()], PROGRAM_ID)[0];
}

function encodeAmount(amountLamports: bigint, discriminator: Uint8Array) {
  const amountBytes = new Uint8Array(8);
  const view = new DataView(amountBytes.buffer);
  view.setBigUint64(0, amountLamports, true);
  return new Uint8Array([...discriminator, ...amountBytes]);
}

function resolveSignature(result: { signature: string } | string) {
  return typeof result === 'string' ? result : result.signature;
}

async function sendVaultInstruction(discriminator: Uint8Array, amountSol: number) {
  const provider = getProvider();

  if (!provider.isConnected || !provider.publicKey) {
    await provider.connect();
  }

  const userPubkey = provider.publicKey ?? (await provider.connect()).publicKey;
  const vaultPda = getVaultPda();
  const userStatePda = getUserStatePda(userPubkey);
  const amountLamports = BigInt(Math.round(amountSol * 1_000_000_000));

  const instruction = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: userStatePda, isSigner: false, isWritable: true },
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(encodeAmount(amountLamports, discriminator)),
  });

  const tx = new Transaction().add(instruction);
  tx.feePayer = userPubkey;

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;

  const result = await provider.signAndSendTransaction(tx);
  const signature = resolveSignature(result);

  await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, 'confirmed');
  return signature;
}

export const vaultService = {
  deposit(amountSol: number) {
    return sendVaultInstruction(DEPOSIT_DISCRIMINATOR, amountSol);
  },

  withdraw(amountSol: number) {
    return sendVaultInstruction(WITHDRAW_DISCRIMINATOR, amountSol);
  },
};
