import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  Share2,
  X,
  Tag as TagIcon,
  TrendingUp,
  Clock,
  MapPin,
  ChevronDown,
  Target,
  Plus
} from 'lucide-react';
import TradingViewWidget from './TradingViewWidget';
import RichTextEditor from './RichTextEditor';
import EconomicCalendarWidget from './EconomicCalendarWidget';
import { useStore } from '../context/StoreContext';
import { Trade, TradeStatus } from '../types';

const StarRating = ({ rating, setRating }: { rating: number, setRating: (r: number) => void }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setRating(star)}
          className={`focus:outline-none transition-all active:scale-90 ${star <= rating ? 'text-brand-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'text-slate-700'}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={star <= rating ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const TagSelector = ({ selectedTags, onToggle }: { selectedTags: string[], onToggle: (id: string) => void }) => {
    const { tags, addTag } = useStore();
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filtered = tags.filter(t => t.label.toLowerCase().includes(search.toLowerCase()));

    const handleCreateTag = () => {
      if (!search) return;
      const newTag = {
        id: `tag_${Date.now()}`,
        label: search,
        color: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
        category: 'custom' as const
      };
      addTag(newTag);
      onToggle(newTag.id);
      setSearch('');
    };

    return (
        <div className="relative">
            <div 
                className="flex flex-wrap gap-2 p-2 border border-slate-700 rounded-lg bg-slate-800/50 min-h-[42px] cursor-text focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all"
                onClick={() => setIsOpen(true)}
            >
                {selectedTags.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                        <span key={tag.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${tag.color}`}>
                            {tag.label}
                            <button onClick={(e) => { e.stopPropagation(); onToggle(tag.id); }} className="hover:text-white">
                                <X size={12} />
                            </button>
                        </span>
                    );
                })}
                <input 
                    type="text" 
                    className="flex-1 min-w-[60px] outline-none text-sm bg-transparent text-white placeholder:text-slate-600"
                    placeholder={selectedTags.length === 0 ? "Add tags..." : ""}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filtered.length === 0 && search) {
                        handleCreateTag();
                      }
                    }}
                />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl shadow-black z-20 max-h-60 overflow-y-auto">
                        <div className="p-2">
                             {filtered.map(tag => (
                                 <button key={tag.id} onClick={() => onToggle(tag.id)} className="w-full text-left px-2 py-2 text-sm hover:bg-slate-700 rounded flex items-center justify-between group text-slate-300">
                                     <span className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${tag.color.split(' ')[0]}`}></div>
                                        {tag.label}
                                     </span>
                                     {selectedTags.includes(tag.id) && <CheckCircle2 size={14} className="text-brand-500" />}
                                 </button>
                             ))}
                             {filtered.length === 0 && search && (
                               <button onClick={handleCreateTag} className="w-full text-left px-2 py-2 text-sm hover:bg-slate-700 rounded flex items-center gap-2 text-brand-400">
                                  <Plus size={14} /> Create "{search}"
                               </button>
                             )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const TrackingView = () => {
  const { trades, strategies, updateTrade } = useStore();
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);

  // Get the active trade from the selected ID, or default to the most recent trade
  const activeTrade = useMemo(() => {
    if (selectedTradeId) {
      const trade = trades.find(t => t.id === selectedTradeId);
      if (trade) return trade;
    }
    return trades.length > 0 ? trades[0] : null;
  }, [trades, selectedTradeId]);

  // Update selected trade ID when trades change (e.g., when a new trade is added)
  useEffect(() => {
    if (trades.length > 0 && !selectedTradeId) {
      setSelectedTradeId(trades[0].id);
    } else if (trades.length === 0) {
      setSelectedTradeId(null);
    }
  }, [trades, selectedTradeId]);

  const [selectedStrategyId, setSelectedStrategyId] = useState<string | undefined>(activeTrade?.strategyId);

  // Update selectedStrategyId when activeTrade changes
  useEffect(() => {
    if (activeTrade) {
      setSelectedStrategyId(activeTrade.strategyId);
    }
  }, [activeTrade]);

  // Filter strategies based on the trade's symbol
  const availableStrategies = useMemo(() => {
    if (!activeTrade) return [];
    return strategies.filter(s => s.symbol.toUpperCase() === activeTrade.symbol.toUpperCase());
  }, [strategies, activeTrade]);

  const activeStrategy = strategies.find(s => s.id === selectedStrategyId);

  const handleTagToggle = (tagId: string) => {
    if (!activeTrade) return;
    const newTags = activeTrade.tags.includes(tagId)
      ? activeTrade.tags.filter(t => t !== tagId)
      : [...activeTrade.tags, tagId];
    updateTrade(activeTrade.id, { tags: newTags });
  };

  // Show empty state if no trades
  if (!activeTrade || trades.length === 0) {
    return (
      <div className="flex-1 h-full overflow-y-auto p-8 custom-scrollbar bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4 text-lg">Live Terminal only active after a trade input</p>
          <p className="text-slate-600 text-sm">Create a trade in the Trade Journal to view it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-slate-950 text-slate-200">
      {/* Left Panel: Trade Details */}
      <div className="w-[380px] flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-2xl z-10">
        
        {/* Trade Selector */}
        {trades.length > 1 && (
          <div className="p-3 border-b border-slate-800 bg-slate-800/50">
            <select
              value={selectedTradeId || ''}
              onChange={(e) => setSelectedTradeId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500 outline-none"
            >
              {trades.map(trade => (
                <option key={trade.id} value={trade.id}>
                  {trade.symbol} - {trade.date} {trade.time}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl font-bold text-white tracking-tight uppercase">
                            {activeTrade.symbol}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${activeTrade.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                            {activeTrade.side}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock size={12} /> {activeTrade.date} • {activeTrade.time}
                        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                        <MapPin size={12} /> {activeTrade.session}
                    </div>
                </div>
                <div className="flex gap-1">
                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"><Share2 size={16} /></button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
                 <div className={`p-3 rounded-xl border ${activeTrade.pnl >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                    <span className="text-xs text-slate-500 block mb-1">Net P&L</span>
                    <span className={`text-xl font-mono font-bold ${activeTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                         {activeTrade.pnl >= 0 ? '+' : ''}${Math.abs(activeTrade.pnl).toFixed(2)}
                    </span>
                 </div>
                 <div className="p-3 rounded-xl border border-slate-700 bg-slate-800/50">
                    <span className="text-xs text-slate-500 block mb-1">Pips</span>
                    <span className={`text-xl font-mono font-bold ${activeTrade.pips >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                         {activeTrade.pips >= 0 ? '+' : ''}{activeTrade.pips}
                    </span>
                 </div>
            </div>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            
            {/* Entry/Exit Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                <div>
                    <span className="text-xs text-slate-500 block mb-1">Entry Price</span>
                    <span className="font-mono text-white">{activeTrade.entryPrice.toFixed(2)}</span>
                </div>
                <div>
                    <span className="text-xs text-slate-500 block mb-1">Exit Price</span>
                    <span className="font-mono text-white">{activeTrade.exitPrice.toFixed(2)}</span>
                </div>
                <div>
                    <span className="text-xs text-slate-500 block mb-1">Lot Size</span>
                    <span className="font-mono text-white">{activeTrade.lots.toFixed(2)} Lots</span>
                </div>
                <div>
                    <span className="text-xs text-slate-500 block mb-1">R:R Achieved</span>
                    <span className="font-mono text-white">1:2.4</span>
                </div>
            </div>

            {/* Strategy Section */}
            <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Strategy & Execution</label>
                <div className="relative">
                    <button 
                        onClick={() => setIsStrategyOpen(!isStrategyOpen)}
                        className="w-full bg-slate-800 border border-slate-700 hover:border-slate-600 text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between text-slate-200 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                             <Target size={16} className="text-brand-500" />
                             {activeStrategy ? activeStrategy.title : 'Select Strategy'}
                        </span>
                        <ChevronDown size={14} className="text-slate-500" />
                    </button>

                    {isStrategyOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden max-h-60 overflow-y-auto">
                            {availableStrategies.length > 0 ? availableStrategies.map(s => (
                                <button 
                                    key={s.id}
                                    onClick={() => { setSelectedStrategyId(s.id); setIsStrategyOpen(false); }}
                                    className="w-full text-left px-4 py-3 text-sm hover:bg-slate-700 text-slate-300 border-b border-slate-700/50 last:border-0"
                                >
                                    {s.title}
                                </button>
                            )) : (
                                <div className="px-4 py-3 text-sm text-slate-500 italic text-center">No strategies for {activeTrade.symbol}</div>
                            )}
                        </div>
                    )}
                </div>

                {activeStrategy && (
                    <div className="mt-3 bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
                        <div className="space-y-2.5">
                            {activeStrategy.items.map(item => (
                                <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${item.checked ? 'bg-brand-500 border-brand-500' : 'border-slate-600 group-hover:border-brand-500/50'}`}>
                                        {item.checked && <CheckCircle2 size={12} className="text-slate-900" />}
                                    </div>
                                    <span className={`text-sm ${item.checked ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                        {item.text}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <hr className="border-slate-800" />

            {/* Performance Review */}
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-300">Execution Score</span>
                        <span className="text-xs text-brand-500 font-mono">{activeTrade.rating}/5.0</span>
                    </div>
                    <StarRating rating={activeTrade.rating} setRating={(r) => {
                      if (activeTrade) {
                        updateTrade(activeTrade.id, { rating: r });
                      }
                    }} />
                </div>
            </div>

            <hr className="border-slate-800" />

            {/* Tags */}
            <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                    <TagIcon size={12} />
                    Tags
                </label>
                <TagSelector selectedTags={activeTrade.tags} onToggle={handleTagToggle} />
            </div>

            {/* Economic Calendar Widget Filler */}
            <div className="pt-4 h-[300px]">
                <EconomicCalendarWidget />
            </div>
            
            <div className="h-10"></div>
        </div>
      </div>

      {/* Right Panel: Chart & Notes */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        
        {/* Toolbar */}
        <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between shrink-0">
            <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-white border border-slate-700 rounded-lg shadow-sm">Chart</button>
            </div>
            <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Live Sync</span>
                 </div>
            </div>
        </div>

        {/* Chart Area */}
        <div className="h-[60%] w-full bg-slate-900 relative border-b border-slate-800">
             <TradingViewWidget symbol={activeTrade.tradingViewSymbol} theme="dark" />
        </div>

        {/* Notes Area */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 bg-slate-950">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="font-semibold text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-brand-500"/>
                    Trade Journal
                 </h3>
                 <button className="text-xs text-brand-500 hover:text-brand-400 font-medium">Use Template</button>
             </div>
             
             <div className="flex-1 overflow-y-auto">
                 <RichTextEditor 
                    value={activeTrade.notes} 
                    onChange={(val) => {
                      if (activeTrade) {
                        updateTrade(activeTrade.id, { notes: val });
                      }
                    }} 
                    className="h-full border-slate-800"
                 />
             </div>
        </div>

      </div>
    </div>
  );
};

export default TrackingView;