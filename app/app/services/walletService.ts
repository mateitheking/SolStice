import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Platform } from 'react-native';
import { DEVNET_RPC } from '../lib/sdk';
import { WalletState } from '../types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const connection = new Connection(DEVNET_RPC, 'confirmed');
const normalizeAddress = (address: string) => address.trim();

const fetchOnChainBalance = async (address: string): Promise<number> => {
  try {
    const pubkey = new PublicKey(address);
    const lamports = await connection.getBalance(pubkey);
    return Number((lamports / LAMPORTS_PER_SOL).toFixed(4));
  } catch {
    return 0;
  }
};

const connectPhantom = async (): Promise<WalletState | null> => {
  if (Platform.OS !== 'web') return null;
  try {
    const solana = (window as any).solana;
    if (!solana?.isPhantom) return null;
    const response = await solana.connect();
    const address: string = response.publicKey.toString();
    const balance = await fetchOnChainBalance(address);
    return { connected: true, address, balance, network: 'Devnet' };
  } catch {
    return null;
  }
};

const connectWithAddress = async (address: string): Promise<WalletState> => {
  const trimmed = normalizeAddress(address);
  if (!trimmed) {
    throw new Error('Wallet address required');
  }
  const pubkey = new PublicKey(trimmed);
  const normalized = pubkey.toBase58();
  const balance = await fetchOnChainBalance(normalized);
  return { connected: true, address: normalized, balance, network: 'Devnet' };
};

export const walletService = {
  async connectWallet(): Promise<WalletState> {
    const phantom = await connectPhantom();
    if (phantom) return phantom;
    throw new Error('Phantom is only available on web. On mobile, paste a Devnet address in the wallet screen.');
  },

  async connectWithAddress(address: string): Promise<WalletState> {
    return connectWithAddress(address);
  },

  async refreshBalance(wallet: WalletState): Promise<WalletState> {
    if (!wallet.address) return wallet;
    const balance = await fetchOnChainBalance(wallet.address);
    return { ...wallet, balance };
  },

  async disconnectWallet(): Promise<WalletState> {
    if (Platform.OS === 'web') {
      try {
        const solana = (window as any).solana;
        if (solana?.isPhantom && solana.isConnected) await solana.disconnect();
      } catch {}
    }
    await wait(100);
    return { connected: false, address: null, balance: 0, network: 'Devnet' };
  },
};
