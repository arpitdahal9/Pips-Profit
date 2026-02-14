export enum TradeStatus {
  OPEN = 'OPEN',
  WIN = 'WIN',
  LOSS = 'LOSS',
  BE = 'BE' // Break Even
}

export type TradingSession = 'Asian Open' | 'Asian' | 'Pre London' | 'London Open' | 'London' | 'London NY Overlap' | 'NY Open' | 'NY Session' | 'NY Close';

export interface Tag {
  id: string;
  label: string;
  color: string; // Tailwind class
  category: 'mistake' | 'setup' | 'habit' | 'custom';
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Strategy {
  id: string;
  title: string;
  symbol: string; // The pair this strategy applies to (e.g., XAUUSD)
  items: ChecklistItem[];
  photos?: string[]; // Array of Base64 or URLs for setup screenshots
}

export interface Trade {
  id: string;
  symbol: string; // e.g., XAUUSD
  tradingViewSymbol?: string; // OANDA:XAUUSD
  date: string;
  time: string;
  tradeTime?: string; // ISO string for actual trade execution time (date + time)
  session: TradingSession;
  side: 'LONG' | 'SHORT';
  status: TradeStatus;
  pnl: number;
  entryPrice: number;
  exitPrice: number;
  lots: number; // Forex Lot Size
  pips: number; // Pips gained/lost
  rating: number; // 1-5
  strategyId?: string;
  tags: string[]; // tag IDs
  notes: string;
  // New fields from interactive wizard
  tradeType?: 'Buy' | 'Sell';
  timeframe?: string;
  strategy?: string;
  customStrategy?: string;
  planDiscipline?: boolean;
  tradedDuringNews?: boolean;
  riskAmount?: number;
  tpAmount?: number;
  overTraded?: boolean;
  emotion?: string;
  mistakes?: string[]; // Array of mistake descriptions
  photo?: string; // Base64 or URL (deprecated, use photos array)
  photos?: string[]; // Array of Base64 or URLs for multiple screenshots
  // Account linking
  accountId?: string; // Which account this trade belongs to
  includeInAccount?: boolean; // Whether to include in account balance calculations
  commission?: number; // Commission amount (always negative, deducted from P&L)
  // Risk:Reward (only set for winning trades)
  riskRewardRatio?: number; // e.g., 2 means 1:2 R:R
  archived?: boolean; // Whether the trade is archived
  timestamp?: any; // Firestore server timestamp
}

export interface DashboardStats {
  netPnl: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  tradesCount: number;
}

export interface TradingAccount {
  id: string;
  name: string;
  broker?: string;
  startingBalance: number;
  currencySymbol?: string; // e.g., '$', '£', '€'
  commissionPerLot?: number; // Optional commission per lot
  isMain: boolean;
  isHidden: boolean;
  createdAt: string;
}