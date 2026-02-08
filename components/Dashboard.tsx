import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Zap, Plus, ChevronRight, ChevronDown, Wallet, X, Target } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useAuthModal } from '../context/AuthModalContext';
import TradeWizard from './TradeWizard';
import TradeTypeSelector from './TradeTypeSelector';
import MultipleTradeWizard from './MultipleTradeWizard';
import AccountSettingsModal from './AccountSettingsModal';
import { TradingAccount } from '../types';

// Account Creation Form Component
const AccountCreationForm: React.FC<{
  onSuccess: () => void;
  onCancel: () => void;
  theme: any;
}> = ({ onSuccess, onCancel, theme }) => {
  const { theme: themeContext } = useTheme();
  const { addAccount } = useStore();
  const [formData, setFormData] = useState({ name: '', startingBalance: '' });

  const handleSubmit = () => {
    if (formData.name && formData.startingBalance) {
      addAccount({
        id: `acc_${Date.now()}`,
        name: formData.name,
        startingBalance: parseFloat(formData.startingBalance),
        createdAt: new Date().toISOString(),
        isMain: false,
        isHidden: false,
      });
      onSuccess();
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        placeholder="Account name"
        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
        autoFocus
      />
      <input
        type="number"
        value={formData.startingBalance}
        onChange={e => setFormData({ ...formData, startingBalance: e.target.value })}
        placeholder="Starting balance"
        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
      />
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSubmit}
          disabled={!formData.name || !formData.startingBalance}
          className="flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-xl font-bold transition-colors"
          style={{
            backgroundColor: theme.primary,
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = theme.primaryDark;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.primary;
          }}
        >
          Create Account
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};


const Dashboard = () => {
  const navigate = useNavigate();
  const { trades, accounts, getAccountBalance, strategies, cloudUser } = useStore();
  const { theme, isLightTheme } = useTheme();
  const { openAuthModal } = useAuthModal();
  const textPrimary = isLightTheme ? 'text-slate-800' : 'text-white';
  const textSecondary = isLightTheme ? 'text-slate-600' : 'text-slate-400';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAddAccountPrompt, setShowAddAccountPrompt] = useState(false);
  const [showTradeTypeSelector, setShowTradeTypeSelector] = useState(false);
  const [isMultipleTradeMode, setIsMultipleTradeMode] = useState(false);
  const [showBackupPrompt, setShowBackupPrompt] = useState(false);

  const visibleAccounts = accounts.filter(a => !a.isHidden);

  // Calculate total portfolio from all visible accounts
  const totalPortfolio = useMemo(() => {
    return visibleAccounts.reduce((total, account) => {
      return total + getAccountBalance(account.id);
    }, 0);
  }, [visibleAccounts, getAccountBalance]);

  // Calculate total starting balance from all visible accounts
  const totalStartingBalance = useMemo(() => {
    return visibleAccounts.reduce((total, account) => {
      return total + account.startingBalance;
    }, 0);
  }, [visibleAccounts]);

  const percentChange = totalStartingBalance > 0 ? ((totalPortfolio - totalStartingBalance) / totalStartingBalance * 100) : 0;

  const strategyPerformance = useMemo(() => {
    if (strategies.length === 0) {
      return { data: [], series: [] as Array<{ id: string; title: string; color: string; key: string }> };
    }

    const palette = ['#8B5CF6', '#22C55E', '#F97316', '#38BDF8', '#F43F5E', '#A3E635'];
    const strategyIndex = strategies.reduce<Record<string, { id: string; title: string; key: string }>>((acc, strategy) => {
      acc[strategy.id] = { id: strategy.id, title: strategy.title, key: `s_${strategy.id}` };
      return acc;
    }, {});

    const titleIndex = strategies.reduce<Record<string, string>>((acc, strategy) => {
      acc[strategy.title] = strategy.id;
      return acc;
    }, {});

    const datedTrades = trades
      .filter(t => t.date && (t.strategy || t.strategyId))
      .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

    const tradeBuckets = datedTrades.reduce<Record<string, typeof datedTrades>>((acc, trade) => {
      if (!acc[trade.date]) acc[trade.date] = [];
      acc[trade.date].push(trade);
      return acc;
    }, {});

    const dates = Object.keys(tradeBuckets).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const cumulative: Record<string, number> = {};
    const series = strategies.map((strategy, idx) => ({
      id: strategy.id,
      title: strategy.title,
      key: strategyIndex[strategy.id].key,
      color: palette[idx % palette.length]
    }));

    series.forEach(item => {
      cumulative[item.key] = 0;
    });

    const data = dates.map(date => {
      const dayTrades = tradeBuckets[date] || [];
      dayTrades.forEach(trade => {
        const resolvedId = trade.strategyId || titleIndex[trade.strategy || ''];
        const key = resolvedId && strategyIndex[resolvedId] ? strategyIndex[resolvedId].key : null;
        if (key) {
          const net = trade.pnl + (trade.commission || 0);
          cumulative[key] += net;
        }
      });
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...cumulative
      };
    });

    return { data, series };
  }, [strategies, trades]);

  useEffect(() => {
    if (cloudUser) return;
    const dismissed = localStorage.getItem('velox_backup_prompt_dismissed');
    if (dismissed) return;
    const tradeThresholdMet = trades.length >= 10;
    const firstUse = localStorage.getItem('velox_first_use');
    const daysSinceFirstUse = firstUse
      ? (Date.now() - new Date(firstUse).getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    if (tradeThresholdMet || daysSinceFirstUse >= 7) {
      setShowBackupPrompt(true);
    }
  }, [cloudUser, trades.length]);


  // Get trades from all visible accounts
  const accountTrades = useMemo(() => {
    const visibleAccountIds = visibleAccounts.map(a => a.id);
    return trades.filter(t => {
      // Include trades that belong to visible accounts or have no account (legacy trades)
      if (!t.accountId) return true;
      return visibleAccountIds.includes(t.accountId);
    }).filter(t => t.includeInAccount !== false);
  }, [trades, visibleAccounts]);

  // Stats
  const stats = useMemo(() => {
    const wins = accountTrades.filter(t => t.pnl > 0).length;
    const losses = accountTrades.filter(t => t.pnl < 0).length;
    const breakeven = accountTrades.filter(t => t.pnl === 0).length;
    const totalTrades = accountTrades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    const grossProfit = accountTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(accountTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);

    const bestTrade = accountTrades.length > 0 ? Math.max(...accountTrades.map(t => t.pnl)) : 0;
    const worstTrade = accountTrades.length > 0 ? Math.min(...accountTrades.map(t => t.pnl)) : 0;
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;

    return { wins, losses, breakeven, totalTrades, winRate, profitFactor, bestTrade, worstTrade, avgWin, avgLoss };
  }, [accountTrades]);

  // Session Analytics
  const sessionAnalytics = useMemo(() => {
    const sessionMap: Record<string, { profit: number; loss: number; count: number }> = {};
    accountTrades.forEach(trade => {
      if (!sessionMap[trade.session]) {
        sessionMap[trade.session] = { profit: 0, loss: 0, count: 0 };
      }
      if (trade.pnl > 0) {
        sessionMap[trade.session].profit += trade.pnl;
      } else if (trade.pnl < 0) {
        sessionMap[trade.session].loss += Math.abs(trade.pnl);
      }
      sessionMap[trade.session].count++;
    });
    return Object.entries(sessionMap)
      .map(([session, data]) => ({
        session,
        profit: data.profit,
        loss: data.loss,
        net: data.profit - data.loss,
        count: data.count
      }))
      .sort((a, b) => b.net - a.net);
  }, [accountTrades]);

  // Emotion Analytics
  const emotionAnalytics = useMemo(() => {
    const winningEmotions: Record<string, number> = {};
    const losingEmotions: Record<string, number> = {};
    
    accountTrades.forEach(trade => {
      if (trade.emotion) {
        const emotions = trade.emotion.split(',').map(e => e.trim()).filter(e => e);
        emotions.forEach(emotion => {
          if (trade.pnl > 0) {
            winningEmotions[emotion] = (winningEmotions[emotion] || 0) + 1;
          } else if (trade.pnl < 0) {
            losingEmotions[emotion] = (losingEmotions[emotion] || 0) + 1;
          }
        });
      }
    });

    const topWinning = Object.entries(winningEmotions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));

    const topLosing = Object.entries(losingEmotions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));

    return { topWinning, topLosing };
  }, [accountTrades]);

  // Equity curve data
  const equityData = useMemo(() => {
    let runningBalance = totalStartingBalance;
    const sorted = [...accountTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const data = [{ val: totalStartingBalance }];
    sorted.forEach(t => {
      runningBalance += t.pnl;
      data.push({ val: runningBalance });
    });

    return data.length > 1 ? data : [{ val: totalStartingBalance }, { val: totalStartingBalance }];
  }, [accountTrades, totalStartingBalance]);

  // Performance breakdown data - last 5 days P&L
  const pnlPeriodData = useMemo(() => {
    if (accountTrades.length === 0) return [];

    const byDate: Record<string, number> = {};

    accountTrades.forEach(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      // Include commission in daily totals
      byDate[key] = (byDate[key] || 0) + t.pnl + (t.commission || 0);
    });

    const sortedKeys = Object.keys(byDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const lastFive = sortedKeys.slice(-5);

    const today = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return lastFive.map(key => {
      const d = new Date(key);
      const diffDays = Math.floor((today.getTime() - d.getTime()) / oneDayMs);
      let label: string;
      if (diffDays === 0) label = 'Today';
      else if (diffDays === 1) label = 'Yesterday';
      else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return { label, pnl: byDate[key] };
    });
  }, [accountTrades]);

  const sessionWinLossData = useMemo(() => {
    const map: Record<string, { wins: number; losses: number }> = {};

    accountTrades.forEach(t => {
      const rawSession = (t.session || '').toLowerCase();
      let key: string;
      if (rawSession.includes('lon')) key = 'London';
      else if (rawSession.includes('ny') || rawSession.includes('new york')) key = 'New York';
      else if (rawSession.includes('asia') || rawSession.includes('tokyo')) key = 'Asia';
      else key = 'Other';

      if (!map[key]) map[key] = { wins: 0, losses: 0 };
      if (t.pnl > 0) map[key].wins += 1;
      else if (t.pnl < 0) map[key].losses += 1;
    });

    return Object.entries(map).map(([session, data]) => ({
      session,
      wins: data.wins,
      losses: data.losses,
    }));
  }, [accountTrades]);

  return (
    <div
      className="flex-1 h-full overflow-y-auto pb-24"
      style={{ background: theme.bgGradient, backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}
    >
      <TradeWizard 
        isOpen={isModalOpen && !isMultipleTradeMode} 
        onClose={() => {
          setIsModalOpen(false);
          setIsMultipleTradeMode(false);
        }}
        isMultipleMode={false}
      />
      <MultipleTradeWizard
        isOpen={isModalOpen && isMultipleTradeMode}
        onClose={() => {
          setIsModalOpen(false);
          setIsMultipleTradeMode(false);
        }}
        theme={theme}
      />
      <AccountSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Add Account Prompt Modal */}
      {showAddAccountPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div
            className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6"
            style={{ borderColor: theme.primary + '30' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: theme.primary + '20' }}
              >
                <Wallet size={24} style={{ color: theme.primary }} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${textPrimary}`}>Add Account First</h3>
                <p className="text-sm text-slate-400">You need to add a trading account before logging trades</p>
              </div>
            </div>
            <AccountCreationForm
              onSuccess={() => {
                setShowAddAccountPrompt(false);
                setIsModalOpen(true);
              }}
              onCancel={() => setShowAddAccountPrompt(false)}
              theme={theme}
            />
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
        {!cloudUser && (
          <div
            className="p-4 rounded-2xl mb-4 flex items-center justify-between gap-3"
            style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
          >
            <div>
              <p className={`text-sm font-semibold ${textPrimary}`}>🔒 Sign in to backup your trades across devices</p>
              <p className={`text-xs ${textSecondary}`}>Sync when ready, keep working offline anytime.</p>
            </div>
            <button
              onClick={openAuthModal}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-white"
              style={{ backgroundColor: theme.primary }}
            >
              Sign In
            </button>
          </div>
        )}

        {!cloudUser && showBackupPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div
              className="w-full max-w-sm rounded-2xl p-5"
              style={{ background: theme.cardBg, border: `1px solid ${theme.primary}30` }}
            >
              <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>Backup your data</h3>
              <p className={`text-sm ${textSecondary} mb-4`}>
                Sign in to back up your trades and keep them safe across devices.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowBackupPrompt(false);
                    localStorage.setItem('velox_backup_prompt_dismissed', '1');
                    openAuthModal();
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold"
                  style={{ backgroundColor: theme.primary }}
                >
                  Back up now
                </button>
                <button
                  onClick={() => {
                    setShowBackupPrompt(false);
                    localStorage.setItem('velox_backup_prompt_dismissed', '1');
                  }}
                  className="flex-1 py-2.5 rounded-xl font-medium"
                  style={{ backgroundColor: isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.5)', color: isLightTheme ? '#475569' : '#e2e8f0' }}
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Value Card */}
        <div
          className="p-5 rounded-2xl mb-4"
          style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
        >
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portfolio Value</p>
          <p className={`text-3xl font-bold ${textPrimary} font-mono mb-1`}>
            ${totalPortfolio.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2 mb-4">
            {percentChange >= 0 ? (
              <TrendingUp size={14} className="text-emerald-400" />
            ) : (
              <TrendingDown size={14} className="text-rose-400" />
            )}
            <span className={`text-sm ${percentChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}% all time
            </span>
          </div>

          {/* Sparkline */}
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke={theme.primary}
                  strokeWidth={2}
                  fill="url(#sparklineGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div
            className="p-4 rounded-2xl text-center"
            style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <span className="text-[10px] text-slate-500 uppercase">Win Rate</span>
            </div>
            <p className={`text-xl font-bold ${textPrimary}`}>{stats.winRate.toFixed(0)}%</p>
          </div>
          <div
            className="p-4 rounded-2xl text-center"
            style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 size={10} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase">Trades</span>
            </div>
            <p className={`text-xl font-bold ${textPrimary}`}>{stats.totalTrades}</p>
          </div>
          <div
            className="p-4 rounded-2xl text-center"
            style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap size={10} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase">P. Factor</span>
            </div>
            <p className={`text-xl font-bold ${textPrimary}`}>
              {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Performance Section */}
        <div
          className="p-5 rounded-2xl mb-4"
          style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
        >
          <h3 className={`text-sm font-bold ${textPrimary} mb-4`}>Performance</h3>
          <div className="flex items-center gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: theme.primary }}></div>
                <span className="text-sm text-slate-400">Wins</span>
                <span className={`text-sm font-bold ${textPrimary} ml-auto`}>{stats.wins}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-sm text-slate-400">Losses</span>
                <span className={`text-sm font-bold ${textPrimary} ml-auto`}>{stats.losses}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                <span className="text-sm text-slate-400">Breakeven</span>
                <span className={`text-sm font-bold ${textPrimary} ml-auto`}>{stats.breakeven}</span>
              </div>
            </div>
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="rgba(100,100,100,0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${stats.winRate * 2.51} 251`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${textPrimary}`}>{stats.winRate.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* P&L Breakdown */}
        <div
          className="p-5 rounded-2xl mb-4"
          style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
        >
          <h3 className="text-sm font-bold text-white mb-4">P&L Breakdown</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/50">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Best Trade</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">
                +${stats.bestTrade.toFixed(0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Worst Trade</p>
              <p className="text-lg font-bold text-rose-400 font-mono">
                ${stats.worstTrade.toFixed(0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Avg Win</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">
                +${stats.avgWin.toFixed(0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Avg Loss</p>
              <p className="text-lg font-bold text-rose-400 font-mono">
                -${stats.avgLoss.toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        {/* Trade Setup Analytics */}
        <div
          className="p-5 rounded-2xl mb-4"
          style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={20} style={{ color: theme.primary }} />
              <h3 className="text-sm font-bold text-white">Trade Setup Analytics</h3>
            </div>
            <button
              onClick={() => navigate('/trade-setup')}
              className="text-xs hover:underline"
              style={{ color: theme.primary }}
            >
              View all &gt;
            </button>
          </div>

          {strategies.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No strategies created yet</p>
          ) : (
            <>
              {strategyPerformance.data.length > 0 ? (
                <div className="mb-4">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Strategy performance</p>
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={strategyPerformance.data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#020617', borderColor: '#1f2937', borderRadius: 8 }}
                          formatter={(value: number, name: string) => {
                            const series = strategyPerformance.series.find(s => s.key === name);
                            return [`$${value.toFixed(2)}`, series?.title || 'Strategy'];
                          }}
                        />
                        {strategyPerformance.series.map(series => (
                          <Line
                            key={series.key}
                            type="monotone"
                            dataKey={series.key}
                            stroke={series.color}
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No strategy performance data yet</p>
              )}
            <div className="space-y-3">
              {strategies.slice(0, 3).map(strategy => {
                const strategyTrades = trades.filter(t => 
                  t.strategy === strategy.title || t.strategyId === strategy.id
                );
                const strategyWins = strategyTrades.filter(t => t.status === 'WIN').length;
                const strategyWinRate = strategyTrades.length > 0 
                  ? (strategyWins / strategyTrades.length) * 100 
                  : 0;

                return (
                  <div key={strategy.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{strategy.title}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-400">
                          {strategyTrades.length} {strategyTrades.length === 1 ? 'trade' : 'trades'}
                        </span>
                        <span className={`text-xs font-medium ${strategyWinRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {strategyWinRate.toFixed(0)}% Win Rate
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {strategies.length > 3 && (
                <p className="text-xs text-slate-500 text-center py-2">
                  +{strategies.length - 3} more {strategies.length - 3 === 1 ? 'strategy' : 'strategies'}
                </p>
              )}
            </div>
            </>
          )}
        </div>

        {/* Performance Breakdown */}
        <div
          className="p-5 rounded-2xl mb-4"
          style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Performance Breakdown</h3>
          </div>

          {/* P&L - last 5 days */}
          <div className="mb-4">
            <p className="text-[10px] text-slate-500 uppercase mb-2">P&L - Last 5 Days</p>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlPeriodData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1f2937', borderRadius: 8 }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
                  />
                  <Bar dataKey="pnl">
                    {pnlPeriodData.map((item, index) => (
                      <Cell
                        key={index}
                        fill={item.pnl >= 0 ? '#22C55E' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Wins vs losses per session */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase mb-2">Wins vs Losses per Session</p>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionWinLossData} stackOffset="none">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="session" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1f2937', borderRadius: 8 }}
                  />
                  <Bar dataKey="wins" stackId="a" fill="#22C55E" />
                  <Bar dataKey="losses" stackId="a" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* New Trade Button - inline at bottom of content */}
        <div className="relative">
          <button
            onClick={() => {
              const visibleAccounts = accounts.filter(a => !a.isHidden);
              if (visibleAccounts.length === 0) {
                setShowAddAccountPrompt(true);
              } else {
                setShowTradeTypeSelector(true);
              }
            }}
            className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-white transition-all hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
              boxShadow: `0 0 30px ${theme.primary}50`
            }}
          >
            <Plus size={20} strokeWidth={2.5} />
            New Trade
          </button>
          
          <TradeTypeSelector
            isOpen={showTradeTypeSelector}
            onClose={() => setShowTradeTypeSelector(false)}
            onSelectSingle={() => {
              setShowTradeTypeSelector(false);
              setIsMultipleTradeMode(false);
              setIsModalOpen(true);
            }}
            onSelectMultiple={() => {
              setShowTradeTypeSelector(false);
              setIsMultipleTradeMode(true);
              setIsModalOpen(true);
            }}
            theme={theme}
          />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;