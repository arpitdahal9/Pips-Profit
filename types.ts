export enum TradeStatus {
  OPEN = 'OPEN',
  WIN = 'WIN',
  LOSS = 'LOSS',
  BE = 'BE' // Break Even
}

export type TradingSession = 'London' | 'New York' | 'Asian' | 'Overlap';

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
}

export interface Trade {
  id: string;
  symbol: string; // e.g., XAUUSD
  tradingViewSymbol?: string; // OANDA:XAUUSD
  date: string;
  time: string;
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
  photo?: string; // Base64 or URL
  // Account linking
  accountId?: string; // Which account this trade belongs to
  includeInAccount?: boolean; // Whether to include in account balance calculations
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
  isMain: boolean;
  isHidden: boolean;
  createdAt: string;
}