import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { Trade, Strategy, Tag, TradingAccount } from '../types';
import { MOCK_TRADES, MOCK_STRATEGIES, MOCK_TAGS } from '../constants';

interface UserProfile {
  name: string;
  pin: string;
}

interface StoreContextType {
  user: UserProfile | null;
  updateUser: (updates: Partial<UserProfile>) => void;
  trades: Trade[];
  strategies: Strategy[];
  tags: Tag[];
  accounts: TradingAccount[];
  deleteTrade: (id: string) => void;
  addTrade: (trade: Trade) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  addStrategy: (strategy: Strategy) => void;
  deleteStrategy: (id: string) => void;
  addTag: (tag: Tag) => void;
  deleteTag: (id: string) => void;
  addAccount: (account: TradingAccount) => void;
  updateAccount: (id: string, updates: Partial<TradingAccount>) => void;
  deleteAccount: (id: string) => void;
  setMainAccount: (id: string) => void;
  getMainAccount: () => TradingAccount | undefined;
  getAccountBalance: (accountId: string) => number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: PropsWithChildren) => {
  // Load initial data from localStorage or use defaults
  const loadTrades = (): Trade[] => {
    try {
      const stored = localStorage.getItem('velox_trades');
      return stored ? JSON.parse(stored) : MOCK_TRADES;
    } catch (e) {
      console.error("Failed to parse trades from localStorage");
      return MOCK_TRADES;
    }
  };

  const loadStrategies = (): Strategy[] => {
    try {
      const stored = localStorage.getItem('velox_strategies');
      return stored ? JSON.parse(stored) : MOCK_STRATEGIES;
    } catch (e) {
      console.error("Failed to parse strategies from localStorage");
      return MOCK_STRATEGIES;
    }
  };

  const loadTags = (): Tag[] => {
    try {
      const stored = localStorage.getItem('velox_tags');
      return stored ? JSON.parse(stored) : MOCK_TAGS;
    } catch (e) {
      console.error("Failed to parse tags from localStorage");
      return MOCK_TAGS;
    }
  };

  const loadAccounts = (): TradingAccount[] => {
    try {
      const stored = localStorage.getItem('velox_accounts');
      if (stored) {
        return JSON.parse(stored);
      }
      // No default accounts - user must add their own
      return [];
    } catch (e) {
      console.error("Failed to parse accounts from localStorage");
      return [];
    }
  };

  const [user, setUser] = useState<UserProfile | null>(null);
  const [trades, setTrades] = useState<Trade[]>(loadTrades);
  const [strategies, setStrategies] = useState<Strategy[]>(loadStrategies);
  const [tags, setTags] = useState<Tag[]>(loadTags);
  const [accounts, setAccounts] = useState<TradingAccount[]>(loadAccounts);

  // Load user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('velox_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user profile");
      }
    }
  }, []);

  // Persist trades to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('velox_trades', JSON.stringify(trades));
  }, [trades]);

  // Persist strategies to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('velox_strategies', JSON.stringify(strategies));
  }, [strategies]);

  // Persist tags to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('velox_tags', JSON.stringify(tags));
  }, [tags]);

  // Persist accounts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('velox_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('velox_user', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const addTrade = (trade: Trade) => {
    setTrades(prev => [trade, ...prev]);
  };

  const updateTrade = (id: string, updates: Partial<Trade>) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addStrategy = (strategy: Strategy) => {
    setStrategies(prev => [...prev, strategy]);
  };

  const deleteStrategy = (id: string) => {
    setStrategies(prev => prev.filter(s => s.id !== id));
  };

  const addTag = (tag: Tag) => {
    setTags(prev => [...prev, tag]);
  };

  const deleteTag = (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
  };

  const addAccount = (account: TradingAccount) => {
    setAccounts(prev => [...prev, account]);
  };

  const updateAccount = (id: string, updates: Partial<TradingAccount>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAccount = (id: string) => {
    // Don't allow deleting the main account if it's the only one
    const account = accounts.find(a => a.id === id);
    if (account?.isMain && accounts.length === 1) return;
    
    // If deleting main account, set another as main
    if (account?.isMain && accounts.length > 1) {
      const newMain = accounts.find(a => a.id !== id);
      if (newMain) {
        setAccounts(prev => prev
          .filter(a => a.id !== id)
          .map(a => a.id === newMain.id ? { ...a, isMain: true } : a)
        );
        return;
      }
    }
    
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const setMainAccount = (id: string) => {
    setAccounts(prev => prev.map(a => ({ ...a, isMain: a.id === id })));
  };

  const getMainAccount = (): TradingAccount | undefined => {
    return accounts.find(a => a.isMain);
  };

  const getAccountBalance = (accountId: string): number => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;
    
    const accountTrades = trades.filter(t => 
      t.accountId === accountId && 
      t.includeInAccount !== false
    );
    
    const totalPnl = accountTrades.reduce((sum, t) => sum + t.pnl, 0);
    return account.startingBalance + totalPnl;
  };

  return (
    <StoreContext.Provider value={{ 
      user,
      updateUser,
      trades, 
      strategies, 
      tags,
      accounts,
      deleteTrade, 
      addTrade,
      updateTrade,
      addStrategy, 
      deleteStrategy,
      addTag,
      deleteTag,
      addAccount,
      updateAccount,
      deleteAccount,
      setMainAccount,
      getMainAccount,
      getAccountBalance
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
