import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Platform } from 'react-native';
import { WalletState } from '../types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DEVNET_RPC = 'https://api.devnet.solana.com';
const connection = new Connection(DEVNET_RPC, 'confirmed');

const fetchOnChainBalance = async (address: string): Promise<number> => {
  const pubkey = new PublicKey(address);
  const lamports = await connection.getBalance(pubkey);
  return Number((lamports / LAMPORTS_PER_SOL).toFixed(4));
};

const connectPhantom = async (): Promise<WalletState> => {
  if (Platform.OS !== 'web') {
    throw new Error('Phantom connection is currently available on web only.');
  }

  const solana = (window as any).solana;

  if (!solana?.isPhantom) {
    throw new Error('Phantom wallet extension not found.');
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
};

export const walletService = {
  async connectWallet(): Promise<WalletState> {
    return connectPhantom();
  },

  async refreshBalance(wallet: WalletState): Promise<WalletState> {
    if (!wallet.address) {
      return wallet;
    }

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
