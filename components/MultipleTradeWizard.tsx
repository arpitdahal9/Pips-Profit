import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Plus, Wallet, Calendar, Trash2, ChevronRight, ChevronLeft, CheckCircle2, ChevronDown, Image, XCircle, Calculator, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Trade, TradeStatus, TradingSession } from '../types';
import { readImageFileAsDataUrl } from '../utils/imageProcessing';

type WizardStep = 'entry' | 'details';
type DetailStep = 'strategy' | 'planDiscipline' | 'session' | 'emotion' | 'mistakes' | 'notes';

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

// Asset class detection and pip value calculation (copied from TradeWizard)
const getAssetInfo = (symbol: string): { type: string; pipValue: number; pipSize: number; description: string } => {
  const s = symbol.toUpperCase();
  
  if (s === 'XAUUSD' || s === 'GOLD') {
    return { type: 'gold', pipValue: 100, pipSize: 1, description: '$100 per $1 move per lot' };
  }
  
  if (s === 'XAGUSD' || s === 'SILVER') {
    return { type: 'silver', pipValue: 5000, pipSize: 0.01, description: '$50 per $0.01 move per lot' };
  }
  
  if (s.includes('JPY')) {
    return { type: 'jpy_pair', pipValue: 6.5, pipSize: 0.01, description: '~$6.50 per pip per lot' };
  }
  
  if (['EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD'].includes(s)) {
    return { type: 'usd_major', pipValue: 10, pipSize: 0.0001, description: '$10 per pip per lot' };
  }
  
  if (s.includes('USD')) {
    return { type: 'usd_pair', pipValue: 10, pipSize: 0.0001, description: '$10 per pip per lot' };
  }
  
  if (s === 'BTCUSD' || s === 'BTC') {
    return { type: 'crypto', pipValue: 1, pipSize: 1, description: '$1 per $1 move per lot' };
  }
  
  if (s === 'US30' || s === 'NAS100' || s === 'NAS199') {
    return { type: 'index', pipValue: 1, pipSize: 1, description: '$1 per point move per lot' };
  }
  
  return { type: 'unknown', pipValue: 10, pipSize: 0.0001, description: '$10 per pip per lot (estimate)' };
};

const calculatePnL = (symbol: string, direction: string, entryPrice: number, exitPrice: number, lots: number): number | null => {
  if (!symbol || !direction || !entryPrice || !exitPrice || !lots) return null;
  
  const assetInfo = getAssetInfo(symbol);
  const priceDiff = direction === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
  const pips = priceDiff / assetInfo.pipSize;
  const pnl = pips * assetInfo.pipValue * lots;
  
  return Math.round(pnl * 100) / 100;
};

const calculateRR = (direction: 'BUY' | 'SELL' | '', entryPrice: number, stopLoss: number, takeProfit: number): number | null => {
  if (!direction || !entryPrice || !stopLoss || !takeProfit) {
    return null;
  }
  
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  
  if (risk === 0) return null;
  
  return Math.round((reward / risk) * 100) / 100;
};

interface MultipleTradeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  theme: any;
}

const MultipleTradeWizard: React.FC<MultipleTradeWizardProps> = ({ isOpen, onClose, theme }) => {
  const { addTrade, accounts, strategies } = useStore();
  const imageUploadRef = useRef<HTMLInputElement>(null);
  
  const visibleAccounts = useMemo(() => accounts.filter(a => !a.isHidden), [accounts]);
  
  const getDefaultAccountId = () => {
    if (visibleAccounts.length > 0) return visibleAccounts[0].id;
    return '';
  };

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('entry');
  const [detailStep, setDetailStep] = useState<DetailStep>('strategy');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [manualPnL, setManualPnL] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Entry data (same structure as single trade)
  const [entryData, setEntryData] = useState({
    symbol: '',
    direction: '' as 'BUY' | 'SELL' | '',
    entryPrice: '',
    exitPrice: '',
    stopLoss: '',
    takeProfit: '',
    lots: '',
    pnl: '',
    date: getLocalDateString(),
    tradeTime: new Date().toTimeString().slice(0, 5),
    accountId: getDefaultAccountId()
  });

  // Additional entries for multiple trades (only Lot Size & P&L)
  const [additionalEntries, setAdditionalEntries] = useState<Array<{ id: string; lots: string; pnl: string }>>([]);

  // Detail data (details step)
  const [detailData, setDetailData] = useState({
    strategy: '',
    customStrategy: '',
    planDiscipline: null as boolean | null,
    session: 'NY Session' as TradingSession,
    emotions: [] as string[],
    mistakes: [] as string[],
    customMistake: '',
    notes: '',
    photo: null as string | null
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
      setShowAdvancedFields(false);
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
        date: getLocalDateString(),
        tradeTime: new Date().toTimeString().slice(0, 5),
        accountId: getDefaultAccountId()
      });
      setAdditionalEntries([]);
      setDetailData({
        strategy: '',
        customStrategy: '',
        planDiscipline: null,
        session: 'NY Session',
        emotions: [],
        mistakes: [],
        customMistake: '',
        notes: '',
        photo: null
      });
    }
  }, [isOpen, visibleAccounts]);

  const addEntry = () => {
    setAdditionalEntries([
      ...additionalEntries,
      { id: Date.now().toString(), lots: '', pnl: '' }
    ]);
  };

  const removeEntry = (id: string) => {
    setAdditionalEntries(additionalEntries.filter(e => e.id !== id));
  };

  const updateAdditionalEntry = (id: string, field: 'lots' | 'pnl', value: string) => {
    setAdditionalEntries(additionalEntries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const canProceedToDetails = () => {
    return entryData.symbol.trim() !== '' && entryData.direction !== '' && entryData.lots !== '' && entryData.pnl !== '';
  };

  const handleSave = () => {
    const entryPrice = parseFloat(entryData.entryPrice) || 0;
    const exitPrice = parseFloat(entryData.exitPrice) || 0;
    const stopLoss = entryData.stopLoss ? parseFloat(entryData.stopLoss) : undefined;
    const takeProfit = entryData.takeProfit ? parseFloat(entryData.takeProfit) : undefined;

    // Calculate TP/SL amounts for first trade
    let tpAmount: number | undefined;
    let riskAmount: number | undefined;
    if (entryData.direction === 'BUY') {
      if (takeProfit) tpAmount = takeProfit - entryPrice;
      if (stopLoss) riskAmount = entryPrice - stopLoss;
    } else {
      if (takeProfit) tpAmount = entryPrice - takeProfit;
      if (stopLoss) riskAmount = stopLoss - entryPrice;
    }

    // Calculate commission based on account's commissionPerLot
    const lots = parseFloat(entryData.lots) || 0;
    let commission: number | undefined;
    if (entryData.accountId) {
      const account = accounts.find(a => a.id === entryData.accountId);
      if (account?.commissionPerLot && lots > 0) {
        commission = -(account.commissionPerLot * lots); // Always negative
      }
    }
    
    const grossPnl = parseFloat(entryData.pnl) || 0;
    const finalPnl = commission ? grossPnl + commission : grossPnl;
    
    // Create first trade (with all fields)
    const firstTrade: Trade = {
      id: Date.now().toString(),
      symbol: entryData.symbol.toUpperCase(),
      tradingViewSymbol: entryData.symbol.toUpperCase(),
      status: finalPnl >= 0 ? TradeStatus.WIN : TradeStatus.LOSS,
      pnl: finalPnl,
      date: entryData.date,
      time: entryData.tradeTime,
      tradeTime: entryData.tradeTime && entryData.date
        ? new Date(`${entryData.date}T${entryData.tradeTime}:00`).toISOString()
        : undefined,
      session: detailData.session,
      side: entryData.direction === 'BUY' ? 'LONG' : 'SHORT',
      entryPrice,
      exitPrice: exitPrice || entryPrice,
      lots: lots,
      pips: 0,
      rating: 3,
      tags: [],
      notes: detailData.notes,
      emotion: detailData.emotions.join(', '),
      mistakes: detailData.customMistake ? [detailData.customMistake] : detailData.mistakes,
      planDiscipline: detailData.planDiscipline,
      strategy: detailData.strategy === 'Other' ? detailData.customStrategy : detailData.strategy,
      customStrategy: detailData.strategy === 'Other' ? detailData.customStrategy : '',
      accountId: entryData.accountId,
      commission: commission,
      tpAmount,
      riskAmount,
      photos: detailData.photos?.length > 0 ? detailData.photos : undefined
    };
    addTrade(firstTrade);

    // Create additional trades (only Lot Size & P&L, using same entry price and details)
    additionalEntries.forEach((entry) => {
      if (entry.lots && entry.pnl) {
        const trade: Trade = {
          id: Date.now().toString() + '_' + entry.id,
          symbol: entryData.symbol.toUpperCase(),
          tradingViewSymbol: entryData.symbol.toUpperCase(),
          status: parseFloat(entry.pnl) >= 0 ? TradeStatus.WIN : TradeStatus.LOSS,
          pnl: parseFloat(entry.pnl) || 0,
          date: entryData.date,
          time: entryData.tradeTime,
          tradeTime: entryData.tradeTime && entryData.date
            ? new Date(`${entryData.date}T${entryData.tradeTime}:00`).toISOString()
            : undefined,
          session: detailData.session,
          side: entryData.direction === 'BUY' ? 'LONG' : 'SHORT',
          entryPrice,
          exitPrice: entryPrice,
          lots: parseFloat(entry.lots) || 0,
          pips: 0,
          rating: 3,
          tags: [],
          notes: detailData.notes,
          emotion: detailData.emotions.join(', '),
          mistakes: detailData.customMistake ? [detailData.customMistake] : detailData.mistakes,
          planDiscipline: detailData.planDiscipline,
          strategy: detailData.strategy === 'Other' ? detailData.customStrategy : detailData.strategy,
          customStrategy: detailData.strategy === 'Other' ? detailData.customStrategy : '',
          accountId: entryData.accountId,
          photos: detailData.photos?.length > 0 ? detailData.photos : undefined
        };
        addTrade(trade);
      }
    });

    onClose();
  };

  const toggleEmotion = (emotion: string) => {
    setDetailData(prev => {
      const newEmotions = prev.emotions.includes(emotion)
        ? prev.emotions.filter(e => e !== emotion)
        : prev.emotions.length < 3 ? [...prev.emotions, emotion] : prev.emotions;
      return { ...prev, emotions: newEmotions };
    });
  };

  const toggleMistake = (mistake: string) => {
    setDetailData(prev => {
      const newMistakes = prev.mistakes.includes(mistake)
        ? prev.mistakes.filter(m => m !== mistake)
        : prev.mistakes.length < 3 ? [...prev.mistakes, mistake] : prev.mistakes;
      return { ...prev, mistakes: newMistakes };
    });
  };

  const advanceDetailStep = () => {
    const steps: DetailStep[] = ['strategy', 'planDiscipline', 'session', 'emotion', 'mistakes', 'notes'];
    const currentIndex = steps.indexOf(detailStep);
    if (currentIndex < steps.length - 1) {
      setTimeout(() => setDetailStep(steps[currentIndex + 1]), 300);
    }
  };

  const handleDetailBack = () => {
    const steps: DetailStep[] = ['strategy', 'planDiscipline', 'session', 'emotion', 'mistakes', 'notes'];
    const currentIndex = steps.indexOf(detailStep);
    if (currentIndex > 0) {
      setDetailStep(steps[currentIndex - 1]);
    } else {
      setWizardStep('entry');
    }
  };

  const getDetailStepNumber = () => {
    const steps: DetailStep[] = ['strategy', 'planDiscipline', 'session', 'emotion', 'mistakes', 'notes'];
    return steps.indexOf(detailStep) + 1;
  };

  if (!isOpen) return null;

  // Render Entry Step (same as single trade)
  const renderEntryStep = () => (
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

      {/* Advanced Fields Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvancedFields(!showAdvancedFields)}
        className="w-full flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <span className="text-xs font-medium text-slate-400">Advanced Fields</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${showAdvancedFields ? 'rotate-180' : ''}`} />
      </button>

      {/* Entry & Exit Price - Collapsible */}
      {showAdvancedFields && (
        <>
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

          {/* Screenshot Upload */}
          <div className="mt-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Attach Screenshot (Optional)</label>
            
            {detailData.photo ? (
              <div className="relative">
                <img
                  src={detailData.photo}
                  alt="Trade screenshot"
                  className="w-full h-40 object-cover rounded-xl border border-slate-700"
                />
                <button
                  onClick={() => setDetailData({ ...detailData, photo: null })}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-800 rounded-lg text-white transition-colors"
                >
                  <XCircle size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => imageUploadRef.current?.click()}
                disabled={isProcessingPhoto}
                className={`w-full py-3 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
                  isProcessingPhoto ? 'border-slate-600 cursor-not-allowed opacity-70' : 'border-slate-700 hover:border-brand-500'
                }`}
              >
                <Image size={24} className="text-slate-400" />
                <span className="text-sm text-slate-400">
                  {isProcessingPhoto ? 'Processing image...' : 'Tap to add screenshot'}
                </span>
              </button>
            )}
            
            <input
              ref={imageUploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (!file.type.startsWith('image/')) {
                    alert('Please select an image file');
                    if (imageUploadRef.current) imageUploadRef.current.value = '';
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    alert('Image size must be less than 5MB');
                    if (imageUploadRef.current) imageUploadRef.current.value = '';
                    return;
                  }
                  try {
                    setIsProcessingPhoto(true);
                    const result = await readImageFileAsDataUrl(file);
                    if (result) {
                      setDetailData(prev => ({ ...prev, photo: result }));
                    }
                  } catch (error) {
                    alert('Failed to process image');
                  } finally {
                    setIsProcessingPhoto(false);
                    if (imageUploadRef.current) imageUploadRef.current.value = '';
                  }
                }
              }}
            />
          </div>
        </>
      )}

      {/* R:R Display */}
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

      {/* P&L Calculation Info */}
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

      {/* Additional Entries Section */}
      {additionalEntries.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-semibold text-slate-400 uppercase">Additional Positions</h4>
          {additionalEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="p-3 rounded-xl border border-slate-800 bg-slate-950"
              style={{ borderColor: theme.primary + '20' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">Position #{index + 2}</span>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="p-1 hover:bg-slate-800 rounded text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Lot Size</label>
                  <input
                    type="number"
                    step="0.01"
                    value={entry.lots}
                    onChange={(e) => updateAdditionalEntry(entry.id, 'lots', e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">P&L</label>
                  <input
                    type="number"
                    step="0.01"
                    value={entry.pnl}
                    onChange={(e) => updateAdditionalEntry(entry.id, 'pnl', e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add More Positions Button */}
      <button
        type="button"
        onClick={addEntry}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-xl transition-colors text-slate-400 hover:text-white"
      >
        <Plus size={20} />
        <span className="text-sm font-medium">Add More Positions</span>
      </button>
    </div>
  );

  // Render Details Step (same as single trade wizard)
  const renderDetailsStep = () => {
    if (detailStep === 'strategy') {
      return (
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-white mb-4">What strategy did you use?</h3>
          <div className="space-y-2">
            {strategies.map(strategy => (
              <button
                key={strategy.id}
                onClick={() => {
                  setDetailData({ ...detailData, strategy: strategy.title });
                  advanceDetailStep();
                }}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  detailData.strategy === strategy.title
                    ? 'bg-brand-500 text-slate-900'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{strategy.title}</span>
                  {detailData.strategy === strategy.title && <CheckCircle2 size={20} />}
                </div>
              </button>
            ))}
            <button
              onClick={() => {
                setDetailData({ ...detailData, strategy: 'Other' });
              }}
              className={`w-full p-3 rounded-lg text-left transition-all ${
                detailData.strategy === 'Other'
                  ? 'bg-brand-500 text-slate-900'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Other</span>
                {detailData.strategy === 'Other' && <CheckCircle2 size={20} />}
              </div>
            </button>
          </div>
          {detailData.strategy === 'Other' && (
            <input
              type="text"
              value={detailData.customStrategy}
              onChange={e => setDetailData({ ...detailData, customStrategy: e.target.value })}
              placeholder="Enter strategy name"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none mt-2"
              autoFocus
            />
          )}
          {detailData.strategy && detailData.strategy !== 'Other' && (
            <button
              onClick={advanceDetailStep}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-900 rounded-xl font-bold transition-colors mt-4"
            >
              Next
            </button>
          )}
          {detailData.strategy === 'Other' && detailData.customStrategy && (
            <button
              onClick={advanceDetailStep}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-900 rounded-xl font-bold transition-colors mt-4"
            >
              Next
            </button>
          )}
        </div>
      );
    }

    if (detailStep === 'planDiscipline') {
      return (
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-white mb-4">Did you follow your plan?</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setDetailData({ ...detailData, planDiscipline: true });
                advanceDetailStep();
              }}
              className={`p-4 rounded-xl font-bold transition-all ${
                detailData.planDiscipline === true
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => {
                setDetailData({ ...detailData, planDiscipline: false });
                advanceDetailStep();
              }}
              className={`p-4 rounded-xl font-bold transition-all ${
                detailData.planDiscipline === false
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              No
            </button>
          </div>
        </div>
      );
    }

    if (detailStep === 'session') {
      const sessions: TradingSession[] = ['Asian Open', 'Asian', 'Pre London', 'London Open', 'London', 'London NY Overlap', 'NY Open', 'NY Session', 'NY Close'];
      return (
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-white mb-4">Which trading session?</h3>
          <div className="space-y-2">
            {sessions.map(session => (
              <button
                key={session}
                onClick={() => {
                  setDetailData({ ...detailData, session });
                  advanceDetailStep();
                }}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  detailData.session === session
                    ? 'bg-brand-500 text-slate-900'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{session}</span>
                  {detailData.session === session && <CheckCircle2 size={20} />}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (detailStep === 'emotion') {
      return (
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-white mb-4">How did you feel? (Select up to 3)</h3>
          <div className="grid grid-cols-2 gap-2">
            {EMOTIONS.map(emotion => (
              <button
                key={emotion}
                onClick={() => toggleEmotion(emotion)}
                className={`p-3 rounded-lg font-medium transition-all ${
                  detailData.emotions.includes(emotion)
                    ? 'bg-brand-500 text-slate-900'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {emotion}
              </button>
            ))}
          </div>
          {detailData.emotions.length > 0 && (
            <button
              onClick={advanceDetailStep}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-900 rounded-xl font-bold transition-colors mt-4"
            >
              Next
            </button>
          )}
        </div>
      );
    }

    if (detailStep === 'mistakes') {
      return (
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-white mb-4">Any mistakes? (Select up to 3)</h3>
          <div className="space-y-2">
            {COMMON_MISTAKES.map(mistake => (
              <button
                key={mistake}
                onClick={() => toggleMistake(mistake)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  detailData.mistakes.includes(mistake)
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{mistake}</span>
                  {detailData.mistakes.includes(mistake) && <CheckCircle2 size={20} />}
                </div>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={detailData.customMistake}
            onChange={e => setDetailData({ ...detailData, customMistake: e.target.value })}
            placeholder="Or enter custom mistake"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none mt-4"
          />
          <button
            onClick={advanceDetailStep}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-900 rounded-xl font-bold transition-colors mt-4"
          >
            Next
          </button>
        </div>
      );
    }

    if (detailStep === 'notes') {
      return (
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-white mb-4">Add notes (Optional)</h3>
          <textarea
            value={detailData.notes}
            onChange={e => setDetailData({ ...detailData, notes: e.target.value })}
            placeholder="Add any additional notes about this trade..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-3 text-white focus:border-brand-500 outline-none min-h-[120px] resize-none"
            autoFocus
          />

          {/* Screenshot Upload */}
          <div className="mt-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Attach Screenshot (Optional)</label>
            
            {detailData.photo ? (
              <div className="relative">
                <img
                  src={detailData.photo}
                  alt="Trade screenshot"
                  className="w-full h-40 object-cover rounded-xl border border-slate-700"
                />
                <button
                  onClick={() => setDetailData({ ...detailData, photo: null })}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-800 rounded-lg text-white transition-colors"
                >
                  <XCircle size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => imageUploadRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Image size={24} className="text-slate-400" />
                <span className="text-sm text-slate-400">Tap to add screenshot</span>
              </button>
            )}
            
            <input
              ref={imageUploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (!file.type.startsWith('image/')) {
                    alert('Please select an image file');
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    alert('Image size must be less than 5MB');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const result = event.target?.result as string;
                    if (result) {
                      setDetailData({ ...detailData, photo: result });
                    }
                  };
                  reader.onerror = () => {
                    alert('Failed to read image file');
                  };
                  reader.readAsDataURL(file);
                  if (imageUploadRef.current) imageUploadRef.current.value = '';
                }
              }}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        style={{ borderColor: theme.primary + '30' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {wizardStep === 'details' && (
              <button
                onClick={handleDetailBack}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold text-white">
              {wizardStep === 'entry' ? 'New Trade' : `Details (${getDetailStepNumber()}/6)`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {wizardStep === 'entry' && (
              <>
                <input
                  type="text"
                  value={entryData.tradeTime}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9:]/g, '');
                    let formatted = value;
                    if (value.length > 2 && !value.includes(':')) {
                      formatted = value.slice(0, 2) + ':' + value.slice(2, 5);
                    }
                    if (formatted.length <= 5) {
                      setEntryData({ ...entryData, tradeTime: formatted });
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    const timeRegex = /^(\d{1,2}):?(\d{0,2})$/;
                    const match = value.match(timeRegex);
                    if (match) {
                      let hours = parseInt(match[1] || '0');
                      let minutes = parseInt(match[2] || '0');
                      if (hours > 23) hours = 23;
                      if (minutes > 59) minutes = 59;
                      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                      setEntryData({ ...entryData, tradeTime: formatted });
                    }
                  }}
                  placeholder="HH:MM"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono focus:border-brand-500 outline-none w-16 text-center"
                />
                <button
                  type="button"
                  onClick={() => setShowCalendar(true)}
                  className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 hover:border-brand-500 transition-colors"
                >
                  <Calendar size={12} />
                  <span>{formatDateForDisplay(entryData.date)}</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {wizardStep === 'entry' && renderEntryStep()}
          {wizardStep === 'details' && renderDetailsStep()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex gap-3">
          {wizardStep === 'entry' && (
            <button
              onClick={() => canProceedToDetails() && setWizardStep('details')}
              disabled={!canProceedToDetails()}
              className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              Next
              <ChevronRight size={18} />
            </button>
          )}
          {wizardStep === 'details' && detailStep !== 'notes' && (
            <>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
              >
                Skip remaining & Save Trade
              </button>
              <button
                onClick={advanceDetailStep}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-slate-900 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </>
          )}
          {wizardStep === 'details' && detailStep === 'notes' && (
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-slate-900 rounded-xl font-bold transition-colors"
            >
              Save All Trades
            </button>
          )}
        </div>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-4"
            style={{ borderColor: theme.primary + '30' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Select Date</h3>
              <button
                onClick={() => setShowCalendar(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <input
              type="date"
              value={entryData.date}
              onChange={(e) => {
                setEntryData({ ...entryData, date: e.target.value });
                setShowCalendar(false);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleTradeWizard;
