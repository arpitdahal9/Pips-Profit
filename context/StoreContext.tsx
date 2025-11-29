import React, { createContext, useContext, useState, useEffect, useCallback, PropsWithChildren } from 'react';
import { Trade, Strategy, Tag, TradingAccount } from '../types';
import { MOCK_TRADES, MOCK_STRATEGIES, MOCK_TAGS } from '../constants';

interface UserProfile {
  name: string;
  pin: string;
  avatar?: string;
}

interface AppSettings {
  autoExport: boolean;
  lastExportDate?: string;
  defaultTradeInputMode?: 'interactive' | 'form';
}

// Export data format
interface ExportData {
  version: string;
  exportDate: string;
  trades: Trade[];
  accounts: TradingAccount[];
  strategies: Strategy[];
  tags: Tag[];
  user?: { name: string; avatar?: string };
}

interface StoreContextType {
  user: UserProfile | null;
  updateUser: (updates: Partial<UserProfile>) => void;
  trades: Trade[];
  strategies: Strategy[];
  tags: Tag[];
  accounts: TradingAccount[];
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
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
  exportData: () => void;
  importData: (file: File) => Promise<{ success: boolean; message: string }>;
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

  const loadSettings = (): AppSettings => {
    try {
      const stored = localStorage.getItem('velox_settings');
      if (stored) {
        return JSON.parse(stored);
      }
      return { autoExport: false };
    } catch (e) {
      console.error("Failed to parse settings from localStorage");
      return { autoExport: false };
    }
  };

  const [user, setUser] = useState<UserProfile | null>(null);
  const [trades, setTrades] = useState<Trade[]>(loadTrades);
  const [strategies, setStrategies] = useState<Strategy[]>(loadStrategies);
  const [tags, setTags] = useState<Tag[]>(loadTags);
  const [accounts, setAccounts] = useState<TradingAccount[]>(loadAccounts);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

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

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('velox_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

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

  // Export function - works on both web and native (Android/iOS)
  const performExport = useCallback(async () => {
    const backupData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      trades,
      accounts,
      strategies,
      tags,
      user: user ? { name: user.name, avatar: user.avatar } : undefined
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `pipsprofit-backup-${new Date().toISOString().split('T')[0]}.json`;

    // Check if running on native platform (Capacitor)
    const isNative = typeof (window as any).Capacitor !== 'undefined' && 
                     (window as any).Capacitor.isNativePlatform && 
                     (window as any).Capacitor.isNativePlatform();

    if (isNative) {
      try {
        // Use Capacitor Filesystem and Share plugins for native
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        // Write file to cache directory
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Cache,
          encoding: 'utf8' as any
        });

        // Share the file so user can save it wherever they want
        await Share.share({
          title: 'PipsProfit Backup',
          text: 'Your trading journal backup',
          url: result.uri,
          dialogTitle: 'Save your backup file'
        });

        // Update last export date
        setSettings(prev => ({ ...prev, lastExportDate: new Date().toISOString() }));
      } catch (error) {
        console.error('Native export failed:', error);
        // Fallback to web method if native fails
        downloadViaWeb(jsonString, fileName);
      }
    } else {
      // Web browser - use standard download
      downloadViaWeb(jsonString, fileName);
    }
  }, [trades, accounts, strategies, tags, user]);

  // Helper function for web download
  const downloadViaWeb = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Update last export date
    setSettings(prev => ({ ...prev, lastExportDate: new Date().toISOString() }));
  };

  const exportData = () => {
    performExport();
  };

  const importData = async (file: File): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data: ExportData = JSON.parse(content);

          // Validate the data structure
          if (!data.version || !data.trades) {
            resolve({ success: false, message: 'Invalid backup file format' });
            return;
          }

          // Import the data
          if (data.trades && Array.isArray(data.trades)) {
            setTrades(data.trades);
          }
          if (data.accounts && Array.isArray(data.accounts)) {
            setAccounts(data.accounts);
          }
          if (data.strategies && Array.isArray(data.strategies)) {
            setStrategies(data.strategies);
          }
          if (data.tags && Array.isArray(data.tags)) {
            setTags(data.tags);
          }
          if (data.user) {
            setUser(prev => prev ? { ...prev, name: data.user!.name, avatar: data.user!.avatar } : prev);
          }

          resolve({ 
            success: true, 
            message: `Imported ${data.trades.length} trades, ${data.accounts?.length || 0} accounts` 
          });
        } catch (err) {
          resolve({ success: false, message: 'Failed to parse backup file' });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, message: 'Failed to read file' });
      };
      reader.readAsText(file);
    });
  };

  const addTrade = (trade: Trade) => {
    setTrades(prev => {
      const newTrades = [trade, ...prev];
      // Auto-export if enabled
      if (settings.autoExport) {
        setTimeout(() => performExport(), 500);
      }
      return newTrades;
    });
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
    const account = accounts.find(a => a.id === id);
    
    // If deleting main account and there are other accounts, set another as main
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
    
    // Allow deleting any account, including the last one
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
      settings,
      updateSettings,
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
      getAccountBalance,
      exportData,
      importData
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
