import { WalletState } from '../types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const randomAddress = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let result = '';
  for (let i = 0; i < 44; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

export const walletService = {
  async connectWallet(): Promise<WalletState> {
    await wait(800);

    return {
      connected: true,
      address: randomAddress(),
      balance: Number((2 + Math.random() * 8).toFixed(4)),
      network: 'Devnet',
    };
  },

  async refreshBalance(wallet: WalletState): Promise<WalletState> {
    await wait(500);

    return {
      ...wallet,
      balance: Number((Math.max(0, wallet.balance + (Math.random() - 0.4) * 0.5)).toFixed(4)),
    };
  },

  async disconnectWallet(): Promise<WalletState> {
    await wait(300);

    return {
      connected: false,
      address: null,
      balance: 0,
      network: 'Devnet',
    };
  },
};
