import React, { createContext, useContext, useState, useEffect, useCallback, PropsWithChildren } from 'react';
import { Trade, Strategy, Tag, TradingAccount } from '../types';
import { MOCK_TRADES, MOCK_STRATEGIES, MOCK_TAGS } from '../constants';
import { onAuthStateChange } from '../src/authService';
import {
  saveTrade,
  updateTrade as updateTradeCloud,
  deleteTrade as deleteTradeCloud,
  subscribeToTrades,
  uploadLocalTrades,
  saveAccount,
  updateAccount as updateAccountCloud,
  deleteAccount as deleteAccountCloud,
  subscribeToAccounts,
  uploadLocalAccounts,
  saveStrategy,
  updateStrategy as updateStrategyCloud,
  deleteStrategy as deleteStrategyCloud,
  subscribeToStrategies,
  uploadLocalStrategies,
  saveTag,
  deleteTag as deleteTagCloud,
  subscribeToTags,
  uploadLocalTags,
  saveSettings,
  subscribeToSettings,
  saveProfile,
  subscribeToProfile
} from '../src/firestoreService';

type SyncStatus = 'offline' | 'syncing' | 'synced';

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
  cloudUser: any;
  syncStatus: SyncStatus;
  isMigrating: boolean;
  forceSyncNow: () => Promise<void>;
  syncToast: string | null;
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
  updateStrategy: (id: string, updates: Partial<Strategy>) => void;
  deleteStrategy: (id: string) => void;
  addTag: (tag: Tag) => void;
  deleteTag: (id: string) => void;
  addAccount: (account: TradingAccount) => void;
  updateAccount: (id: string, updates: Partial<TradingAccount>) => void;
  deleteAccount: (id: string) => void;
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
  const [cloudUser, setCloudUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [isMigrating, setIsMigrating] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState(false);

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
    if (!localStorage.getItem('velox_first_use')) {
      localStorage.setItem('velox_first_use', new Date().toISOString());
    }
  }, []);

  const resetToLocalState = useCallback(() => {
    setTrades(loadTrades());
    setAccounts(loadAccounts());
    setStrategies(loadStrategies());
    setTags(loadTags());
    setSettings(loadSettings());
    const storedUser = localStorage.getItem('velox_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user profile");
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      console.log('Auth state changed', authUser?.uid);
      if (authUser) {
        console.log('User signed in:', authUser.uid);
        setCloudUser(authUser);
        setCloudReady(false);
        setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
      } else {
        setCloudUser(null);
        setCloudReady(false);
        setSyncStatus('offline');
        setIsMigrating(false);
        resetToLocalState();
      }
    });
    return unsubscribe;
  }, [resetToLocalState]);

  useEffect(() => {
    if (!cloudUser) {
      setSyncStatus('offline');
      return;
    }

    const handleNetworkChange = () => {
      if (!navigator.onLine) {
        setSyncStatus('offline');
      } else {
        setSyncStatus('syncing');
      }
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    handleNetworkChange();

    const unsubscribe = subscribeToTrades(cloudUser.uid, ({ trades: remoteTrades, hasPendingWrites, fromCache }) => {
      console.log(`Trades update: ${remoteTrades.length} trades, fromCache: ${fromCache}, hasPendingWrites: ${hasPendingWrites}`);

      // 1. Sort trades on frontend by timestamp/date since we removed server-side orderBy to prevent index errors
      const sortedTrades = [...(remoteTrades as Trade[])].sort((a, b) => {
        const timeA = a.timestamp ? (a.timestamp.seconds || a.timestamp) : new Date(`${a.date}T${a.time || '00:00'}`).getTime();
        const timeB = b.timestamp ? (b.timestamp.seconds || b.timestamp) : new Date(`${b.date}T${b.time || '00:00'}`).getTime();
        return timeB - timeA;
      });

      setTrades(sortedTrades);
      setCloudReady(true);

      if (!navigator.onLine) {
        setSyncStatus('offline');
      } else if (hasPendingWrites) {
        setSyncStatus('syncing');
      } else {
        setSyncStatus('synced');
      }
    }, (error) => {
      console.error('Trades subscription error:', error);
      setSyncStatus('offline');
      setCloudReady(true); // Allow app to continue with local data if cloud fails
    });

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      unsubscribe();
    };
  }, [cloudUser]);

  // Central Migration & Initialization Logic
  useEffect(() => {
    if (!cloudUser) {
      setCloudReady(false);
      return;
    }

    const migrationKey = `velox_cloud_migrated_${cloudUser.uid}`;

    const runInitialization = async () => {
      console.log('Running initialization for user:', cloudUser.uid);

      // If already migrated this user, we just wait for subscriptions to populate state
      if (localStorage.getItem(migrationKey)) {
        console.log('User already migrated. Waiting for cloud data...');
        // We set cloudReady to true once we have some data or after a timeout
        // But better is to wait for the FIRST success of subscribeToTrades
        return;
      }

      // 1. Gather local data
      let localTrades = loadTrades();
      let localAccounts = loadAccounts();
      let localStrategies = loadStrategies();
      let localTags = loadTags();

      // 2. IMPORTANT: Don't migrate mock data (initial demo data)
      // Check if this is real user data or just the mock stuff
      const isMockData = localTrades.length === MOCK_TRADES.length &&
        localTrades.every((t, i) => t.id === MOCK_TRADES[i].id);

      if (isMockData) {
        console.log('Local data is mock data. Skipping migration.');
        localStorage.setItem(migrationKey, '1');
        setCloudReady(true);
        return;
      }

      // 3. Perform Migration
      try {
        console.log('Migrating local data to cloud...', {
          trades: localTrades.length,
          accounts: localAccounts.length
        });

        setIsMigrating(true);
        setSyncStatus('syncing');

        // Parallel upload
        await Promise.all([
          uploadLocalTrades(cloudUser.uid, localTrades),
          uploadLocalAccounts(cloudUser.uid, localAccounts),
          uploadLocalStrategies(cloudUser.uid, localStrategies),
          uploadLocalTags(cloudUser.uid, localTags)
        ]);

        // Settings and Profile migration
        const localSettings = localStorage.getItem('velox_settings');
        if (localSettings) {
          await saveSettings(cloudUser.uid, JSON.parse(localSettings));
        }

        const localProfile = localStorage.getItem('velox_user');
        if (localProfile) {
          const profile = JSON.parse(localProfile);
          await saveProfile(cloudUser.uid, {
            name: profile.name,
            avatar: profile.avatar,
            avatarUrl: profile.avatarUrl
          });
        }

        console.log('Migration successful!');
        localStorage.setItem(migrationKey, '1');
        setSyncToast('Cloud migration complete!');
        setTimeout(() => setSyncToast(null), 3000);
      } catch (error) {
        console.error('Migration failed:', error);
      } finally {
        setIsMigrating(false);
        setCloudReady(true); // Now we can safely switch to cloud mode
      }
    };

    runInitialization();
  }, [cloudUser]);

  const forceSyncNow = async () => {
    if (!cloudUser) return;
    let localTrades: Trade[] = [];
    let localAccounts: TradingAccount[] = [];
    let localStrategies: Strategy[] = [];
    let localTags: Tag[] = [];
    let localSettings: AppSettings | null = null;
    let localProfile: { name?: string; avatar?: string; avatarUrl?: string } | null = null;

    try {
      const stored = localStorage.getItem('velox_trades');
      localTrades = stored ? JSON.parse(stored) : [];
    } catch { }
    try {
      const stored = localStorage.getItem('velox_accounts');
      localAccounts = stored ? JSON.parse(stored) : [];
    } catch { }
    try {
      const stored = localStorage.getItem('velox_strategies');
      localStrategies = stored ? JSON.parse(stored) : [];
    } catch { }
    try {
      const stored = localStorage.getItem('velox_tags');
      localTags = stored ? JSON.parse(stored) : [];
    } catch { }
    try {
      const stored = localStorage.getItem('velox_settings');
      localSettings = stored ? JSON.parse(stored) : null;
    } catch { }
    try {
      const stored = localStorage.getItem('velox_user');
      localProfile = stored ? JSON.parse(stored) : null;
    } catch { }

    setSyncStatus('syncing');
    await uploadLocalTrades(cloudUser.uid, localTrades);
    await uploadLocalAccounts(cloudUser.uid, localAccounts);
    await uploadLocalStrategies(cloudUser.uid, localStrategies);
    await uploadLocalTags(cloudUser.uid, localTags);
    if (localSettings) {
      await saveSettings(cloudUser.uid, localSettings);
    }
    if (localProfile) {
      await saveProfile(cloudUser.uid, {
        name: localProfile.name,
        avatar: localProfile.avatar,
        avatarUrl: localProfile.avatarUrl
      });
    }
    if (navigator.onLine) {
      setSyncStatus('synced');
      setSyncToast('Sync complete');
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  useEffect(() => {
    if (!cloudUser) return;
    const unsubscribe = subscribeToAccounts(cloudUser.uid, (remoteAccounts) => {
      setAccounts(remoteAccounts as TradingAccount[]);
    }, (error) => console.error('Accounts subscription error:', error));
    return unsubscribe;
  }, [cloudUser]);

  useEffect(() => {
    if (!cloudUser) return;
    const unsubscribe = subscribeToStrategies(cloudUser.uid, (remoteStrategies) => {
      setStrategies(remoteStrategies as Strategy[]);
    }, (error) => console.error('Strategies subscription error:', error));
    return unsubscribe;
  }, [cloudUser]);

  useEffect(() => {
    if (!cloudUser) return;
    const unsubscribe = subscribeToTags(cloudUser.uid, (remoteTags) => {
      setTags(remoteTags as Tag[]);
    }, (error) => console.error('Tags subscription error:', error));
    return unsubscribe;
  }, [cloudUser]);

  useEffect(() => {
    if (!cloudUser) return;
    const unsubscribe = subscribeToSettings(cloudUser.uid, (remoteSettings) => {
      if (remoteSettings) {
        setSettings(prev => ({ ...prev, ...remoteSettings }));
      }
    }, (error) => console.error('Settings subscription error:', error));
    return unsubscribe;
  }, [cloudUser]);

  useEffect(() => {
    if (!cloudUser) return;
    console.log('Subscribing to profile for:', cloudUser.uid);
    const unsubscribe = subscribeToProfile(cloudUser.uid, (remoteProfile) => {
      if (remoteProfile) {
        setUser(prev => {
          // Keep local PIN as source of truth for the device
          const localPin = prev?.pin || '';
          const updated = prev
            ? { ...prev, ...remoteProfile, pin: localPin }
            : { name: remoteProfile.name || 'Trader', pin: '', ...remoteProfile } as UserProfile;

          console.log('Profile updated from cloud:', updated.name);
          localStorage.setItem('velox_user', JSON.stringify(updated));
          return updated;
        });
      }
    }, (error) => console.error('Profile subscription error:', error));
    return unsubscribe;
  }, [cloudUser]);

  // Persist trades to localStorage whenever they change
  useEffect(() => {
    if (cloudUser && !cloudReady) return;
    localStorage.setItem('velox_trades', JSON.stringify(trades));
  }, [trades, cloudUser, cloudReady]);

  // Persist strategies to localStorage whenever they change
  useEffect(() => {
    if (cloudUser && !cloudReady) return;
    localStorage.setItem('velox_strategies', JSON.stringify(strategies));
  }, [strategies, cloudUser, cloudReady]);

  // Persist tags to localStorage whenever they change
  useEffect(() => {
    if (cloudUser && !cloudReady) return;
    localStorage.setItem('velox_tags', JSON.stringify(tags));
  }, [tags, cloudUser, cloudReady]);

  // Persist accounts to localStorage whenever they change
  useEffect(() => {
    if (cloudUser && !cloudReady) return;
    localStorage.setItem('velox_accounts', JSON.stringify(accounts));
  }, [accounts, cloudUser, cloudReady]);

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    if (cloudUser && !cloudReady) return;
    localStorage.setItem('velox_settings', JSON.stringify(settings));
  }, [settings, cloudUser, cloudReady]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    const nextSettings = { ...settings, ...updates };
    setSettings(nextSettings);
    if (cloudUser) {
      saveSettings(cloudUser.uid, nextSettings).catch((error) => console.error('Failed to save settings', error));
    }
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...updates } : { name: 'Trader', pin: '', ...updates } as UserProfile;
      localStorage.setItem('velox_user', JSON.stringify(updated));
      if (cloudUser) {
        saveProfile(cloudUser.uid, {
          name: updated.name,
          avatar: updated.avatar,
          avatarUrl: (updated as any).avatarUrl
        }).catch((error) => console.error('Failed to save profile', error));
      }
      return updated;
    });
  };

  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
    if (cloudUser) {
      deleteTradeCloud(cloudUser.uid, id).catch((error) => console.error('Failed to delete trade', error));
    }
  };

  const addTrade = (trade: Trade) => {
    setTrades(prev => {
      const newTrades = [trade, ...prev];
      if (settings.autoExport) {
        setTimeout(() => performExport(), 500);
      }
      return newTrades;
    });
    if (cloudUser) {
      saveTrade(cloudUser.uid, trade).catch((error) => console.error('Failed to save trade', error));
    }
  };

  const updateTrade = (id: string, updates: Partial<Trade>) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (cloudUser) {
      updateTradeCloud(cloudUser.uid, id, updates).catch((error) => console.error('Failed to update trade', error));
    }
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
    const fileName = `day-trading-journal-backup-${new Date().toISOString().split('T')[0]}.json`;

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
          title: 'Day Trading Journal Backup',
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

  const addStrategy = (strategy: Strategy) => {
    setStrategies(prev => [...prev, strategy]);
    if (cloudUser) {
      saveStrategy(cloudUser.uid, strategy).catch((error) => console.error('Failed to save strategy', error));
    }
  };

  const updateStrategy = (id: string, updates: Partial<Strategy>) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (cloudUser) {
      updateStrategyCloud(cloudUser.uid, id, updates).catch((error) => console.error('Failed to update strategy', error));
    }
  };

  const deleteStrategy = (id: string) => {
    setStrategies(prev => prev.filter(s => s.id !== id));
    if (cloudUser) {
      deleteStrategyCloud(cloudUser.uid, id).catch((error) => console.error('Failed to delete strategy', error));
    }
  };

  const addTag = (tag: Tag) => {
    setTags(prev => [...prev, tag]);
    if (cloudUser) {
      saveTag(cloudUser.uid, tag).catch((error) => console.error('Failed to save tag', error));
    }
  };

  const deleteTag = (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
    if (cloudUser) {
      deleteTagCloud(cloudUser.uid, id).catch((error) => console.error('Failed to delete tag', error));
    }
  };

  const addAccount = (account: TradingAccount) => {
    setAccounts(prev => [...prev, account]);
    if (cloudUser) {
      saveAccount(cloudUser.uid, account).catch((error) => console.error('Failed to save account', error));
    }
  };

  const updateAccount = (id: string, updates: Partial<TradingAccount>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    if (cloudUser) {
      updateAccountCloud(cloudUser.uid, id, updates).catch((error) => console.error('Failed to update account', error));
    }
  };

  const deleteAccount = (id: string) => {
    // Allow deleting any account, including the last one
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (cloudUser) {
      deleteAccountCloud(cloudUser.uid, id).catch((error) => console.error('Failed to delete account', error));
    }
  };

  const getAccountBalance = (accountId: string): number => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;

    const accountTrades = trades.filter(t =>
      t.accountId === accountId &&
      t.includeInAccount !== false
    );

    // Include commission in balance calculation (commission is always negative)
    const totalPnl = accountTrades.reduce((sum, t) => sum + t.pnl + (t.commission || 0), 0);
    return account.startingBalance + totalPnl;
  };

  return (
    <StoreContext.Provider value={{
      user,
      updateUser,
      cloudUser,
      syncStatus,
      isMigrating,
      forceSyncNow,
      syncToast,
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
      updateStrategy,
      deleteStrategy,
      addTag,
      deleteTag,
      addAccount,
      updateAccount,
      deleteAccount,
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
