import React, { useState, useMemo } from 'react';
import { Target, ChevronDown, ChevronUp, Plus, Edit2, Trash2, Save, X, CheckCircle2, Camera, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { Strategy } from '../types';
import EnhancedPhotoViewer from './EnhancedPhotoViewer';
import PhotoUpload from './PhotoUpload';

const TradeSetup: React.FC = () => {
  const { strategies, trades, addStrategy, updateStrategy, deleteStrategy } = useStore();
  const { theme, isLightTheme } = useTheme();
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(null);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [newStrategyTitle, setNewStrategyTitle] = useState('');
  const [newStrategyItems, setNewStrategyItems] = useState<string[]>(['']);
  const [newStrategyPhotos, setNewStrategyPhotos] = useState<string[]>([]);
  const [viewingPhotoIndex, setViewingPhotoIndex] = useState<number | null>(null);
  const [viewingPhotoStrategy, setViewingPhotoStrategy] = useState<Strategy | null>(null);

  const textPrimary = isLightTheme ? 'text-slate-900' : 'text-white';
  const textSecondary = isLightTheme ? 'text-slate-600' : 'text-slate-400';
  const cardBg = isLightTheme ? 'bg-white' : 'bg-slate-800';

  // Calculate strategy stats
  const strategyStats = useMemo(() => {
    return strategies.map(strategy => {
      const strategyTrades = trades.filter(t => 
        t.strategy === strategy.title || t.strategyId === strategy.id
      );
      
      const strategyPnl = strategyTrades.reduce((sum, t) => sum + t.pnl + (t.commission || 0), 0);
      const strategyWins = strategyTrades.filter(t => t.status === 'WIN').length;
      const strategyLosses = strategyTrades.filter(t => t.status === 'LOSS').length;
      const strategyWinRate = strategyTrades.length > 0 
        ? (strategyWins / strategyTrades.length) * 100 
        : 0;
      
      // Calculate Total Loss (sum of all losses)
      const totalLoss = Math.abs(strategyTrades
        .filter(t => t.pnl < 0)
        .reduce((sum, t) => sum + t.pnl + (t.commission || 0), 0));

      return {
        strategy,
        trades: strategyTrades.length,
        winRate: strategyWinRate,
        totalLoss
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
        items,
        photos: newStrategyPhotos
      });
    } else {
      addStrategy({
        id: `strategy_${Date.now()}`,
        title: newStrategyTitle.trim(),
        symbol: 'GENERAL',
        items,
        photos: newStrategyPhotos
      });
    }

    setIsStrategyModalOpen(false);
    setNewStrategyTitle('');
    setNewStrategyItems(['']);
    setNewStrategyPhotos([]);
    setEditingStrategy(null);
  };

  const handleEditStrategy = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setNewStrategyTitle(strategy.title);
    setNewStrategyItems(strategy.items.length > 0 
      ? strategy.items.map(item => item.text)
      : ['']
    );
    setNewStrategyPhotos(strategy.photos || []);
    setIsStrategyModalOpen(true);
  };

  const handleViewPhoto = (strategy: Strategy, index: number) => {
    setViewingPhotoStrategy(strategy);
    setViewingPhotoIndex(index);
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
              setNewStrategyPhotos([]);
              setIsStrategyModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-900 rounded-xl font-bold transition-colors"
            style={{
              backgroundColor: theme.primary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.primaryDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.primary;
            }}
          >
            <Plus size={18} />
            New Trade Setup
          </button>
        </div>

        {/* Strategy List */}
        {strategyStats.length > 0 ? (
          <div className="space-y-4">
            {strategyStats.map(({ strategy, trades, winRate, totalLoss }) => {
              const isExpanded = expandedStrategyId === strategy.id;
              const strategyPhotos = strategy.photos || [];

              return (
                <div
                  key={strategy.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: theme.cardBg, border: `1px solid ${theme.primary}20` }}
                >
                  <div className="p-4">
                    {/* Strategy Title */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h3 className={`text-lg font-bold ${textPrimary} flex-1`}>{strategy.title}</h3>
                      <div className="flex items-center gap-2">
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

                    {/* Screenshot Section - Middle */}
                    <div className="mb-4">
                      {strategyPhotos.length > 0 ? (
                        <div className="relative">
                          <img
                            src={strategyPhotos[0]}
                            alt="Trade setup screenshot"
                            onClick={() => handleViewPhoto(strategy, 0)}
                            className="w-full h-48 object-cover rounded-xl cursor-pointer border"
                            style={{ borderColor: `${theme.primary}30` }}
                          />
                          {strategyPhotos.length > 1 && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded-lg text-white text-xs backdrop-blur-sm">
                              +{strategyPhotos.length - 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div 
                          className="w-full h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ borderColor: `${theme.primary}50` }}
                          onClick={() => handleEditStrategy(strategy)}
                        >
                          <div className="text-center">
                            <Camera size={24} className="mx-auto mb-1" style={{ color: theme.primary }} />
                            <span className={`text-xs ${textSecondary}`}>Tap to attach screenshot</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <p className={`text-xs ${textSecondary} mb-1`}>Trades</p>
                        <p className={`text-lg font-bold ${textPrimary}`}>{trades}</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs ${textSecondary} mb-1`}>Winrate</p>
                        <p className={`text-lg font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {winRate.toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs ${textSecondary} mb-1`}>Total loss</p>
                        <p className={`text-lg font-bold ${textPrimary} font-mono`}>
                          ${totalLoss.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Checklist Section */}
                    {strategy.items.length > 0 && (
                      <div className="border-t pt-4" style={{ borderColor: isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.3)' }}>
                        <button
                          onClick={() => setExpandedStrategyId(isExpanded ? null : strategy.id)}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors mb-2"
                          style={{ backgroundColor: isLightTheme ? '#f8fafc' : 'rgba(51,65,85,0.2)' }}
                        >
                          <span className={`text-sm font-medium ${textPrimary}`}>
                            Trade Setup Checklist ({strategy.items.length} items)
                          </span>
                          <div className="flex items-center gap-2">
                            {!isExpanded && (
                              <Plus size={18} className={textSecondary} />
                            )}
                            {isExpanded ? (
                              <ChevronUp size={20} className={textSecondary} />
                            ) : (
                              <ChevronDown size={20} className={textSecondary} />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="space-y-2">
                            {strategy.items.map((item) => (
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
                        )}
                      </div>
                    )}
                  </div>
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
                setNewStrategyPhotos([]);
                setIsStrategyModalOpen(true);
              }}
              className="px-6 py-3 text-slate-900 rounded-xl font-bold transition-colors flex items-center gap-2 mx-auto"
              style={{
                backgroundColor: theme.primary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.primaryDark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.primary;
              }}
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
                  {editingStrategy ? 'Edit Trade Setup' : 'Create Trade Setup'}
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
                    placeholder="e.g., XAUUSD Liquidity Sweep"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Screenshot</label>
                  <PhotoUpload
                    photos={newStrategyPhotos}
                    maxPhotos={1}
                    onPhotosChange={setNewStrategyPhotos}
                    theme={theme}
                    isLightTheme={isLightTheme}
                    label="Attach Screenshot"
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
                    className="flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
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

        {/* Enhanced Photo Viewer */}
        {viewingPhotoStrategy && viewingPhotoIndex !== null && (
          <EnhancedPhotoViewer
            images={viewingPhotoStrategy.photos || []}
            currentIndex={viewingPhotoIndex}
            isOpen={true}
            onClose={() => {
              setViewingPhotoStrategy(null);
              setViewingPhotoIndex(null);
            }}
            onNavigate={(index) => setViewingPhotoIndex(index)}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
};

export default TradeSetup;

