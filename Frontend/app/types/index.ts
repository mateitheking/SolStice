export type AppTheme = 'dark' | 'light';
export type ApiMode = 'mock' | 'real';

export type User = {
  id: string;
  email: string;
  isGuest: boolean;
  createdAt: string;
};

export type WalletState = {
  connected: boolean;
  address: string | null;
  balance: number;
  network: 'Devnet';
};

export type StrategyType = 'Conservative' | 'Aggressive';
export type AgentStatus = 'Active' | 'Idle';

export type DecisionAction = 'BUY' | 'SELL' | 'HOLD';

export type Decision = {
  id: string;
  timestamp: string;
  action: DecisionAction;
  explanation: string;
  price: number;
};

export type Settings = {
  theme: AppTheme;
  notificationsEnabled: boolean;
  apiMode: ApiMode;
};

export type DashboardSnapshot = {
  solPrice: number;
  profitLoss: number;
  tradesCount: number;
  agentStatus: AgentStatus;
  vaultBalance: number;
  history: number[];
};

export type NewsItem = {
  id: string;
  source: string;
  title: string;
  summary: string;
  publishedAt: string;
  url: string;
};
