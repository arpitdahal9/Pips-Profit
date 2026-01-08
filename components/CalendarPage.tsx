import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, Target, Flame, Calendar as CalendarIcon } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { Trade } from '../types';
import { getISOWeek, getISOWeekStart, getISOWeekEnd, hasTradingDays } from '../utils/weekCalculation';

// Utility functions
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTradesForDay = (trades: Trade[], date: Date): Trade[] => {
  const dateStr = getLocalDateString(date);
  return trades.filter(t => t.date === dateStr);
};

const CalendarPage: React.FC = () => {
  const { trades } = useStore();
  const { theme, isLightTheme } = useTheme();
  const textPrimary = isLightTheme ? 'text-slate-800' : 'text-white';
  const textSecondary = isLightTheme ? 'text-slate-600' : 'text-slate-400';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

  // Weekly summaries using ISO weeks
  const weeklySummaries = useMemo(() => {
    const weeks: { weekNum: number; startDay: number; endDay: number; trades: Trade[]; pnl: number; winRate: number }[] = [];

    // Get all unique dates in the month that have trades
    const monthTrades = trades.filter(t => {
      const [tradeYear, tradeMonth] = t.date.split('-').map(Number);
      return tradeYear === year && tradeMonth - 1 === month;
    });

    if (monthTrades.length === 0) return weeks;

    // Group trades by ISO week
    const weekMap = new Map<number, { start: Date; end: Date; trades: Trade[] }>();

    monthTrades.forEach(trade => {
      const [tradeYear, tradeMonth, tradeDay] = trade.date.split('-').map(Number);
      const tradeDate = new Date(tradeYear, tradeMonth - 1, tradeDay);
      const weekStart = getISOWeekStart(tradeDate);
      const weekEnd = getISOWeekEnd(tradeDate);
      const weekNum = getISOWeek(tradeDate);

      // Only include weeks that are within the current month view
      if (weekStart.getMonth() === month && weekStart.getFullYear() === year) {
        if (!weekMap.has(weekNum)) {
          weekMap.set(weekNum, { start: weekStart, end: weekEnd, trades: [] });
        }
        weekMap.get(weekNum)!.trades.push(trade);
      }
    });

    // Convert to array and filter out weeks with only weekends
    const weekEntries = Array.from(weekMap.entries())
      .filter(([weekNum, weekData]) => {
        // Check if week has trading days (Mon-Fri)
        return hasTradingDays(weekData.start, weekData.end, weekData.trades);
      })
      .sort((a, b) => a[0] - b[0]); // Sort by week number

    weekEntries.forEach(([weekNum, weekData]) => {
      const pnl = weekData.trades.reduce((sum, t) => sum + t.pnl, 0);
      const wins = weekData.trades.filter(t => t.status === 'WIN').length;
      const winRate = weekData.trades.length > 0 ? (wins / weekData.trades.length) * 100 : 0;

      weeks.push({
        weekNum,
        startDay: weekData.start.getDate(),
        endDay: weekData.end.getDate(),
        trades: weekData.trades,
        pnl,
        winRate
      });
    });

    return weeks;
  }, [trades, year, month]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const monthTrades = trades.filter(t => {
      // Parse YYYY-MM-DD string directly to avoid timezone issues
      const [tradeYear, tradeMonth] = t.date.split('-').map(Number);
      return tradeYear === year && tradeMonth - 1 === month;
    });

    const totalPnl = monthTrades.reduce((sum, t) => sum + t.pnl, 0);
    const wins = monthTrades.filter(t => t.status === 'WIN').length;
    const losses = monthTrades.filter(t => t.status === 'LOSS').length;
    const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;

    const dayPnls: { [key: string]: number } = {};
    monthTrades.forEach(t => {
      dayPnls[t.date] = (dayPnls[t.date] || 0) + t.pnl;
    });

    const sortedDays = Object.entries(dayPnls).sort((a, b) => b[1] - a[1]);
    const bestDay = sortedDays.length > 0 ? sortedDays[0] : null;
    const worstDay = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1] : null;

    const tradingDays = Object.keys(dayPnls).length;
    const profitableDays = Object.values(dayPnls).filter(p => p > 0).length;

    let streak = 0;
    let streakType: 'win' | 'loss' | null = null;
    // Sort by date string directly (YYYY-MM-DD format sorts correctly)
    const sortedTrades = [...monthTrades].sort((a, b) => b.date.localeCompare(a.date));

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
    <div
      className="flex-1 h-full overflow-y-auto pb-24"
      style={{ background: theme.bgGradient, backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}
    >
      <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-xl font-bold ${textPrimary} flex items-center gap-2`}>
              <CalendarIcon size={20} style={{ color: theme.primary }} />
              Calendar
            </h1>
          </div>
        </div>

        {/* Month Navigation */}
        <div
          className="flex items-center justify-between p-3 rounded-2xl mb-4"
          style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
        >
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <span className={`text-lg font-bold ${textPrimary}`}>{monthNames[month]} {year}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Monthly Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className="p-4 rounded-2xl"
            style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase">Monthly P&L</span>
            </div>
            <p className={`text-xl font-bold font-mono ${monthlyStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {monthlyStats.totalPnl >= 0 ? '+' : ''}${monthlyStats.totalPnl.toFixed(2)}
            </p>
          </div>

          <div
            className="p-4 rounded-2xl"
            style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase">Win Rate</span>
            </div>
            <p className={`text-xl font-bold ${textPrimary}`}>
              {monthlyStats.winRate.toFixed(0)}%
            </p>
            <p className="text-[10px] text-slate-500">{monthlyStats.wins}W / {monthlyStats.losses}L</p>
          </div>

          <div
            className="p-4 rounded-2xl"
            style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase">Streak</span>
            </div>
            <p className={`text-xl font-bold ${monthlyStats.streakType === 'win' ? 'text-emerald-400' : monthlyStats.streakType === 'loss' ? 'text-rose-400' : 'text-slate-400'}`}>
              {monthlyStats.streak > 0 ? `${monthlyStats.streak} ${monthlyStats.streakType === 'win' ? 'W' : 'L'}` : '-'}
            </p>
          </div>

          <div
            className="p-4 rounded-2xl"
            style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase">Trading Days</span>
            </div>
            <p className={`text-xl font-bold ${textPrimary}`}>
              {monthlyStats.tradingDays}
            </p>
            <p className="text-[10px] text-slate-500">{monthlyStats.profitableDays} profitable</p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div
          className="p-4 rounded-2xl mb-4"
          style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
        >
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-slate-500 py-2">
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

              let bgClass = 'bg-transparent';
              if (hasTrades && dayData.isCurrentMonth) {
                bgClass = dayPnl > 0
                  ? 'bg-emerald-500/20'
                  : dayPnl < 0
                    ? 'bg-rose-500/20'
                    : 'bg-slate-700/30';
              }

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dayData.date)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all
                    ${dayData.isCurrentMonth ? '' : 'opacity-30'}
                    ${bgClass}
                    ${todayDate ? 'ring-2' : ''}
                    ${selected ? 'ring-2 ring-white' : ''}
                  `}
                  style={todayDate && !selected ? { '--tw-ring-color': theme.primary } as any : {}}
                >
                  <span className={`text-xs font-medium ${todayDate ? '' : dayData.isCurrentMonth ? 'text-slate-300' : 'text-slate-600'}`} style={todayDate ? { color: theme.primary } : {}}>
                    {dayData.date.getDate()}
                  </span>
                  {hasTrades && dayData.isCurrentMonth && dayPnl !== 0 && (
                    <span 
                      className={`text-[9px] font-bold mt-0.5 ${dayPnl > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {dayPnl > 0 ? '+' : ''}{dayPnl.toFixed(0)}
                    </span>
                  )}
                  {hasTrades && dayData.isCurrentMonth && dayPnl === 0 && (
                    <div className="w-1 h-1 rounded-full mt-0.5 bg-slate-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500/30" />
              <span className="text-[10px] text-slate-500">Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-rose-500/30" />
              <span className="text-[10px] text-slate-500">Loss</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded ring-1" style={{ '--tw-ring-color': theme.primary } as any} />
              <span className="text-[10px] text-slate-500">Today</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDate && selectedDayTrades.length > 0 && (
          <div
            className="p-4 rounded-2xl mb-4"
            style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
          >
            <h3 className={`text-sm font-bold ${textPrimary} mb-3`}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <div className="space-y-2">
              {selectedDayTrades.map(trade => (
                <div key={trade.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${trade.status === 'WIN' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span className={`font-mono font-bold ${textPrimary} text-sm`}>{trade.symbol}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${trade.tradeType === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {trade.tradeType}
                    </span>
                  </div>
                  <span className={`font-mono font-bold text-sm ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Breakdown */}
        <div
          className="p-4 rounded-2xl"
          style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
        >
          <h3 className={`text-sm font-bold ${textPrimary} mb-4 flex items-center gap-2`}>
            <BarChart3 size={14} style={{ color: theme.primary }} />
            Weekly Breakdown
          </h3>
          <div className="space-y-2">
            {weeklySummaries.map((week, i) => (
              <div key={i} className="p-3 bg-slate-800/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className={`text-xs font-bold ${textPrimary}`}>Week {week.weekNum}</span>
                    <span className="text-[10px] text-slate-500 ml-2">
                      {monthNames[month].slice(0, 3)} {week.startDay}-{week.endDay}
                    </span>
                  </div>
                  <span className={`font-mono text-xs font-bold ${week.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {week.pnl >= 0 ? '+' : ''}${week.pnl.toFixed(0)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">{week.trades.length} trades</span>
                  <span className={`text-[10px] ${week.winRate >= 50 ? 'text-emerald-400' : week.winRate > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {week.trades.length > 0 ? `${week.winRate.toFixed(0)}% WR` : '-'}
                  </span>
                  {week.trades.length > 0 && (
                    <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${week.winRate}%`, background: theme.primary }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {weeklySummaries.every(w => w.trades.length === 0) && (
              <div className="text-center py-6 text-slate-500">
                <CalendarIcon size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No trades this month</p>
              </div>
            )}
          </div>
        </div>

        {/* Best/Worst Days */}
        {(monthlyStats.bestDay || monthlyStats.worstDay) && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {monthlyStats.bestDay && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 uppercase font-bold">
                    {monthlyStats.tradingDays === 1 ? 'Only Trading Day' : 'Best Day'}
                  </span>
                </div>
                <p className="text-lg font-bold text-emerald-400 font-mono">+${monthlyStats.bestDay.pnl.toFixed(0)}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {new Date(monthlyStats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            )}
            {monthlyStats.worstDay && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown size={14} className="text-rose-400" />
                  <span className="text-[10px] text-rose-400 uppercase font-bold">Worst Day</span>
                </div>
                <p className="text-lg font-bold text-rose-400 font-mono">${monthlyStats.worstDay.pnl.toFixed(0)}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {new Date(monthlyStats.worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
