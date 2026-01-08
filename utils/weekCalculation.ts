// ISO Week calculation utilities

/**
 * Get the ISO week number for a given date
 * ISO weeks start on Monday and week 1 is the first week with at least 4 days in the new year
 */
export const getISOWeek = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Get the start date (Monday) of the ISO week for a given date
 */
export const getISOWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

/**
 * Get the end date (Sunday) of the ISO week for a given date
 */
export const getISOWeekEnd = (date: Date): Date => {
  const weekStart = getISOWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
};

/**
 * Check if a week has trading days (Monday-Friday)
 * Returns true if the week has at least one weekday (Mon-Fri)
 */
export const hasTradingDays = (weekStart: Date, weekEnd: Date, trades: any[]): boolean => {
  // Check if any day in the week (Mon-Fri) has trades
  for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (trades.some(t => t.date === dateStr)) {
      return true;
    }
  }
  return false;
};

