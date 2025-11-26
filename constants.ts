import { Trade, TradeStatus, Tag, Strategy } from './types';

export const MOCK_TAGS: Tag[] = [
  { id: 't1', label: 'Chased Price', color: 'bg-rose-500/20 text-rose-400 border border-rose-500/30', category: 'mistake' },
  { id: 't2', label: 'Revenge Trade', color: 'bg-rose-500/20 text-rose-400 border border-rose-500/30', category: 'mistake' },
  { id: 't3', label: 'London Breakout', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', category: 'setup' },
  { id: 't4', label: 'Gold Rejection', color: 'bg-brand-500/20 text-brand-400 border border-brand-500/30', category: 'setup' },
  { id: 't5', label: 'Patience', color: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30', category: 'habit' },
  { id: 't6', label: 'News Event', color: 'bg-slate-500/20 text-slate-400 border border-slate-500/30', category: 'custom' },
];

export const MOCK_STRATEGIES: Strategy[] = [
  {
    id: 's1',
    title: 'XAUUSD Liquidity Sweep',
    symbol: 'XAUUSD',
    items: [
      { id: 'r1', text: 'Wait for Asian High/Low sweep', checked: false },
      { id: 'r2', text: 'M5 Change of Character (CHoCH)', checked: true },
      { id: 'r3', text: 'Enter on FVG retracement', checked: false },
    ]
  },
  {
    id: 's2',
    title: 'GJ Asian Bounce',
    symbol: 'GBPJPY',
    items: [
      { id: 'r4', text: 'Price at Asian Range Low', checked: false },
      { id: 'r5', text: 'Bullish Engulfing on M15', checked: false },
    ]
  },
  {
    id: 's3',
    title: 'EU NY Continuation',
    symbol: 'EURUSD',
    items: [
      { id: 'r6', text: 'London Trend is clear', checked: false },
      { id: 'r7', text: 'Retest of Broken Structure', checked: false },
    ]
  }
];

// Journal starts empty as requested
export const MOCK_TRADES: Trade[] = [];