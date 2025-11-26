import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, BarChart3, TrendingUp, Wallet, ChevronDown } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import TradeWizard from './TradeWizard';

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
    </div>
  );
};

export default Dashboard;