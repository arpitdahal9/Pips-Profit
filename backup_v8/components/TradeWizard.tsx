import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Wallet, ChevronDown, SkipForward, Calculator, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Trade, TradeStatus, TradingSession } from '../types';

interface TradeWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Step in the wizard flow
type WizardStep = 'entry' | 'details';

// Interactive question steps
type DetailStep = 
  | 'strategy'
  | 'planDiscipline'
  | 'session'
  | 'emotion'
  | 'mistakes'
  | 'notes';

const COMMON_PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'BTCUSD', 'US30', 'NAS100'];

const EMOTIONS = ['Confident', 'Anxious', 'Greedy', 'Fearful', 'Frustrated', 'Calm', 'Excited', 'FOMO', 'Revenge'];

const COMMON_MISTAKES = [
  'Moved stop loss',
  'No stop loss',
  'Over-leveraged',
  'Entered too early',
  'Entered too late',
  'Exited too early',
  'Held too long',
  'Ignored plan',
  'Revenge trade',
  'FOMO entry'
];

// Asset class detection and pip value calculation
const getAssetInfo = (symbol: string): { type: string; pipValue: number; pipSize: number; description: string } => {
  const s = symbol.toUpperCase();
  
  // Gold
  if (s === 'XAUUSD' || s === 'GOLD') {
    return { type: 'gold', pipValue: 100, pipSize: 1, description: '$100 per $1 move per lot' };
  }
  
  // Silver
  if (s === 'XAGUSD' || s === 'SILVER') {
    return { type: 'silver', pipValue: 5000, pipSize: 0.01, description: '$50 per $0.01 move per lot' };
  }
  
  // JPY pairs (pip = 0.01)
  if (s.includes('JPY')) {
    return { type: 'jpy_pair', pipValue: 6.5, pipSize: 0.01, description: '~$6.50 per pip per lot' };
  }
  
  // Major USD pairs (pip = 0.0001)
  if (['EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD'].includes(s)) {
    return { type: 'usd_major', pipValue: 10, pipSize: 0.0001, description: '$10 per pip per lot' };
  }
  
  // USD quote pairs
  if (s.endsWith('USD') && s.length === 6) {
    return { type: 'xxx_usd', pipValue: 10, pipSize: 0.0001, description: '$10 per pip per lot' };
  }
  
  // Indices
  if (['US30', 'DJ30', 'DOW'].some(idx => s.includes(idx))) {
    return { type: 'index', pipValue: 1, pipSize: 1, description: '$1 per point per lot' };
  }
  if (['NAS100', 'USTEC', 'NDX'].some(idx => s.includes(idx))) {
    return { type: 'index', pipValue: 1, pipSize: 1, description: '$1 per point per lot' };
  }
  if (['SPX500', 'SP500', 'US500'].some(idx => s.includes(idx))) {
    return { type: 'index', pipValue: 1, pipSize: 1, description: '$1 per point per lot' };
  }
  
  // Crypto
  if (['BTCUSD', 'BITCOIN'].some(c => s.includes(c))) {
    return { type: 'crypto', pipValue: 1, pipSize: 1, description: '$1 per $1 move per lot' };
  }
  if (['ETHUSD', 'ETHEREUM'].some(c => s.includes(c))) {
    return { type: 'crypto', pipValue: 1, pipSize: 1, description: '$1 per $1 move per lot' };
  }
  
  // Oil
  if (['USOIL', 'WTIUSD', 'CRUDEOIL', 'CL'].some(o => s.includes(o))) {
    return { type: 'oil', pipValue: 10, pipSize: 0.01, description: '$10 per $0.01 move per lot' };
  }
  
  // Default forex cross
  return { type: 'forex_cross', pipValue: 10, pipSize: 0.0001, description: '~$10 per pip per lot' };
};

// Calculate P&L
const calculatePnL = (
  symbol: string,
  direction: 'BUY' | 'SELL' | '',
  entryPrice: number,
  exitPrice: number,
  lots: number
): number | null => {
  if (!symbol || !direction || !entryPrice || !exitPrice || !lots) {
    return null;
  }
  
  const assetInfo = getAssetInfo(symbol);
  const priceDiff = exitPrice - entryPrice;
  const directionMultiplier = direction === 'BUY' ? 1 : -1;
  
  let pnl: number;
  
  switch (assetInfo.type) {
    case 'gold':
      // Gold: $100 per $1 move per lot
      pnl = priceDiff * lots * 100 * directionMultiplier;
      break;
    case 'silver':
      // Silver: $5000 per $1 move per lot (or $50 per $0.01)
      pnl = priceDiff * lots * 5000 * directionMultiplier;
      break;
    case 'jpy_pair':
      // JPY pairs: price diff in pips (0.01) × lots × ~$6.50
      const jpyPips = priceDiff / 0.01;
      pnl = jpyPips * lots * 6.5 * directionMultiplier;
      break;
    case 'index':
    case 'crypto':
      // Indices/Crypto: $1 per point per lot
      pnl = priceDiff * lots * directionMultiplier;
      break;
    case 'oil':
      // Oil: $10 per $0.01 move per lot
      pnl = priceDiff * lots * 1000 * directionMultiplier;
      break;
    default:
      // Standard forex: pip = 0.0001, $10 per pip per lot
      const pips = priceDiff / 0.0001;
      pnl = pips * lots * 10 * directionMultiplier;
      break;
  }
  
  return Math.round(pnl * 100) / 100; // Round to 2 decimals
};

// Calculate R:R ratio
const calculateRR = (
  direction: 'BUY' | 'SELL' | '',
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number | null => {
  if (!direction || !entryPrice || !stopLoss || !takeProfit) {
    return null;
  }
  
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  
  if (risk === 0) return null;
  
  return Math.round((reward / risk) * 100) / 100;
};

const TradeWizard: React.FC<TradeWizardProps> = ({ isOpen, onClose }) => {
  const { addTrade, accounts, getMainAccount, strategies } = useStore();
  
  // Main wizard step
  const [wizardStep, setWizardStep] = useState<WizardStep>('entry');
  const [detailStep, setDetailStep] = useState<DetailStep>('strategy');
  
  // Account selection
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  
  // Manual P&L override
  const [manualPnL, setManualPnL] = useState(false);
  
  const getDefaultAccountId = () => {
    const mainAccount = getMainAccount();
    const visibleAccounts = accounts.filter(a => !a.isHidden);
    if (mainAccount && !mainAccount.isHidden) return mainAccount.id;
    if (visibleAccounts.length > 0) return visibleAccounts[0].id;
    return '';
  };

  // Trade entry data
  const [entryData, setEntryData] = useState({
    symbol: '',
    direction: '' as 'BUY' | 'SELL' | '',
    entryPrice: '',
    exitPrice: '',
    stopLoss: '',
    takeProfit: '',
    lots: '',
    pnl: '',
    date: new Date().toISOString().split('T')[0],
    accountId: getDefaultAccountId()
  });

  // Optional detail data
  const [detailData, setDetailData] = useState({
    strategy: '',
    customStrategy: '',
    planDiscipline: null as boolean | null,
    session: 'New York' as TradingSession,
    emotions: [] as string[],
    mistakes: [] as string[],
    customMistake: '',
    notes: ''
  });

  // Auto-calculate P&L
  const calculatedPnL = useMemo(() => {
    return calculatePnL(
      entryData.symbol,
      entryData.direction,
      parseFloat(entryData.entryPrice) || 0,
      parseFloat(entryData.exitPrice) || 0,
      parseFloat(entryData.lots) || 0
    );
  }, [entryData.symbol, entryData.direction, entryData.entryPrice, entryData.exitPrice, entryData.lots]);

  // Auto-calculate R:R
  const calculatedRR = useMemo(() => {
    return calculateRR(
      entryData.direction,
      parseFloat(entryData.entryPrice) || 0,
      parseFloat(entryData.stopLoss) || 0,
      parseFloat(entryData.takeProfit) || 0
    );
  }, [entryData.direction, entryData.entryPrice, entryData.stopLoss, entryData.takeProfit]);

  // Get asset info for display
  const assetInfo = useMemo(() => {
    if (!entryData.symbol) return null;
    return getAssetInfo(entryData.symbol);
  }, [entryData.symbol]);

  // Update P&L when calculated (if not manual)
  useEffect(() => {
    if (!manualPnL && calculatedPnL !== null) {
      setEntryData(prev => ({ ...prev, pnl: calculatedPnL.toString() }));
    }
  }, [calculatedPnL, manualPnL]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setWizardStep('entry');
      setDetailStep('strategy');
      setManualPnL(false);
      setEntryData({
        symbol: '',
        direction: '',
        entryPrice: '',
        exitPrice: '',
        stopLoss: '',
        takeProfit: '',
        lots: '',
        pnl: '',
        date: new Date().toISOString().split('T')[0],
        accountId: getDefaultAccountId()
      });
      setDetailData({
        strategy: '',
        customStrategy: '',
        planDiscipline: null,
        session: 'New York',
        emotions: [],
        mistakes: [],
        customMistake: '',
        notes: ''
      });
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  // Validation
  const canProceedToDetails = () => {
    const pnlValue = parseFloat(entryData.pnl);
    return (
      entryData.symbol.trim() !== '' &&
      entryData.direction !== '' &&
      !isNaN(pnlValue)
    );
  };

  // Save trade
  const saveTrade = () => {
    const pnl = parseFloat(entryData.pnl) || 0;
    
    const newTrade: Trade = {
      id: Date.now().toString(),
      symbol: entryData.symbol.toUpperCase(),
      tradingViewSymbol: entryData.symbol.toUpperCase(),
      status: pnl >= 0 ? TradeStatus.WIN : TradeStatus.LOSS,
      pnl,
      date: entryData.date,
      time: new Date().toTimeString().slice(0, 5),
      session: detailData.session,
      side: entryData.direction === 'BUY' ? 'LONG' : 'SHORT',
      entryPrice: parseFloat(entryData.entryPrice) || 0,
      exitPrice: parseFloat(entryData.exitPrice) || 0,
      lots: parseFloat(entryData.lots) || 0,
      pips: 0,
      rating: 3,
      tags: [],
      notes: detailData.notes,
      tradeType: entryData.direction === 'BUY' ? 'Buy' : 'Sell',
      strategy: detailData.strategy === 'Other' ? detailData.customStrategy : detailData.strategy,
      planDiscipline: detailData.planDiscipline,
      emotion: detailData.emotions.join(', '),
      mistakes: detailData.customMistake ? [detailData.customMistake] : detailData.mistakes,
      accountId: entryData.accountId,
      includeInAccount: true,
      riskRewardRatio: calculatedRR || undefined,
      riskAmount: parseFloat(entryData.stopLoss) ? Math.abs(parseFloat(entryData.entryPrice) - parseFloat(entryData.stopLoss)) : undefined,
      tpAmount: parseFloat(entryData.takeProfit) ? Math.abs(parseFloat(entryData.takeProfit) - parseFloat(entryData.entryPrice)) : undefined,
    };
    
    addTrade(newTrade);
    onClose();
  };

  // Auto-advance to next detail step
  const advanceDetailStep = () => {
    const steps: DetailStep[] = ['strategy', 'planDiscipline', 'session', 'emotion', 'mistakes', 'notes'];
    const currentIndex = steps.indexOf(detailStep);
    if (currentIndex < steps.length - 1) {
      setTimeout(() => setDetailStep(steps[currentIndex + 1]), 300);
    }
  };

  // Handle back in details
  const handleDetailBack = () => {
    const steps: DetailStep[] = ['strategy', 'planDiscipline', 'session', 'emotion', 'mistakes', 'notes'];
    const currentIndex = steps.indexOf(detailStep);
    if (currentIndex > 0) {
      setDetailStep(steps[currentIndex - 1]);
    } else {
      setWizardStep('entry');
    }
  };

  // Get current step number for details
  const getDetailStepNumber = () => {
    const steps: DetailStep[] = ['strategy', 'planDiscipline', 'session', 'emotion', 'mistakes', 'notes'];
    return steps.indexOf(detailStep) + 1;
  };

  // Toggle emotion (max 3, auto-advance when 1+ selected)
  const toggleEmotion = (emotion: string) => {
    setDetailData(prev => {
      const newEmotions = prev.emotions.includes(emotion)
        ? prev.emotions.filter(e => e !== emotion)
        : prev.emotions.length < 3 ? [...prev.emotions, emotion] : prev.emotions;
      return { ...prev, emotions: newEmotions };
    });
  };

  // Toggle mistake (max 3)
  const toggleMistake = (mistake: string) => {
    setDetailData(prev => {
      const newMistakes = prev.mistakes.includes(mistake)
        ? prev.mistakes.filter(m => m !== mistake)
        : prev.mistakes.length < 3 ? [...prev.mistakes, mistake] : prev.mistakes;
      return { ...prev, mistakes: newMistakes };
    });
  };

  const visibleAccounts = accounts.filter(a => !a.isHidden);
  const selectedAccount = accounts.find(a => a.id === entryData.accountId);

  // Render entry form
  const renderEntryForm = () => (
    <div className="p-4 space-y-3">
      {/* Symbol */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Symbol *</label>
        <input
          type="text"
          value={entryData.symbol}
          onChange={e => {
            setEntryData({ ...entryData, symbol: e.target.value.toUpperCase() });
            setManualPnL(false);
          }}
          placeholder="e.g., GBPJPY"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-brand-500 outline-none"
          autoFocus
        />
        <div className="flex flex-wrap gap-1 mt-1.5">
          {COMMON_PAIRS.map(pair => (
            <button
              key={pair}
              onClick={() => {
                setEntryData({ ...entryData, symbol: pair });
                setManualPnL(false);
              }}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                entryData.symbol === pair 
                  ? 'bg-brand-500 text-slate-900 font-bold' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {pair}
            </button>
          ))}
        </div>
        {assetInfo && (
          <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
            <Calculator size={9} />
            {assetInfo.description}
          </p>
        )}
      </div>

      {/* Direction */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Direction *</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setEntryData({ ...entryData, direction: 'BUY' });
              setManualPnL(false);
            }}
            className={`py-2.5 rounded-lg font-bold text-sm transition-all ${
              entryData.direction === 'BUY'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => {
              setEntryData({ ...entryData, direction: 'SELL' });
              setManualPnL(false);
            }}
            className={`py-2.5 rounded-lg font-bold text-sm transition-all ${
              entryData.direction === 'SELL'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            SELL
          </button>
        </div>
      </div>

      {/* Entry & Exit Price */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Entry Price</label>
          <input
            type="text"
            inputMode="decimal"
            value={entryData.entryPrice}
            onChange={e => {
              setEntryData({ ...entryData, entryPrice: e.target.value });
              setManualPnL(false);
            }}
            placeholder="0.00000"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-brand-500 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Exit Price</label>
          <input
            type="text"
            inputMode="decimal"
            value={entryData.exitPrice}
            onChange={e => {
              setEntryData({ ...entryData, exitPrice: e.target.value });
              setManualPnL(false);
            }}
            placeholder="0.00000"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      {/* SL & TP (for R:R calculation) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Stop Loss</label>
          <input
            type="text"
            inputMode="decimal"
            value={entryData.stopLoss}
            onChange={e => setEntryData({ ...entryData, stopLoss: e.target.value })}
            placeholder="Optional"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-brand-500 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Take Profit</label>
          <input
            type="text"
            inputMode="decimal"
            value={entryData.takeProfit}
            onChange={e => setEntryData({ ...entryData, takeProfit: e.target.value })}
            placeholder="Optional"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      {/* R:R Display - Show when we have entry, SL, and TP */}
      {entryData.entryPrice && entryData.stopLoss && entryData.takeProfit && (
        <div className="flex items-center gap-2 py-1.5 px-2 bg-slate-800/50 rounded-lg border border-slate-700">
          <TrendingUp size={12} className="text-brand-400" />
          <span className="text-xs text-slate-400">R:R</span>
          <span className="text-xs font-bold text-white ml-auto">
            {calculatedRR !== null ? `1:${calculatedRR}` : 'Select direction'}
          </span>
        </div>
      )}

      {/* Lots & P&L */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Lot Size</label>
          <input
            type="text"
            inputMode="decimal"
            value={entryData.lots}
            onChange={e => {
              setEntryData({ ...entryData, lots: e.target.value });
              setManualPnL(false);
            }}
            placeholder="1.00"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-brand-500 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
            P&L ($) *
            {calculatedPnL !== null && !manualPnL && (
              <span className="text-[9px] text-brand-400 font-normal">AUTO</span>
            )}
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={entryData.pnl}
            onChange={e => {
              setEntryData({ ...entryData, pnl: e.target.value });
              setManualPnL(true);
            }}
            placeholder="-510.92"
            className={`w-full bg-slate-950 border rounded-lg px-3 py-2 font-mono text-sm focus:border-brand-500 outline-none ${
              entryData.pnl && !isNaN(parseFloat(entryData.pnl))
                ? parseFloat(entryData.pnl) >= 0 
                  ? 'border-emerald-500/50 text-emerald-400' 
                  : 'border-rose-500/50 text-rose-400'
                : 'border-slate-700 text-white'
            }`}
          />
        </div>
      </div>

      {/* P&L Calculation Info - Show when we have enough data OR show hint */}
      {entryData.entryPrice && entryData.exitPrice && entryData.lots ? (
        calculatedPnL !== null ? (
          <div className={`flex items-center gap-2 p-2 rounded-lg border ${
            calculatedPnL >= 0 
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : 'bg-rose-500/10 border-rose-500/20'
          }`}>
            {calculatedPnL >= 0 ? (
              <TrendingUp size={14} className="text-emerald-400" />
            ) : (
              <TrendingDown size={14} className="text-rose-400" />
            )}
            <span className={`text-xs ${calculatedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Calculated: <span className="font-bold">${calculatedPnL.toFixed(2)}</span>
            </span>
            {manualPnL && (
              <button
                onClick={() => {
                  setManualPnL(false);
                  setEntryData(prev => ({ ...prev, pnl: calculatedPnL.toString() }));
                }}
                className="text-[10px] text-brand-400 hover:text-white ml-auto"
              >
                Use this
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-700 bg-slate-800/30">
            <AlertCircle size={14} className="text-amber-400" />
            <span className="text-xs text-slate-400">Select BUY or SELL to auto-calculate P&L</span>
          </div>
        )
      ) : null}
    </div>
  );

  // Render detail step
  const renderDetailStep = () => {
    switch (detailStep) {
      case 'strategy':
        return (
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-2">What strategy did you use?</h3>
            <p className="text-slate-400 text-sm mb-4">Tap to select</p>
            <div className="space-y-2">
              {strategies.length > 0 ? (
                strategies.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setDetailData({ ...detailData, strategy: s.title });
                      advanceDetailStep();
                    }}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      detailData.strategy === s.title
                        ? 'bg-brand-500/20 border-2 border-brand-500 text-brand-400'
                        : 'bg-slate-800 border-2 border-transparent text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {s.title}
                  </button>
                ))
              ) : (
                <p className="text-slate-500 text-sm p-3 bg-slate-800/50 rounded-xl">
                  No strategies defined. Add them in Settings → Strategies.
                </p>
              )}
              <button
                onClick={() => {
                  setDetailData({ ...detailData, strategy: 'Other' });
                }}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  detailData.strategy === 'Other'
                    ? 'bg-brand-500/20 border-2 border-brand-500 text-brand-400'
                    : 'bg-slate-800 border-2 border-transparent text-slate-300 hover:border-slate-600'
                }`}
              >
                Other / No specific strategy
              </button>
              {detailData.strategy === 'Other' && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={detailData.customStrategy}
                    onChange={e => setDetailData({ ...detailData, customStrategy: e.target.value })}
                    placeholder="Describe your strategy..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={advanceDetailStep}
                    className="px-4 py-3 bg-brand-500 text-slate-900 rounded-xl font-bold"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'planDiscipline':
        return (
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-2">Did you follow your trading plan?</h3>
            <p className="text-slate-400 text-sm mb-4">Be honest with yourself</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setDetailData({ ...detailData, planDiscipline: true });
                  advanceDetailStep();
                }}
                className={`p-6 rounded-xl font-bold transition-all ${
                  detailData.planDiscipline === true
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                ✓ Yes
              </button>
              <button
                onClick={() => {
                  setDetailData({ ...detailData, planDiscipline: false });
                  advanceDetailStep();
                }}
                className={`p-6 rounded-xl font-bold transition-all ${
                  detailData.planDiscipline === false
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                ✗ No
              </button>
            </div>
          </div>
        );

      case 'session':
        return (
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-2">Which session?</h3>
            <p className="text-slate-400 text-sm mb-4">When did you take this trade?</p>
            <div className="grid grid-cols-2 gap-3">
              {(['London', 'New York', 'Asian', 'Overlap'] as TradingSession[]).map(session => (
                <button
                  key={session}
                  onClick={() => {
                    setDetailData({ ...detailData, session });
                    advanceDetailStep();
                  }}
                  className={`p-4 rounded-xl font-medium transition-all ${
                    detailData.session === session
                      ? 'bg-brand-500 text-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {session}
                </button>
              ))}
            </div>
          </div>
        );

      case 'emotion':
        return (
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-2">How were you feeling?</h3>
            <p className="text-slate-400 text-sm mb-4">Select up to 3 emotions, then tap Next</p>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion}
                  onClick={() => toggleEmotion(emotion)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    detailData.emotions.includes(emotion)
                      ? 'bg-brand-500 text-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {emotion}
                </button>
              ))}
            </div>
            {detailData.emotions.length > 0 && (
              <button
                onClick={advanceDetailStep}
                className="w-full mt-4 py-3 bg-brand-500 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={18} />
              </button>
            )}
          </div>
        );

      case 'mistakes':
        return (
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-2">Any mistakes?</h3>
            <p className="text-slate-400 text-sm mb-4">Select up to 3 or write your own</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {COMMON_MISTAKES.map(mistake => (
                <button
                  key={mistake}
                  onClick={() => toggleMistake(mistake)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    detailData.mistakes.includes(mistake)
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {mistake}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={detailData.customMistake}
              onChange={e => setDetailData({ ...detailData, customMistake: e.target.value })}
              placeholder="Or describe your own..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none"
            />
            <button
              onClick={advanceDetailStep}
              className="w-full mt-4 py-3 bg-brand-500 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={18} />
            </button>
          </div>
        );

      case 'notes':
        return (
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-2">Any notes?</h3>
            <p className="text-slate-400 text-sm mb-4">Add any additional thoughts about this trade</p>
            <textarea
              value={detailData.notes}
              onChange={e => setDetailData({ ...detailData, notes: e.target.value })}
              placeholder="What did you learn? What would you do differently?"
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none resize-none"
            />
            <button
              onClick={saveTrade}
              className="w-full mt-4 py-3 bg-brand-500 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              Save Trade
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">
              {wizardStep === 'entry' ? 'New Trade' : 'Trade Details'}
            </h2>
            {wizardStep === 'details' && (
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                {getDetailStepNumber()}/6
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Date Picker - Only on entry step */}
            {wizardStep === 'entry' && (
              <input
                type="date"
                value={entryData.date}
                onChange={e => setEntryData({ ...entryData, date: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:border-brand-500 outline-none w-[110px]"
              />
            )}
            
            {/* Account Selector */}
            {wizardStep === 'entry' && visibleAccounts.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  <Wallet size={12} />
                  <span className="max-w-[60px] truncate">{selectedAccount?.name || 'Account'}</span>
                  <ChevronDown size={12} />
                </button>
                {showAccountDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowAccountDropdown(false)} />
                    <div className="absolute top-full right-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                      {visibleAccounts.map(account => (
                        <button
                          key={account.id}
                          onClick={() => {
                            setEntryData({ ...entryData, accountId: account.id });
                            setShowAccountDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${
                            account.id === entryData.accountId ? 'text-brand-400' : 'text-slate-300'
                          }`}
                        >
                          {account.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {wizardStep === 'entry' ? renderEntryForm() : renderDetailStep()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          {wizardStep === 'entry' ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setWizardStep('details')}
                disabled={!canProceedToDetails()}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Skip & Save button */}
              <button
                onClick={saveTrade}
                className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <SkipForward size={14} />
                Skip remaining & Save Trade
              </button>
              
              <button
                onClick={handleDetailBack}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeWizard;
