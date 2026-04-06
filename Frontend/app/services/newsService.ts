import { NewsItem } from '../types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const newsMock: NewsItem[] = [
  {
    id: 'n1',
    source: 'CoinDesk',
    title: 'Solana ecosystem sees growth in DeFi volume',
    summary: 'Weekly DeFi activity on Solana increased as liquidity rotated back into major protocols.',
    publishedAt: '2026-03-31T12:20:00Z',
    url: 'https://www.coindesk.com/',
  },
  {
    id: 'n2',
    source: 'The Block',
    title: 'AI agents become more common in algorithmic trading desks',
    summary: 'Institutional teams expand usage of AI co-pilots for signal triage and risk monitoring.',
    publishedAt: '2026-03-31T09:45:00Z',
    url: 'https://www.theblock.co/',
  },
  {
    id: 'n3',
    source: 'Decrypt',
    title: 'Tokenized assets trend continues across web3 startups',
    summary: 'Startups push tokenized strategies that combine on-chain settlement with off-chain analytics.',
    publishedAt: '2026-03-30T19:05:00Z',
    url: 'https://decrypt.co/',
  },
  {
    id: 'n4',
    source: 'Cointelegraph',
    title: 'Developers focus on UX for mainstream crypto apps',
    summary: 'Product teams prioritize cleaner design and simplified flows to improve user retention.',
    publishedAt: '2026-03-30T15:30:00Z',
    url: 'https://cointelegraph.com/',
  },
];

export const newsService = {
  async fetchPublicNews(): Promise<NewsItem[]> {
    await wait(500);
    return newsMock;
  },
};
