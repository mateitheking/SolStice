import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, User, WalletState } from '../types';

const KEYS = {
  USER: 'ai_trading_user',
  SETTINGS: 'ai_trading_settings',
  WALLET: 'ai_trading_wallet',
  USERS: 'ai_trading_users',
};

const safeParse = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const storageService = {
  async getUser() {
    return safeParse<User>(await AsyncStorage.getItem(KEYS.USER));
  },

  async setUser(user: User | null) {
    if (!user) {
      await AsyncStorage.removeItem(KEYS.USER);
      return;
    }

    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async getWallet() {
    return safeParse<WalletState>(await AsyncStorage.getItem(KEYS.WALLET));
  },

  async setWallet(wallet: WalletState) {
    await AsyncStorage.setItem(KEYS.WALLET, JSON.stringify(wallet));
  },

  async getSettings() {
    return safeParse<Settings>(await AsyncStorage.getItem(KEYS.SETTINGS));
  },

  async setSettings(settings: Settings) {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  async getUsers() {
    return safeParse<Array<{ email: string; password: string }>>(await AsyncStorage.getItem(KEYS.USERS)) ?? [];
  },

  async setUsers(users: Array<{ email: string; password: string }>) {
    await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },
};
