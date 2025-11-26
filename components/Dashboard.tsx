import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, BarChart3, TrendingUp, Wallet, ChevronDown, Target, Brain, Clock, Newspaper, AlertTriangle, Zap } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import TradeWizard from './TradeWizard';
import { TradingSession } from '../types';

const StatCard = ({ title, value, sub, isPositive, icon: Icon }: any) => (
  <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
    
    <div className="flex justify-between items-start z-10">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
            <Icon size={16} />
        </div>
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</span>
      </div>
    </div>
    
    <div className="mt-4 z-10">
      <div className="text-3xl font-bold text-white tracking-tight font-mono">{value}</div>
      <div className="flex items-center gap-2 mt-2">
        {sub && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {sub}
            </span>
        )}
      </div>
    </div>
  </div>
);

const PerformanceScoreCard = ({ winRate, profitFactor }: { winRate: number, profitFactor: number }) => {
    // Simple scoring logic
    let score = 0;
    if (profitFactor > 2.0) score += 40;
    else if (profitFactor > 1.5) score += 30;
    else if (profitFactor > 1.0) score += 15;
    
    if (winRate > 70) score += 40;
    else if (winRate > 50) score += 30;
    else if (winRate > 40) score += 15;

    score += 20; // Base score
    score = Math.min(99, score);

    let label = "Needs Work";
    let color = "text-rose-400";

    if (score > 80) { label = "Excellent"; color = "text-emerald-400"; }
    else if (score > 60) { label = "Good"; color = "text-brand-400"; }
    else if (score > 40) { label = "Average"; color = "text-indigo-400"; }

    return (
        <div className="flex-1 glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">Performance Score</h3>
            <div className="flex items-center justify-center h-[160px] relative">
                <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-32 h-32 rounded-full border-4 border-slate-800 border-t-current border-r-current rotate-45 ${color}`}></div>
                </div>
                <div className="text-center z-10">
                    <div className="text-5xl font-bold text-white font-mono">{score}</div>
                    <div className={`text-xs font-bold uppercase tracking-wide mt-1 ${color}`}>{label}</div>
                </div>
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">Based on Win Rate & Profit Factor</p>
        </div>
    );
};

const Dashboard = () => {
  const { trades, user, accounts, getAccountBalance, getMainAccount } = useStore();
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | 'ALL'>('7D');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Filter out hidden accounts for display
  const visibleAccounts = accounts.filter(a => !a.isHidden);

  // Set default account on mount or when accounts change
  useEffect(() => {
    const currentAccountExists = visibleAccounts.some(a => a.id === selectedAccountId);
    if (!currentAccountExists && visibleAccounts.length > 0) {
      const mainAccount = getMainAccount();
      const mainVisible = mainAccount && !mainAccount.isHidden;
      setSelectedAccountId(mainVisible ? mainAccount.id : visibleAccounts[0].id);
    } else if (visibleAccounts.length === 0) {
      setSelectedAccountId('');
    }
  }, [accounts, visibleAccounts, selectedAccountId, getMainAccount]);

  const selectedAccount = visibleAccounts.find(a => a.id === selectedAccountId);
  const accountBalance = selectedAccountId ? getAccountBalance(selectedAccountId) : 0;

  // Filter trades based on timeframe and selected account
  const filteredTrades = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0); // Beginning of time for ALL

    if (timeframe === '7D') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
    } else if (timeframe === '30D') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
    }

    return trades
        .filter(t => new Date(t.date) >= startDate)
        .filter(t => !selectedAccountId || t.accountId === selectedAccountId)
        .filter(t => t.includeInAccount !== false)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [trades, timeframe, selectedAccountId]);

  // Calculate Metrics
  const stats = useMemo(() => {
    let netPnl = 0;
    let wins = 0;
    let losses = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let totalTrades = filteredTrades.length;

    filteredTrades.forEach(t => {
        netPnl += t.pnl;
        if (t.pnl > 0) {
            wins++;
            grossProfit += t.pnl;
        } else if (t.pnl < 0) {
            losses++;
            grossLoss += Math.abs(t.pnl);
        }
    });

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;
    const avgRiskReward = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
        netPnl,
        winRate,
        profitFactor,
        avgRiskReward,
        totalTrades
    };
  }, [filteredTrades]);

  // Strategy Analytics
  const strategyStats = useMemo(() => {
    const strategyMap: { [key: string]: { wins: number; losses: number; pnl: number; trades: number } } = {};
    
    filteredTrades.forEach(t => {
      const strategy = t.strategy || 'Unknown';
      if (!strategyMap[strategy]) {
        strategyMap[strategy] = { wins: 0, losses: 0, pnl: 0, trades: 0 };
      }
      strategyMap[strategy].trades++;
      strategyMap[strategy].pnl += t.pnl;
      if (t.pnl > 0) strategyMap[strategy].wins++;
      else if (t.pnl < 0) strategyMap[strategy].losses++;
    });

    return Object.entries(strategyMap)
      .map(([name, data]) => ({
        name,
        winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
        pnl: data.pnl,
        trades: data.trades
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  // Session Analytics
  const sessionStats = useMemo(() => {
    const sessionMap: { [key: string]: { wins: number; losses: number; pnl: number; trades: number } } = {};
    const sessions: TradingSession[] = ['London', 'New York', 'Asian', 'Overlap'];
    
    sessions.forEach(s => {
      sessionMap[s] = { wins: 0, losses: 0, pnl: 0, trades: 0 };
    });
    
    filteredTrades.forEach(t => {
      const session = t.session || 'Unknown';
      if (!sessionMap[session]) {
        sessionMap[session] = { wins: 0, losses: 0, pnl: 0, trades: 0 };
      }
      sessionMap[session].trades++;
      sessionMap[session].pnl += t.pnl;
      if (t.pnl > 0) sessionMap[session].wins++;
      else if (t.pnl < 0) sessionMap[session].losses++;
    });

    return Object.entries(sessionMap)
      .map(([name, data]) => ({
        name,
        winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
        pnl: data.pnl,
        trades: data.trades
      }))
      .filter(s => s.trades > 0)
      .sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  // Behavioral Analytics
  const behavioralStats = useMemo(() => {
    // Emotion stats
    const emotionMap: { [key: string]: { wins: number; losses: number; trades: number } } = {};
    
    filteredTrades.forEach(t => {
      if (t.emotion) {
        const emotions = t.emotion.split(', ');
        emotions.forEach(emotion => {
          if (!emotionMap[emotion]) emotionMap[emotion] = { wins: 0, losses: 0, trades: 0 };
          emotionMap[emotion].trades++;
          if (t.pnl > 0) emotionMap[emotion].wins++;
          else if (t.pnl < 0) emotionMap[emotion].losses++;
        });
      }
    });

    const emotionStats = Object.entries(emotionMap)
      .map(([name, data]) => ({
        name,
        winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
        trades: data.trades
      }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 5);

    // News trading stats
    const newsTrades = filteredTrades.filter(t => t.tradedDuringNews === true);
    const newsWins = newsTrades.filter(t => t.pnl > 0).length;
    const newsPnl = newsTrades.reduce((sum, t) => sum + t.pnl, 0);
    const newsWinRate = newsTrades.length > 0 ? (newsWins / newsTrades.length) * 100 : 0;

    // Overtrading stats
    const overtradedTrades = filteredTrades.filter(t => t.overTraded === true);
    const overtradedWins = overtradedTrades.filter(t => t.pnl > 0).length;
    const overtradedPnl = overtradedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const overtradedWinRate = overtradedTrades.length > 0 ? (overtradedWins / overtradedTrades.length) * 100 : 0;

    // Plan discipline stats
    const followedPlan = filteredTrades.filter(t => t.planDiscipline === true);
    const followedPlanWins = followedPlan.filter(t => t.pnl > 0).length;
    const followedPlanPnl = followedPlan.reduce((sum, t) => sum + t.pnl, 0);
    const followedPlanWinRate = followedPlan.length > 0 ? (followedPlanWins / followedPlan.length) * 100 : 0;

    const brokeRules = filteredTrades.filter(t => t.planDiscipline === false);
    const brokeRulesPnl = brokeRules.reduce((sum, t) => sum + t.pnl, 0);

    return {
      emotions: emotionStats,
      news: {
        trades: newsTrades.length,
        winRate: newsWinRate,
        pnl: newsPnl
      },
      overtrading: {
        trades: overtradedTrades.length,
        winRate: overtradedWinRate,
        pnl: overtradedPnl
      },
      discipline: {
        followedPlan: followedPlan.length,
        followedPlanWinRate,
        followedPlanPnl,
        brokeRules: brokeRules.length,
        brokeRulesPnl
      }
    };
  }, [filteredTrades]);

  // Risk:Reward Analytics (for all trades with both risk and TP)
  const rrStats = useMemo(() => {
    const tradesWithRR = filteredTrades.filter(t => 
      t.riskAmount && 
      t.riskAmount > 0 && 
      t.tpAmount && 
      t.tpAmount > 0
    );

    const winningTradesWithRR = tradesWithRR.filter(t => t.pnl > 0);
    const losingTradesWithRR = tradesWithRR.filter(t => t.pnl < 0);

    if (tradesWithRR.length === 0) {
      return { 
        avgWinRR: 0, 
        avgLossRR: 0,
        totalWinningRR: 0, 
        totalLosingRR: 0,
        rrDistribution: [] 
      };
    }

    const winRRValues = winningTradesWithRR.map(t => t.tpAmount! / t.riskAmount!);
    const lossRRValues = losingTradesWithRR.map(t => t.tpAmount! / t.riskAmount!);

    const avgWinRR = winRRValues.length > 0 
      ? winRRValues.reduce((sum, v) => sum + v, 0) / winRRValues.length 
      : 0;
    
    const avgLossRR = lossRRValues.length > 0 
      ? lossRRValues.reduce((sum, v) => sum + v, 0) / lossRRValues.length 
      : 0;

    // Distribution of R:R for winning trades
    const distribution: { [key: string]: number } = {
      '< 1:1': 0,
      '1:1 - 1:2': 0,
      '1:2 - 1:3': 0,
      '> 1:3': 0
    };

    winRRValues.forEach(rr => {
      if (rr < 1) distribution['< 1:1']++;
      else if (rr < 2) distribution['1:1 - 1:2']++;
      else if (rr < 3) distribution['1:2 - 1:3']++;
      else distribution['> 1:3']++;
    });

    return {
      avgWinRR,
      avgLossRR,
      totalWinningRR: winningTradesWithRR.length,
      totalLosingRR: losingTradesWithRR.length,
      rrDistribution: Object.entries(distribution).map(([range, count]) => ({
        range,
        count,
        percentage: winningTradesWithRR.length > 0 ? (count / winningTradesWithRR.length) * 100 : 0
      }))
    };
  }, [filteredTrades]);

  // Generate Chart Data (Cumulative PnL)
  const chartData = useMemo(() => {
    let runningBalance = 0;
    // Group by date to avoid jagged lines if multiple trades in one day
    const groupedByDate: { [key: string]: number } = {};
    
    filteredTrades.forEach(t => {
        if (!groupedByDate[t.date]) groupedByDate[t.date] = 0;
        groupedByDate[t.date] += t.pnl;
    });

    return Object.keys(groupedByDate).map(date => {
        runningBalance += groupedByDate[date];
        return {
            name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            val: parseFloat(runningBalance.toFixed(2)),
            fullDate: date
        };
    });
  }, [filteredTrades]);

  // If no trades, provide minimal empty data structure for chart to render empty state
  const finalChartData = chartData.length > 0 ? chartData : [{name: 'No Data', val: 0}];

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 custom-scrollbar bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      
      <TradeWizard isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Account Balance Bar */}
      {visibleAccounts.length > 0 ? (
        <div className="mb-6 p-4 glass-panel rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <Wallet size={16} className="text-brand-400" />
                <span className="text-sm font-medium text-white">{selectedAccount?.name || 'Select Account'}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {showAccountDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowAccountDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-20 overflow-hidden">
                    {visibleAccounts.map(account => (
                      <button
                        key={account.id}
                        onClick={() => {
                          setSelectedAccountId(account.id);
                          setShowAccountDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center justify-between ${
                          account.id === selectedAccountId ? 'bg-brand-500/10 text-brand-400' : 'text-slate-300'
                        }`}
                      >
                        <span>{account.name}</span>
                        {account.isMain && <span className="text-[10px] uppercase text-slate-500">Main</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <p className="text-xs text-slate-500">Starting Balance</p>
              <p className="text-sm font-mono text-slate-300">${selectedAccount?.startingBalance.toLocaleString() || '0'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Current Balance</p>
            <p className={`text-2xl font-bold font-mono ${accountBalance >= (selectedAccount?.startingBalance || 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${accountBalance.toLocaleString()}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-6 glass-panel rounded-xl border border-dashed border-slate-700 text-center">
          <Wallet size={32} className="mx-auto text-slate-600 mb-2" />
          <p className="text-slate-400 mb-1">No trading accounts configured</p>
          <p className="text-xs text-slate-600">Click your profile in the sidebar to add a trading account</p>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Command Center</h1>
          <p className="text-slate-400 text-sm mt-1">
             {filteredTrades.length === 0 
                ? "No trades for this account yet. Start logging your execution." 
                : `Welcome back, ${user?.name || 'Trader'}. Viewing ${selectedAccount?.name || 'account'} stats.`}
          </p>
        </div>
        <div className="flex gap-3">
             <div className="flex bg-slate-900 rounded-lg border border-slate-800 p-1 shadow-lg">
                 {(['7D', '30D', 'ALL'] as const).map(tf => (
                    <button 
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-4 py-2 text-xs font-bold rounded transition-colors ${timeframe === tf ? 'bg-brand-500 text-slate-900 shadow shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        {tf}
                    </button>
                 ))}
             </div>
             <button 
                 onClick={() => setIsModalOpen(true)}
                 className="bg-white text-slate-900 hover:bg-slate-200 px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-white/5 transition-all flex items-center gap-2"
             >
                 New Trade
             </button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
            title="Net Profit" 
            value={stats.totalTrades > 0 ? `$${stats.netPnl.toFixed(2)}` : "$0.00"} 
            sub={stats.totalTrades > 0 ? `${timeframe} P&L` : "No Trades"} 
            isPositive={stats.netPnl >= 0} 
            icon={BarChart3} 
        />
        <StatCard 
            title="Win Rate" 
            value={stats.totalTrades > 0 ? `${stats.winRate.toFixed(1)}%` : "0%"} 
            sub={stats.totalTrades > 0 ? `${stats.totalTrades} Trades` : "No Data"} 
            isPositive={stats.winRate > 50} 
            icon={Activity} 
        />
        <StatCard 
            title="Profit Factor" 
            value={stats.profitFactor.toFixed(2)} 
            sub="Ratio"
            isPositive={stats.profitFactor > 1.5} 
            icon={TrendingUp} 
        />
        <StatCard 
            title="Avg R:R" 
            value={`1 : ${stats.avgRiskReward.toFixed(1)}`} 
            sub="Risk/Reward"
            isPositive={stats.avgRiskReward > 1.5} 
            icon={Activity} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Equity Curve */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 relative">
           <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-5 bg-brand-500 rounded-full"></span>
                    Cumulative P&L
                </h3>
                <div className="flex items-center gap-4">
                    {stats.totalTrades === 0 && <span className="text-xs text-slate-500 italic">No data to display</span>}
                </div>
           </div>
           <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={finalChartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    dy={10} 
                    interval={timeframe === 'ALL' ? 'preserveStartEnd' : 0}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155', color: '#fff'}}
                    itemStyle={{color: '#10b981'}}
                    cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cum. P&L']}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
        
        {/* Performance Score Column */}
        <div className="flex flex-col gap-6">
            <PerformanceScoreCard winRate={stats.winRate} profitFactor={stats.profitFactor} />
        </div>
      </div>

      {/* Analytics Row */}
      {stats.totalTrades > 0 && (
        <>
          {/* Strategy & Session Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Strategy Performance */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <Target size={18} className="text-brand-400" />
                <h3 className="font-bold text-white">Strategy Performance</h3>
              </div>
              {strategyStats.length > 0 ? (
                <div className="space-y-3">
                  {strategyStats.slice(0, 5).map((strat, i) => (
                    <div key={strat.name} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-700 text-slate-400'
                        }`}>
                          #{i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">{strat.name}</p>
                          <p className="text-xs text-slate-500">{strat.trades} trades</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold font-mono ${strat.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {strat.pnl >= 0 ? '+' : ''}${strat.pnl.toFixed(0)}
                        </p>
                        <p className={`text-xs ${strat.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {strat.winRate.toFixed(0)}% WR
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">No strategy data yet</p>
              )}
            </div>

            {/* Session Performance */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-indigo-400" />
                <h3 className="font-bold text-white">Session Performance</h3>
              </div>
              {sessionStats.length > 0 ? (
                <div className="space-y-3">
                  {sessionStats.map((session, i) => {
                    const sessionColors: { [key: string]: string } = {
                      'London': 'bg-indigo-500',
                      'New York': 'bg-emerald-500',
                      'Asian': 'bg-amber-500',
                      'Overlap': 'bg-purple-500'
                    };
                    return (
                      <div key={session.name} className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${sessionColors[session.name] || 'bg-slate-500'}`}></span>
                            <span className="text-sm font-medium text-white">{session.name}</span>
                            <span className="text-xs text-slate-500">({session.trades} trades)</span>
                          </div>
                          <span className={`text-sm font-bold font-mono ${session.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {session.pnl >= 0 ? '+' : ''}${session.pnl.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${session.winRate >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(session.winRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-12 text-right">{session.winRate.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">No session data yet</p>
              )}
            </div>
          </div>

          {/* Behavioral & R:R Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Behavioral Insights */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={18} className="text-purple-400" />
                <h3 className="font-bold text-white">Behavioral Insights</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* News Trading */}
                <div className={`p-4 rounded-xl border ${behavioralStats.news.trades > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-800/50 border-slate-700'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Newspaper size={16} className="text-amber-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase">News Trading</span>
                  </div>
                  <p className="text-2xl font-bold text-white font-mono">{behavioralStats.news.trades}</p>
                  <p className="text-xs text-slate-500">trades during news</p>
                  {behavioralStats.news.trades > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-xs font-bold ${behavioralStats.news.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {behavioralStats.news.pnl >= 0 ? '+' : ''}${behavioralStats.news.pnl.toFixed(0)}
                      </span>
                      <span className="text-xs text-slate-500">|</span>
                      <span className={`text-xs ${behavioralStats.news.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {behavioralStats.news.winRate.toFixed(0)}% WR
                      </span>
                    </div>
                  )}
                </div>

                {/* Overtrading */}
                <div className={`p-4 rounded-xl border ${behavioralStats.overtrading.trades > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-800/50 border-slate-700'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-rose-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase">Overtrading</span>
                  </div>
                  <p className="text-2xl font-bold text-white font-mono">{behavioralStats.overtrading.trades}</p>
                  <p className="text-xs text-slate-500">overtraded sessions</p>
                  {behavioralStats.overtrading.trades > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-xs font-bold ${behavioralStats.overtrading.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {behavioralStats.overtrading.pnl >= 0 ? '+' : ''}${behavioralStats.overtrading.pnl.toFixed(0)}
                      </span>
                      <span className="text-xs text-slate-500">|</span>
                      <span className={`text-xs ${behavioralStats.overtrading.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {behavioralStats.overtrading.winRate.toFixed(0)}% WR
                      </span>
                    </div>
                  )}
                </div>

                {/* Plan Discipline */}
                <div className={`p-4 rounded-xl border ${behavioralStats.discipline.followedPlan > 0 ? 'bg-brand-500/5 border-brand-500/20' : 'bg-slate-800/50 border-slate-700'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={16} className="text-brand-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase">Discipline</span>
                  </div>
                  <p className="text-2xl font-bold text-white font-mono">
                    {behavioralStats.discipline.followedPlan}/{behavioralStats.discipline.followedPlan + behavioralStats.discipline.brokeRules}
                  </p>
                  <p className="text-xs text-slate-500">followed plan</p>
                  {behavioralStats.discipline.followedPlan > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-xs font-bold ${behavioralStats.discipline.followedPlanPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {behavioralStats.discipline.followedPlanPnl >= 0 ? '+' : ''}${behavioralStats.discipline.followedPlanPnl.toFixed(0)}
                      </span>
                      <span className="text-xs text-slate-500">|</span>
                      <span className={`text-xs ${behavioralStats.discipline.followedPlanWinRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {behavioralStats.discipline.followedPlanWinRate.toFixed(0)}% WR
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Emotions */}
              {behavioralStats.emotions.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-3">Top Emotions</p>
                  <div className="flex flex-wrap gap-2">
                    {behavioralStats.emotions.map(emotion => (
                      <div 
                        key={emotion.name}
                        className={`px-3 py-2 rounded-lg border ${
                          emotion.winRate >= 50 
                            ? 'bg-emerald-500/10 border-emerald-500/20' 
                            : 'bg-rose-500/10 border-rose-500/20'
                        }`}
                      >
                        <span className="text-sm text-white">{emotion.name}</span>
                        <span className={`ml-2 text-xs font-bold ${emotion.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {emotion.winRate.toFixed(0)}%
                        </span>
                        <span className="text-xs text-slate-500 ml-1">({emotion.trades})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Risk:Reward */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <Target size={18} className="text-emerald-400" />
                <h3 className="font-bold text-white">Risk : Reward</h3>
              </div>
              
              {(rrStats.totalWinningRR > 0 || rrStats.totalLosingRR > 0) ? (
                <>
                  {/* Winning R:R */}
                  <div className="text-center mb-4 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                    <p className="text-3xl font-bold text-emerald-400 font-mono">
                      1 : {rrStats.avgWinRR.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Avg R:R on Wins ({rrStats.totalWinningRR})</p>
                  </div>
                  
                  {/* Losing R:R (Potential) */}
                  {rrStats.totalLosingRR > 0 && (
                    <div className="text-center mb-4 p-3 bg-rose-500/5 rounded-lg border border-rose-500/20">
                      <p className="text-2xl font-bold text-rose-400 font-mono">
                        1 : {rrStats.avgLossRR.toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Avg Potential R:R on Losses ({rrStats.totalLosingRR})</p>
                    </div>
                  )}
                  
                  {/* Distribution */}
                  {rrStats.totalWinningRR > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 mb-2">Win Distribution</p>
                      <div className="space-y-1.5">
                        {rrStats.rrDistribution.map(item => (
                          <div key={item.range} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 w-16">{item.range}</span>
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-500 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 w-6">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No R:R data yet</p>
                  <p className="text-xs text-slate-600 mt-1">R:R is calculated from trades with risk & TP values</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;