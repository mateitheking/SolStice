import { Settings, WalletState } from '../types';

export const defaultWallet: WalletState = {
  connected: false,
  address: null,
  balance: 0,
  network: 'Devnet',
};

export const defaultSettings: Settings = {
  theme: 'light',
  notificationsEnabled: true,
  apiMode: 'mock',
};
