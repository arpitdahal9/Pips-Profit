import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, Target, Flame, Calendar as CalendarIcon } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Trade } from '../types';

// Utility functions
const getTradesForDay = (trades: Trade[], date: Date): Trade[] => {
  const dateStr = date.toISOString().split('T')[0];
  return trades.filter(t => t.date === dateStr);
};

const getTradesForWeek = (trades: Trade[], weekStart: Date): Trade[] => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  return trades.filter(t => {
    const tradeDate = new Date(t.date);
    return tradeDate >= weekStart && tradeDate <= weekEnd;
  });
};

const getWeekNumber = (date: Date): number => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const firstDayWeekday = firstDayOfMonth.getDay();
  return Math.ceil((dayOfMonth + firstDayWeekday) / 7);
};

const CalendarPage: React.FC = () => {
  const { trades } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar grid
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Next month padding
    const totalDays = days.length <= 35 ? 35 : 42;
    const remaining = totalDays - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  }, [year, month]);

  // Weekly summaries - month-specific weeks (1-7, 8-14, 15-21, 22-28, 29-end)
  const weeklySummaries = useMemo(() => {
    const weeks: { weekNum: number; startDay: number; endDay: number; trades: Trade[]; pnl: number; winRate: number }[] = [];
    
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Define week ranges within the month
    const weekRanges = [
      { start: 1, end: 7 },
      { start: 8, end: 14 },
      { start: 15, end: 21 },
      { start: 22, end: 28 },
      { start: 29, end: daysInMonth }
    ];
    
    weekRanges.forEach((range, index) => {
      if (range.start > daysInMonth) return; // Skip if week starts after month ends
      
      const actualEnd = Math.min(range.end, daysInMonth);
      
      // Get trades for this week range
      const weekTrades = trades.filter(t => {
        const d = new Date(t.date);
        if (d.getFullYear() !== year || d.getMonth() !== month) return false;
        const day = d.getDate();
        return day >= range.start && day <= actualEnd;
      });
      
      const pnl = weekTrades.reduce((sum, t) => sum + t.pnl, 0);
      const wins = weekTrades.filter(t => t.status === 'WIN').length;
      const winRate = weekTrades.length > 0 ? (wins / weekTrades.length) * 100 : 0;
      
      weeks.push({
        weekNum: index + 1,
        startDay: range.start,
        endDay: actualEnd,
        trades: weekTrades,
        pnl,
        winRate
      });
    });
    
    return weeks;
  }, [trades, year, month]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const monthTrades = trades.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    
    const totalPnl = monthTrades.reduce((sum, t) => sum + t.pnl, 0);
    const wins = monthTrades.filter(t => t.status === 'WIN').length;
    const losses = monthTrades.filter(t => t.status === 'LOSS').length;
    const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;
    
    // Best and worst days
    const dayPnls: { [key: string]: number } = {};
    monthTrades.forEach(t => {
      dayPnls[t.date] = (dayPnls[t.date] || 0) + t.pnl;
    });
    
    const sortedDays = Object.entries(dayPnls).sort((a, b) => b[1] - a[1]);
    const bestDay = sortedDays[0];
    const worstDay = sortedDays[sortedDays.length - 1];
    
    // Trading days count
    const tradingDays = Object.keys(dayPnls).length;
    const profitableDays = Object.values(dayPnls).filter(p => p > 0).length;
    
    // Current streak
    let streak = 0;
    let streakType: 'win' | 'loss' | null = null;
    const sortedTrades = [...monthTrades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (const trade of sortedTrades) {
      if (streakType === null) {
        streakType = trade.status === 'WIN' ? 'win' : 'loss';
        streak = 1;
      } else if ((streakType === 'win' && trade.status === 'WIN') || (streakType === 'loss' && trade.status === 'LOSS')) {
        streak++;
      } else {
        break;
      }
    }
    
    return {
      totalTrades: monthTrades.length,
      totalPnl,
      wins,
      losses,
      winRate,
      bestDay: bestDay ? { date: bestDay[0], pnl: bestDay[1] } : null,
      worstDay: worstDay && worstDay[1] < 0 ? { date: worstDay[0], pnl: worstDay[1] } : null,
      tradingDays,
      profitableDays,
      streak,
      streakType
    };
  }, [trades, year, month]);

  // Selected day trades
  const selectedDayTrades = useMemo(() => {
    if (!selectedDate) return [];
    return getTradesForDay(trades, selectedDate);
  }, [trades, selectedDate]);

  const today = new Date();
  const isToday = (date: Date) => 
    date.getDate() === today.getDate() && 
    date.getMonth() === today.getMonth() && 
    date.getFullYear() === today.getFullYear();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar bg-slate-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <CalendarIcon className="text-brand-400" size={24} />
            Trading Calendar
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Track your daily performance at a glance</p>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-[160px] text-center">
            <span className="text-lg font-bold text-white">{monthNames[month]} {year}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={handleToday}
            className="ml-2 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Monthly Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-slate-500" />
            <span className="text-xs text-slate-500 uppercase">Total P&L</span>
          </div>
          <p className={`text-xl font-bold font-mono ${monthlyStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {monthlyStats.totalPnl >= 0 ? '+' : ''}${monthlyStats.totalPnl.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-slate-500" />
            <span className="text-xs text-slate-500 uppercase">Win Rate</span>
          </div>
          <p className="text-xl font-bold text-white">
            {monthlyStats.winRate.toFixed(0)}%
          </p>
          <p className="text-[10px] text-slate-500">{monthlyStats.wins}W / {monthlyStats.losses}L</p>
        </div>
        
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-slate-500" />
            <span className="text-xs text-slate-500 uppercase">Streak</span>
          </div>
          <p className={`text-xl font-bold ${monthlyStats.streakType === 'win' ? 'text-emerald-400' : monthlyStats.streakType === 'loss' ? 'text-rose-400' : 'text-slate-400'}`}>
            {monthlyStats.streak > 0 ? `${monthlyStats.streak} ${monthlyStats.streakType === 'win' ? 'Wins' : 'Losses'}` : '-'}
          </p>
        </div>
        
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-slate-500" />
            <span className="text-xs text-slate-500 uppercase">Trading Days</span>
          </div>
          <p className="text-xl font-bold text-white">
            {monthlyStats.tradingDays}
          </p>
          <p className="text-[10px] text-slate-500">{monthlyStats.profitableDays} profitable</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 mb-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-slate-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((dayData, i) => {
            const dayTrades = getTradesForDay(trades, dayData.date);
            const dayPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
            const hasTrades = dayTrades.length > 0;
            const todayDate = isToday(dayData.date);
            const selected = selectedDate?.toDateString() === dayData.date.toDateString();
            
            let bgClass = 'bg-slate-800/30';
            if (hasTrades && dayData.isCurrentMonth) {
              bgClass = dayPnl > 0 
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30' 
                : dayPnl < 0 
                  ? 'bg-rose-500/20 hover:bg-rose-500/30' 
                  : 'bg-slate-700/30 hover:bg-slate-700/50';
            } else if (dayData.isCurrentMonth) {
              bgClass = 'bg-slate-800/30 hover:bg-slate-800/50';
            }

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dayData.date)}
                className={`
                  relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all p-1
                  ${dayData.isCurrentMonth ? '' : 'opacity-30'}
                  ${bgClass}
                  ${todayDate ? 'ring-2 ring-brand-500' : ''}
                  ${selected ? 'ring-2 ring-white' : ''}
                `}
              >
                <span className={`text-sm font-medium ${todayDate ? 'text-brand-400' : dayData.isCurrentMonth ? 'text-slate-300' : 'text-slate-600'}`}>
                  {dayData.date.getDate()}
                </span>
                {hasTrades && dayData.isCurrentMonth && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${dayPnl > 0 ? 'bg-emerald-400' : dayPnl < 0 ? 'bg-rose-400' : 'bg-slate-400'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500/30" />
            <span className="text-xs text-slate-500">Profit Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-rose-500/30" />
            <span className="text-xs text-slate-500">Loss Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded ring-2 ring-brand-500" />
            <span className="text-xs text-slate-500">Today</span>
          </div>
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && selectedDayTrades.length > 0 && (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="space-y-2">
            {selectedDayTrades.map(trade => (
              <div key={trade.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${trade.status === 'WIN' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span className="font-mono font-bold text-white">{trade.symbol}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${trade.tradeType === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {trade.tradeType}
                  </span>
                </div>
                <span className={`font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Breakdown */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-brand-400" />
          Weekly Breakdown
        </h3>
        <div className="space-y-3">
          {weeklySummaries.map((week, i) => (
              <div key={i} className="p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-bold text-white">Week {week.weekNum}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {monthNames[month].slice(0, 3)} {week.startDay} - {week.endDay}
                    </span>
                  </div>
                  <span className={`font-mono font-bold ${week.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {week.pnl >= 0 ? '+' : ''}${week.pnl.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">Trades:</span>
                    <span className="text-xs font-medium text-slate-300">{week.trades.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">Win Rate:</span>
                    <span className={`text-xs font-medium ${week.winRate >= 50 ? 'text-emerald-400' : week.winRate > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                      {week.trades.length > 0 ? `${week.winRate.toFixed(0)}%` : '-'}
                    </span>
                  </div>
                  {week.trades.length > 0 && (
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${week.winRate}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
          ))}
          
          {weeklySummaries.every(w => w.trades.length === 0) && (
            <div className="text-center py-8 text-slate-500">
              <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No trades this month</p>
            </div>
          )}
        </div>
      </div>

      {/* Best/Worst Days */}
      {(monthlyStats.bestDay || monthlyStats.worstDay) && (
        <div className="grid grid-cols-2 gap-4 mt-6">
          {monthlyStats.bestDay && (
            <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-emerald-400" />
                <span className="text-xs text-emerald-400 uppercase font-bold">Best Day</span>
              </div>
              <p className="text-lg font-bold text-emerald-400 font-mono">+${monthlyStats.bestDay.pnl.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(monthlyStats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          )}
          {monthlyStats.worstDay && (
            <div className="bg-rose-500/10 rounded-xl border border-rose-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={16} className="text-rose-400" />
                <span className="text-xs text-rose-400 uppercase font-bold">Worst Day</span>
              </div>
              <p className="text-lg font-bold text-rose-400 font-mono">${monthlyStats.worstDay.pnl.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(monthlyStats.worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;

