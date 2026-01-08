import React, { useState, useMemo } from 'react';
import { Target, ChevronDown, ChevronUp, Plus, Edit2, Trash2, Save, X, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { Strategy } from '../types';

const TradeSetup: React.FC = () => {
  const { strategies, trades, addStrategy, updateStrategy, deleteStrategy } = useStore();
  const { theme, isLightTheme } = useTheme();
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(null);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [newStrategyTitle, setNewStrategyTitle] = useState('');
  const [newStrategyItems, setNewStrategyItems] = useState<string[]>(['']);

  const textPrimary = isLightTheme ? 'text-slate-900' : 'text-white';
  const textSecondary = isLightTheme ? 'text-slate-600' : 'text-slate-400';
  const cardBg = isLightTheme ? 'bg-white' : 'bg-slate-800';

  // Calculate strategy stats
  const strategyStats = useMemo(() => {
    return strategies.map(strategy => {
      const strategyTrades = trades.filter(t => 
        t.strategy === strategy.title || t.strategyId === strategy.id
      );
      
      const strategyPnl = strategyTrades.reduce((sum, t) => sum + t.pnl, 0);
      const strategyWins = strategyTrades.filter(t => t.status === 'WIN').length;
      const strategyLosses = strategyTrades.filter(t => t.status === 'LOSS').length;
      const strategyWinRate = strategyTrades.length > 0 
        ? (strategyWins / strategyTrades.length) * 100 
        : 0;
      
      // Calculate Risk:Reward ratio (average)
      const rrTrades = strategyTrades.filter(t => t.riskRewardRatio);
      const avgRR = rrTrades.length > 0
        ? rrTrades.reduce((sum, t) => sum + (t.riskRewardRatio || 0), 0) / rrTrades.length
        : 0;

      return {
        strategy,
        trades: strategyTrades.length,
        winRate: strategyWinRate,
        pnl: strategyPnl,
        riskReward: avgRR
      };
    });
  }, [strategies, trades]);

  const handleAddItem = () => {
    setNewStrategyItems([...newStrategyItems, '']);
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...newStrategyItems];
    newItems[index] = value;
    setNewStrategyItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setNewStrategyItems(newStrategyItems.filter((_, i) => i !== index));
  };

  const handleSaveStrategy = () => {
    if (!newStrategyTitle.trim()) return;

    const items = newStrategyItems
      .filter(item => item.trim() !== '')
      .map((text, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        text: text.trim(),
        checked: false
      }));

    if (editingStrategy) {
      updateStrategy(editingStrategy.id, {
        title: newStrategyTitle.trim(),
        items
      });
    } else {
      addStrategy({
        id: `strategy_${Date.now()}`,
        title: newStrategyTitle.trim(),
        symbol: 'GENERAL',
        items
      });
    }

    setIsStrategyModalOpen(false);
    setNewStrategyTitle('');
    setNewStrategyItems(['']);
    setEditingStrategy(null);
  };

  const handleEditStrategy = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setNewStrategyTitle(strategy.title);
    setNewStrategyItems(strategy.items.length > 0 
      ? strategy.items.map(item => item.text)
      : ['']
    );
    setIsStrategyModalOpen(true);
  };

  return (
    <div
      className="flex-1 h-full overflow-y-auto pb-20"
      style={{ background: theme.bgGradient, backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}
    >
      <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-xl font-bold ${textPrimary} flex items-center gap-2`}>
            <Target size={20} style={{ color: theme.primary }} />
            Trade Setup Manager
          </h1>
          <p className={`text-xs mt-0.5 ${textSecondary}`}>Manage your trading strategies and track their performance</p>
        </div>

        {/* New Strategy Button */}
        <div className="mb-4">
          <button
            onClick={() => {
              setEditingStrategy(null);
              setNewStrategyTitle('');
              setNewStrategyItems(['']);
              setIsStrategyModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-900 rounded-xl font-bold transition-colors"
          >
            <Plus size={18} />
            New Strategy
          </button>
        </div>

        {/* Strategy List */}
        {strategyStats.length > 0 ? (
          <div className="space-y-4">
            {strategyStats.map(({ strategy, trades, winRate, pnl, riskReward }) => {
              const isExpanded = expandedStrategyId === strategy.id;

              return (
                <div
                  key={strategy.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
                >
                  {/* Strategy Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-base font-bold ${textPrimary}`}>{strategy.title}</h3>
                        
                        {/* Stats Table */}
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b" style={{ borderColor: isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.3)' }}>
                                <th className={`text-left py-2 px-3 ${textSecondary} font-semibold`}>Trades</th>
                                <th className={`text-left py-2 px-3 ${textSecondary} font-semibold`}>WinRate</th>
                                <th className={`text-left py-2 px-3 ${textSecondary} font-semibold`}>P&L</th>
                                <th className={`text-left py-2 px-3 ${textSecondary} font-semibold`}>Risk:Reward</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className={`py-2 px-3 ${textPrimary} font-medium`}>{trades}</td>
                                <td className={`py-2 px-3 ${winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'} font-medium`}>
                                  {winRate.toFixed(0)}%
                                </td>
                                <td className={`py-2 px-3 font-mono font-medium ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                </td>
                                <td className={`py-2 px-3 ${textPrimary} font-medium`}>
                                  {riskReward > 0 ? `1:${riskReward.toFixed(2)}` : '-'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditStrategy(strategy)}
                          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit strategy"
                        >
                          <Edit2 size={18} className={textSecondary} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${strategy.title}"? This cannot be undone.`)) {
                              deleteStrategy(strategy.id);
                            }
                          }}
                          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete strategy"
                        >
                          <Trash2 size={18} className="text-rose-400" />
                        </button>
                      </div>
                    </div>

                    {/* Checklist Toggle */}
                    {strategy.items.length > 0 && (
                      <button
                        onClick={() => setExpandedStrategyId(isExpanded ? null : strategy.id)}
                        className="mt-4 w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                        style={{ backgroundColor: isLightTheme ? '#f8fafc' : 'rgba(51,65,85,0.2)' }}
                      >
                        <span className={`text-sm font-medium ${textPrimary}`}>
                          Trade Setup Checklist ({strategy.items.length} items)
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={20} className={textSecondary} />
                        ) : (
                          <ChevronDown size={20} className={textSecondary} />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expanded Checklist */}
                  {isExpanded && strategy.items.length > 0 && (
                    <div 
                      className="px-4 pb-4 border-t"
                      style={{ borderColor: isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.3)' }}
                    >
                      <div className="pt-4 space-y-2">
                        {strategy.items.map((item, idx) => (
                          <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg">
                            <CheckCircle2 
                              size={18} 
                              className={`mt-0.5 flex-shrink-0 ${item.checked ? 'text-emerald-400' : textSecondary}`}
                            />
                            <span className={`text-sm ${item.checked ? 'line-through text-slate-500' : textPrimary}`}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="p-8 text-center rounded-2xl"
            style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
          >
            <Target size={48} className="mx-auto mb-4 text-slate-500" />
            <p className={`text-lg ${textPrimary} mb-2`}>No strategies created yet</p>
            <p className={`text-sm ${textSecondary} mb-6`}>Create your first trading strategy to get started</p>
            <button
              onClick={() => {
                setEditingStrategy(null);
                setNewStrategyTitle('');
                setNewStrategyItems(['']);
                setIsStrategyModalOpen(true);
              }}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-slate-900 rounded-xl font-bold transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              Create Your First Strategy
            </button>
          </div>
        )}

        {/* Strategy Create/Edit Modal */}
        {isStrategyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
              style={{ borderColor: theme.primary + '30' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  {editingStrategy ? 'Edit Strategy' : 'Create Strategy'}
                </h3>
                <button
                  onClick={() => setIsStrategyModalOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Strategy Name *</label>
                  <input
                    type="text"
                    value={newStrategyTitle}
                    onChange={(e) => setNewStrategyTitle(e.target.value)}
                    placeholder="e.g., London Breakout"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-400">Trade Setup Checklist</label>
                    <button
                      onClick={handleAddItem}
                      className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Item
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newStrategyItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleItemChange(index, e.target.value)}
                          placeholder="e.g., Sweep of Asian High"
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                        />
                        {newStrategyItems.length > 1 && (
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveStrategy}
                    disabled={!newStrategyTitle.trim()}
                    className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {editingStrategy ? 'Update' : 'Create'}
                  </button>
                  <button
                    onClick={() => setIsStrategyModalOpen(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeSetup;

