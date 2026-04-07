import { DashboardSnapshot, Decision, DecisionAction } from '../types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Price fetching ---
const fetchSolPriceFromAPI = async (): Promise<number> => {
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
  const request = fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd').then((res) =>
    res.json()
  );
  const data = await Promise.race([request, timeout]);
  return Number(data.solana.usd);
};

const fetchSolPrice = async (): Promise<number> => {
  try {
    return await fetchSolPriceFromAPI();
  } catch {
    // Fallback: drift from last known price to stay realistic
    const base = lastPrice ?? 155;
    const drift = (Math.random() - 0.5) * 1.5;
    return Number((base + drift).toFixed(2));
  }
};

// --- AI decision generator ---
const REASONS: Record<DecisionAction, string[]> = {
  BUY: [
    'Momentum breakout confirmed above key resistance. Position opened with conservative risk.',
    'RSI oversold with bullish divergence on 4H chart. Strong accumulation signal detected.',
    'Volume surge confirms uptrend continuation. AI entering long position.',
    'Support level held after retest. Whale accumulation pattern detected on-chain.',
    'MACD crossover on 1H with rising volume. Favorable risk/reward for entry.',
    'Fear & Greed index at extreme fear with improving on-chain metrics. Contrarian buy.',
  ],
  SELL: [
    'Take-profit triggered after RSI divergence on short timeframe. Position closed.',
    'Price rejected at major resistance with bearish engulfing candle. Exit executed.',
    'Profit target reached. Reducing exposure ahead of potential pullback.',
    'Negative funding rates and declining buy volume. Defensive exit triggered.',
    'Overbought RSI (>78) with declining volume. Locking in gains.',
    'Smart money selling detected on-chain. Position closed to manage risk.',
  ],
  HOLD: [
    'Market entered range-bound phase. AI paused until volatility normalizes.',
    'Mixed signals across timeframes. Waiting for directional confirmation.',
    'Low-conviction setup. No edge detected — preserving capital.',
    'Consolidation phase near key level. Monitoring for breakout signals.',
    'Risk parameters unchanged. Current market structure does not favor new positions.',
    'Price action indecisive. Agent holding and reassessing next cycle.',
  ],
};

let idCounter = 10;

const generateDecision = (price: number, prevPrice: number | null): Decision => {
  let action: DecisionAction;
  let confidence: number;

  if (prevPrice === null) {
    action = 'HOLD';
    confidence = 52 + Math.floor(Math.random() * 18);
  } else {
    const changePct = ((price - prevPrice) / prevPrice) * 100;
    if (changePct > 0.4) {
      action = Math.random() > 0.25 ? 'BUY' : 'HOLD';
      confidence = 62 + Math.floor(Math.random() * 28);
    } else if (changePct < -0.4) {
      action = Math.random() > 0.25 ? 'SELL' : 'HOLD';
      confidence = 60 + Math.floor(Math.random() * 30);
    } else if (changePct > 0.15) {
      action = Math.random() > 0.5 ? 'BUY' : 'HOLD';
      confidence = 50 + Math.floor(Math.random() * 22);
    } else if (changePct < -0.15) {
      action = Math.random() > 0.5 ? 'SELL' : 'HOLD';
      confidence = 50 + Math.floor(Math.random() * 22);
    } else {
      action = 'HOLD';
      confidence = 45 + Math.floor(Math.random() * 20);
    }
  }

  const reasons = REASONS[action];
  const explanation = reasons[Math.floor(Math.random() * reasons.length)];

  return {
    id: String(++idCounter),
    timestamp: new Date().toISOString(),
    action,
    explanation,
    price,
    confidence,
  };
};

// --- Module-level live state ---
let liveDecisions: Decision[] = [
  {
    id: '1',
    timestamp: '2026-04-04T04:10:00Z',
    action: 'BUY',
    explanation: 'Momentum breakout confirmed above key resistance. Position opened with conservative risk.',
    price: 152.4,
    confidence: 81,
  },
  {
    id: '2',
    timestamp: '2026-04-04T04:40:00Z',
    action: 'HOLD',
    explanation: 'Market entered range-bound phase. AI paused until volatility normalizes.',
    price: 153.1,
    confidence: 58,
  },
  {
    id: '3',
    timestamp: '2026-04-04T05:10:00Z',
    action: 'SELL',
    explanation: 'Overbought RSI (>78) with declining volume. Locking in gains.',
    price: 156.8,
    confidence: 74,
  },
  {
    id: '4',
    timestamp: '2026-04-04T05:40:00Z',
    action: 'BUY',
    explanation: 'Support level held after retest. Whale accumulation pattern detected on-chain.',
    price: 154.3,
    confidence: 77,
  },
  {
    id: '5',
    timestamp: '2026-04-04T06:10:00Z',
    action: 'HOLD',
    explanation: 'Mixed signals across timeframes. Waiting for directional confirmation.',
    price: 155.9,
    confidence: 52,
  },
  {
    id: '6',
    timestamp: '2026-04-04T06:40:00Z',
    action: 'BUY',
    explanation: 'MACD crossover on 1H with rising volume. Favorable risk/reward for entry.',
    price: 157.2,
    confidence: 83,
  },
  {
    id: '7',
    timestamp: '2026-04-04T07:10:00Z',
    action: 'SELL',
    explanation: 'Smart money selling detected on-chain. Position closed to manage risk.',
    price: 159.6,
    confidence: 69,
  },
];

let priceHistory: number[] = [152.4, 153.1, 156.8, 154.3, 155.9, 157.2, 159.6];
let lastPrice: number | null = 159.6;
let vaultBalance = 12.45;

const normalizeMarketState = (currentPrice: number, previousPrice: number) => {
  const ratio = currentPrice / previousPrice;
  priceHistory = priceHistory.map((price) => Number((price * ratio).toFixed(2)));
  liveDecisions = liveDecisions.map((decision) => ({
    ...decision,
    price: Number((decision.price * ratio).toFixed(2)),
  }));
};

export const decisionService = {
  async fetchDecisions(): Promise<Decision[]> {
    await wait(150);
    return [...liveDecisions];
  },

  async fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
    const solPrice = await fetchSolPrice();
    const prevPrice = lastPrice;

    if (prevPrice && Math.abs(solPrice - prevPrice) / prevPrice > 0.15) {
      normalizeMarketState(solPrice, prevPrice);
    }

    const newDecision = generateDecision(solPrice, prevPrice && Math.abs(solPrice - prevPrice) / prevPrice > 0.15 ? solPrice : prevPrice);
    liveDecisions = [...liveDecisions, newDecision];

    priceHistory = [...priceHistory.slice(-11), solPrice];
    lastPrice = solPrice;

    const profitLoss = Number(
      liveDecisions
        .slice(-10)
        .reduce((acc, d) => acc + (d.action === 'BUY' ? 1 : d.action === 'SELL' ? -0.5 : 0), 0)
        .toFixed(2)
    );

    const agentStatus = newDecision.action !== 'HOLD' ? 'Active' : 'Idle';

    return {
      solPrice,
      profitLoss,
      tradesCount: liveDecisions.filter((d) => d.action !== 'HOLD').length,
      agentStatus,
      vaultBalance,
      history: priceHistory,
      latestDecision: newDecision,
    };
  },
};
