import { DashboardSnapshot, Decision } from '../types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const decisionsMock: Decision[] = [
  {
    id: '1',
    timestamp: '2026-03-31T09:10:00Z',
    action: 'BUY',
    explanation: 'Momentum breakout confirmed. Position opened with conservative risk.',
    price: 179.2,
  },
  {
    id: '2',
    timestamp: '2026-03-31T11:20:00Z',
    action: 'HOLD',
    explanation: 'Market entered range. AI paused until volatility normalizes.',
    price: 180.3,
  },
  {
    id: '3',
    timestamp: '2026-03-31T14:45:00Z',
    action: 'SELL',
    explanation: 'Take-profit triggered after RSI divergence on short timeframe.',
    price: 184.1,
  },
  {
    id: '4',
    timestamp: '2026-03-31T16:10:00Z',
    action: 'BUY',
    explanation: 'Re-entry after support retest and buy volume recovery.',
    price: 182.8,
  },
  {
    id: '5',
    timestamp: '2026-03-31T18:35:00Z',
    action: 'HOLD',
    explanation: 'No edge currently. Agent keeps portfolio unchanged.',
    price: 183.4,
  },
];

let vaultBalance = 12.45;

const generateHistory = () =>
  Array.from({ length: 12 }, (_, index) => {
    const base = 174 + index * 1.2;
    const noise = Math.random() * 3;
    return Number((base + noise).toFixed(2));
  });

export const decisionService = {
  async fetchDecisions() {
    await wait(500);
    return decisionsMock;
  },

  async fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
    await wait(550);

    const solPrice = Number((182 + Math.random() * 5).toFixed(2));
    const profitLoss = Number(((Math.random() - 0.2) * 12).toFixed(2));

    return {
      solPrice,
      profitLoss,
      tradesCount: decisionsMock.length,
      agentStatus: Math.random() > 0.2 ? 'Active' : 'Idle',
      vaultBalance,
      history: generateHistory(),
    };
  },

  async deposit(amount: number) {
    await wait(800);
    vaultBalance += amount;
    return { success: true, vaultBalance };
  },

  async withdraw(amount: number) {
    await wait(800);
    vaultBalance = Math.max(0, vaultBalance - amount);
    return { success: true, vaultBalance };
  },
};
