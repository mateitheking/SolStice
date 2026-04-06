import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Platform } from 'react-native';
import { WalletState } from '../types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DEVNET_RPC = 'https://api.devnet.solana.com';
const connection = new Connection(DEVNET_RPC, 'confirmed');

const randomAddress = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let result = '';
  for (let i = 0; i < 44; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const fetchOnChainBalance = async (address: string): Promise<number> => {
  try {
    const pubkey = new PublicKey(address);
    const lamports = await connection.getBalance(pubkey);
    return Number((lamports / LAMPORTS_PER_SOL).toFixed(4));
  } catch {
    return Number((2 + Math.random() * 8).toFixed(4));
  }
};

const connectPhantom = async (): Promise<WalletState | null> => {
  if (Platform.OS !== 'web') {
    return null;
  }

  try {
    const solana = (window as any).solana;

    if (!solana?.isPhantom) {
      return null;
    }

    const response = await solana.connect();
    const address: string = response.publicKey.toString();
    const balance = await fetchOnChainBalance(address);

    return {
      connected: true,
      address,
      balance,
      network: 'Devnet',
    };
  } catch {
    return null;
  }
};

export const walletService = {
  async connectWallet(): Promise<WalletState> {
    // Try real Phantom extension first (web only)
    const phantom = await connectPhantom();
    if (phantom) {
      return phantom;
    }

    // Fallback: mock wallet for mobile / no Phantom installed
    await wait(800);
    const address = randomAddress();
    return {
      connected: true,
      address,
      balance: Number((2 + Math.random() * 8).toFixed(4)),
      network: 'Devnet',
    };
  },

  async refreshBalance(wallet: WalletState): Promise<WalletState> {
    if (!wallet.address) {
      return wallet;
    }

    // Try to fetch real on-chain balance
    const balance = await fetchOnChainBalance(wallet.address);
    return { ...wallet, balance };
  },

  async disconnectWallet(): Promise<WalletState> {
    if (Platform.OS === 'web') {
      try {
        const solana = (window as any).solana;
        if (solana?.isPhantom && solana.isConnected) {
          await solana.disconnect();
        }
      } catch {
        // ignore
      }
    }

    await wait(300);
    return {
      connected: false,
      address: null,
      balance: 0,
      network: 'Devnet',
    };
  },
};
