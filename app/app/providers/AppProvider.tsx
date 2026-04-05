import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultSettings, defaultWallet } from '../constants/defaults';
import { authService } from '../services/authService';
import { decisionService } from '../services/decisionService';
import { storageService } from '../services/storageService';
import { walletService } from '../services/walletService';
import { Settings, StrategyType, User, WalletState } from '../types';

type AppContextValue = {
  user: User | null;
  wallet: WalletState;
  settings: Settings;
  strategy: StrategyType;
  authLoading: boolean;
  appReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  connectWallet: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  setStrategy: (value: StrategyType) => void;
  updateSettings: (value: Partial<Settings>) => Promise<void>;
  deposit: (amount: number) => Promise<number>;
  withdraw: (amount: number) => Promise<number>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletState>(defaultWallet);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [strategy, setStrategy] = useState<StrategyType>('Conservative');
  const [authLoading, setAuthLoading] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        setAppReady(true);
      }
    }, 2200);

    (async () => {
      try {
        const [storedUser, storedWallet, storedSettings] = await Promise.all([
          storageService.getUser(),
          storageService.getWallet(),
          storageService.getSettings(),
        ]);

        if (!mounted) {
          return;
        }

        if (storedUser) {
          setUser(storedUser);
        }

        if (storedWallet) {
          setWallet(storedWallet);
        }

        if (storedSettings) {
          setSettings(storedSettings);
        }
      } catch (error) {
        console.warn('App initialization fallback:', error);
      } finally {
        if (mounted) {
          setAppReady(true);
        }
      }
    })();

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  const persistUser = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);
    await storageService.setUser(nextUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const nextUser = await authService.login(email, password);
      await persistUser(nextUser);
    } finally {
      setAuthLoading(false);
    }
  }, [persistUser]);

  const register = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const nextUser = await authService.register(email, password);
      await persistUser(nextUser);
    } finally {
      setAuthLoading(false);
    }
  }, [persistUser]);

  const continueAsGuest = useCallback(async () => {
    setAuthLoading(true);
    try {
      const nextUser = await authService.continueAsGuest();
      await persistUser(nextUser);
    } finally {
      setAuthLoading(false);
    }
  }, [persistUser]);

  const logout = useCallback(async () => {
    await persistUser(null);
  }, [persistUser]);

  const connectWallet = useCallback(async () => {
    const nextWallet = await walletService.connectWallet();
    setWallet(nextWallet);
    await storageService.setWallet(nextWallet);
  }, []);

  const refreshWallet = useCallback(async () => {
    if (!wallet.connected) {
      return;
    }

    const refreshed = await walletService.refreshBalance(wallet);
    setWallet(refreshed);
    await storageService.setWallet(refreshed);
  }, [wallet]);

  const disconnectWallet = useCallback(async () => {
    const nextWallet = await walletService.disconnectWallet();
    setWallet(nextWallet);
    await storageService.setWallet(nextWallet);
  }, []);

  const updateSettings = useCallback(async (value: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...value };
      void storageService.setSettings(next);
      return next;
    });
  }, []);

  const deposit = useCallback(async (amount: number) => {
    const response = await decisionService.deposit(amount);
    return response.vaultBalance;
  }, []);

  const withdraw = useCallback(async (amount: number) => {
    const response = await decisionService.withdraw(amount);
    return response.vaultBalance;
  }, []);

  const value = useMemo(
    () => ({
      user,
      wallet,
      settings,
      strategy,
      authLoading,
      appReady,
      login,
      register,
      continueAsGuest,
      logout,
      connectWallet,
      refreshWallet,
      disconnectWallet,
      setStrategy,
      updateSettings,
      deposit,
      withdraw,
    }),
    [
      user,
      wallet,
      settings,
      strategy,
      authLoading,
      appReady,
      login,
      register,
      continueAsGuest,
      logout,
      connectWallet,
      refreshWallet,
      disconnectWallet,
      updateSettings,
      deposit,
      withdraw,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }

  return context;
}
