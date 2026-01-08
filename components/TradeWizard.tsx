import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Wallet, ChevronDown, SkipForward, Calculator, TrendingUp, TrendingDown, AlertCircle, Calendar, Image, XCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Trade, TradeStatus, TradingSession } from '../types';

interface TradeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  editingTrade?: Trade | null;
  isMultipleMode?: boolean;
}

// Account Creation Component for Wizard
const AccountCreationInWizard: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const { addAccount } = useStore();
  const [formData, setFormData] = useState({ name: '', startingBalance: '' });

  const handleSubmit = () => {
    if (formData.name && formData.startingBalance) {
      addAccount({
        id: `acc_${Date.now()}`,
        name: formData.name,
        startingBalance: parseFloat(formData.startingBalance),
        createdAt: new Date().toISOString(),
        isMain: true,
        isHidden: false,
      });
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div
        className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6"
        style={{ borderColor: '#8b5cf6' + '30' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#8b5cf6' + '20' }}
          >
            <Wallet size={24} style={{ color: '#8b5cf6' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Add Account First</h3>
            <p className="text-sm text-slate-400">You need to add a trading account before logging trades</p>
          </div>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Account name"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
            autoFocus
          />
          <input
            type="number"
            value={formData.startingBalance}
            onChange={e => setFormData({ ...formData, startingBalance: e.target.value })}
            placeholder="Starting balance"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
          />
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.startingBalance}
              className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-xl font-bold transition-colors"
            >
              Create Account
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

const COMMON_PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY'];

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

const TradeWizard: React.FC<TradeWizardProps> = ({ isOpen, onClose, editingTrade, isMultipleMode = false }) => {
  const { addTrade, updateTrade, accounts, strategies } = useStore();
  const navigate = useNavigate();
  
  // Main wizard step
  const [wizardStep, setWizardStep] = useState<WizardStep>('entry');
  const [detailStep, setDetailStep] = useState<DetailStep>('strategy');
  
  // Account selection
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showAddAccountPrompt, setShowAddAccountPrompt] = useState(false);
  
  // Manual P&L override
  const [manualPnL, setManualPnL] = useState(false);
  
  // Calendar popup state
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Collapsible fields state
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  
  const visibleAccounts = useMemo(() => accounts.filter(a => !a.isHidden), [accounts]);
  
  const getDefaultAccountId = () => {
    if (visibleAccounts.length > 0) return visibleAccounts[0].id;
    return '';
  };
  
  // Check if user has accounts when modal opens
  useEffect(() => {
    if (isOpen && visibleAccounts.length === 0) {
      setShowAddAccountPrompt(true);
    }
  }, [isOpen, visibleAccounts.length]);

  // Helper function to get local date string (YYYY-MM-DD)
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    commission: '',
    date: getLocalDateString(),
    tradeTime: new Date().toTimeString().slice(0, 5), // HH:MM format
    accountId: getDefaultAccountId()
  });

  // Optional detail data
  const [detailData, setDetailData] = useState({
    strategy: '',
    customStrategy: '',
    planDiscipline: null as boolean | null,
    session: 'NY Session' as TradingSession,
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

  // Reset on open or load editing trade
  useEffect(() => {
    if (isOpen) {
      if (editingTrade) {
        // Load trade data for editing
        setWizardStep('entry');
        setDetailStep('strategy');
        setManualPnL(true);
        const entryPrice = editingTrade.entryPrice.toString();
        const exitPrice = editingTrade.exitPrice.toString();
        const stopLoss = editingTrade.riskAmount ? (editingTrade.side === 'LONG' 
          ? (editingTrade.entryPrice - editingTrade.riskAmount).toString()
          : (editingTrade.entryPrice + editingTrade.riskAmount).toString()
        ) : '';
        const takeProfit = editingTrade.tpAmount ? (editingTrade.side === 'LONG'
          ? (editingTrade.entryPrice + editingTrade.tpAmount).toString()
          : (editingTrade.entryPrice - editingTrade.tpAmount).toString()
        ) : '';
        
        // Extract time from tradeTime if exists, otherwise use time field, otherwise use current time
        let tradeTimeStr = new Date().toTimeString().slice(0, 5);
        if (editingTrade.tradeTime) {
          // If tradeTime is ISO string, extract time part
          const tradeTimeDate = new Date(editingTrade.tradeTime);
          if (!isNaN(tradeTimeDate.getTime())) {
            tradeTimeStr = tradeTimeDate.toTimeString().slice(0, 5);
          }
        } else if (editingTrade.time) {
          tradeTimeStr = editingTrade.time;
        }
        
        setEntryData({
          symbol: editingTrade.symbol,
          direction: editingTrade.side === 'LONG' ? 'BUY' : 'SELL',
          entryPrice,
          exitPrice,
          stopLoss,
          takeProfit,
          lots: editingTrade.lots.toString(),
          pnl: editingTrade.pnl.toString(),
          commission: editingTrade.commission ? Math.abs(editingTrade.commission).toString() : '',
          date: editingTrade.date,
          tradeTime: tradeTimeStr,
          accountId: editingTrade.accountId || getDefaultAccountId()
        });
        
        // Auto-expand advanced fields if any have values
        setShowAdvancedFields(!!(entryPrice || exitPrice || stopLoss || takeProfit));
        setDetailData({
          strategy: editingTrade.strategy || '',
          customStrategy: editingTrade.customStrategy || '',
          planDiscipline: editingTrade.planDiscipline ?? null,
          session: editingTrade.session,
          emotions: editingTrade.emotion ? editingTrade.emotion.split(', ').filter(Boolean) : [],
          mistakes: editingTrade.mistakes || [],
          customMistake: '',
          notes: editingTrade.notes || ''
        });
      } else {
        // Reset for new trade
        setWizardStep('entry');
        setDetailStep('strategy');
        setManualPnL(false);
        setEntryData({
          symbol: '',
          direction: '' as 'BUY' | 'SELL' | '',
          entryPrice: '',
          exitPrice: '',
          stopLoss: '',
          takeProfit: '',
          lots: '',
          pnl: '',
          commission: '',
          date: getLocalDateString(),
          tradeTime: new Date().toTimeString().slice(0, 5),
          accountId: getDefaultAccountId()
        });
        setDetailData({
          strategy: '',
          customStrategy: '',
          planDiscipline: null,
          session: 'NY Session',
          emotions: [],
          mistakes: [],
          customMistake: '',
          notes: ''
        });
        
        // Reset advanced fields visibility for new trade
        setShowAdvancedFields(false);
      }
    }
  }, [isOpen, accounts, editingTrade]);

  if (!isOpen) return null;
  
  // Show add account prompt if no accounts
  if (visibleAccounts.length === 0) {
    return (
      <AccountCreationInWizard 
        onClose={onClose} 
        onSuccess={() => {
          // After account is created, the component will re-render and visibleAccounts will have items
          // The wizard will then show normally
        }} 
      />
    );
  }

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
    // Validation
    if (!canProceedToDetails()) {
      return;
    }
    
    const pnl = parseFloat(entryData.pnl) || 0;
    const lots = parseFloat(entryData.lots) || 0;
    // Commission is always negative (deducted) even if user enters positive number
    const commission = entryData.commission 
      ? Math.abs(parseFloat(entryData.commission)) * -1 
      : undefined;
    
    const tradeData: Trade = {
      id: editingTrade?.id || Date.now().toString(),
      symbol: entryData.symbol.toUpperCase(),
      tradingViewSymbol: entryData.symbol.toUpperCase(),
      status: pnl >= 0 ? TradeStatus.WIN : TradeStatus.LOSS,
      pnl: pnl,
      date: entryData.date,
      time: entryData.tradeTime || editingTrade?.time || new Date().toTimeString().slice(0, 5),
      tradeTime: entryData.tradeTime && entryData.date 
        ? new Date(`${entryData.date}T${entryData.tradeTime}:00`).toISOString()
        : editingTrade?.tradeTime || (entryData.tradeTime && entryData.date 
          ? new Date(`${entryData.date}T${entryData.tradeTime}:00`).toISOString()
          : undefined),
      session: detailData.session,
      side: entryData.direction === 'BUY' ? 'LONG' : 'SHORT',
      entryPrice: parseFloat(entryData.entryPrice) || 0,
      exitPrice: parseFloat(entryData.exitPrice) || 0,
      lots: lots,
      pips: editingTrade?.pips || 0,
      rating: editingTrade?.rating || 3,
      tags: editingTrade?.tags || [],
      notes: detailData.notes,
      tradeType: entryData.direction === 'BUY' ? 'Buy' : 'Sell',
      strategy: detailData.strategy === 'Other' ? detailData.customStrategy : detailData.strategy,
      planDiscipline: detailData.planDiscipline,
      emotion: detailData.emotions.join(', '),
      mistakes: detailData.customMistake ? [detailData.customMistake] : detailData.mistakes,
      accountId: entryData.accountId,
      includeInAccount: editingTrade?.includeInAccount !== false,
      commission: commission,
      riskRewardRatio: calculatedRR || undefined,
      riskAmount: parseFloat(entryData.stopLoss) ? Math.abs(parseFloat(entryData.entryPrice) - parseFloat(entryData.stopLoss)) : undefined,
      tpAmount: parseFloat(entryData.takeProfit) ? Math.abs(parseFloat(entryData.takeProfit) - parseFloat(entryData.entryPrice)) : undefined,
    };
    
    if (editingTrade) {
      updateTrade(editingTrade.id, tradeData);
    } else {
      addTrade(tradeData);
    }
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

  const selectedAccount = accounts.find(a => a.id === entryData.accountId);

  // Render entry form
  const renderEntryForm = () => (
    <div className="p-5 space-y-4 pb-6">
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
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
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
          {/* Time Input */}
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
              } else if (!value) {
                setEntryData({ ...entryData, tradeTime: new Date().toTimeString().slice(0, 5) });
              }
            }}
            placeholder="HH:MM"
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-slate-300 font-mono focus:border-brand-500 outline-none w-16 text-center"
          />
          {/* Date Picker Button */}
          <button
            type="button"
            onClick={() => setShowCalendar(true)}
            className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-[10px] text-slate-300 hover:border-brand-500 transition-colors"
          >
            <Calendar size={10} />
            <span>{(() => {
              const formatDateForDisplay = (dateStr: string) => {
                const date = new Date(dateStr + 'T00:00:00');
                const day = date.getDate();
                const month = date.toLocaleString('en-US', { month: 'short' });
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
              };
              return formatDateForDisplay(entryData.date);
            })()}</span>
          </button>
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
        </>
      )}

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

      {/* Commission */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Commission (Optional)</label>
        <input
          type="text"
          inputMode="decimal"
          value={entryData.commission}
          onChange={e => setEntryData({ ...entryData, commission: e.target.value })}
          placeholder="e.g., 3.50"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-brand-500 outline-none"
        />
        <p className="text-[9px] text-slate-400 mt-1">Commission will be deducted (always negative)</p>
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

      {/* Action Buttons - At the end of the form */}
      <div className="flex gap-3 pt-4 pb-2">
        <button
          onClick={onClose}
          className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          onClick={() => setWizardStep('details')}
          disabled={!canProceedToDetails()}
          className="flex-1 py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>
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
                <div className="space-y-3">
                  <p className="text-slate-500 text-sm p-3 bg-slate-800/50 rounded-xl">
                    You haven't created any strategies yet.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/trade-setup');
                    }}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-slate-900 bg-brand-500 hover:bg-brand-600 transition-colors"
                  >
                    Create your first strategy
                  </button>
                  <button
                    onClick={() => {
                      // Skip strategy step for now
                      advanceDetailStep();
                    }}
                    className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Skip for now
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
            <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
              {(['Asian Open', 'Asian', 'Pre London', 'London Open', 'London', 'London NY Overlap', 'NY Open', 'NY Session', 'NY Close'] as TradingSession[]).map(session => (
                <button
                  key={session}
                  onClick={() => {
                    setDetailData({ ...detailData, session });
                    advanceDetailStep();
                  }}
                  className={`p-3 rounded-xl font-medium text-xs transition-all ${
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
          <h2 className="text-xl font-bold text-white">
            {editingTrade ? 'Edit Trade' : (wizardStep === 'entry' ? 'New Trade' : 'Trade Details')}
          </h2>
            {wizardStep === 'details' && (
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                {getDetailStepNumber()}/6
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Account Selector - Only on entry step */}
            {wizardStep === 'entry' && visibleAccounts.length > 0 && (
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
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {wizardStep === 'entry' ? renderEntryForm() : renderDetailStep()}
        </div>

        {/* Footer - Only for details step */}
        {wizardStep !== 'entry' && (
          <div className="flex-shrink-0 p-5 border-t border-slate-700/50 bg-slate-800/30">
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
          </div>
        )}
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            style={{ borderColor: '#8b5cf6' + '30' }}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Select Date</h3>
              <button
                onClick={() => setShowCalendar(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Calendar Component */}
            <CalendarPicker
              selectedDate={entryData.date}
              onDateSelect={(dateStr) => {
                setEntryData({ ...entryData, date: dateStr });
                setShowCalendar(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Calendar Picker Component
const CalendarPicker: React.FC<{
  selectedDate: string;
  onDateSelect: (dateStr: string) => void;
}> = ({ selectedDate, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  });

  // Update currentDate when selectedDate changes
  useEffect(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    setCurrentDate(new Date(year, month - 1, day));
  }, [selectedDate]);

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

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const today = new Date();
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isSelected = (date: Date) => getLocalDateString(date) === selectedDate;

  return (
    <div className="p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <span className="text-base font-bold text-white">{monthNames[month]} {year}</span>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, idx) => (
          <div key={idx} className="text-center py-2">
            <span className="text-xs font-semibold text-slate-500">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarData.map((dayData, idx) => {
          const dayStr = getLocalDateString(dayData.date);
          const selected = isSelected(dayData.date);
          const todayDate = isToday(dayData.date);

          return (
            <button
              key={idx}
              onClick={() => {
                if (dayData.isCurrentMonth) {
                  onDateSelect(dayStr);
                }
              }}
              className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                !dayData.isCurrentMonth
                  ? 'text-slate-700 cursor-not-allowed'
                  : selected
                  ? 'bg-purple-500 text-white'
                  : todayDate
                  ? 'bg-slate-800 text-purple-400 border-2 border-purple-500'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {dayData.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TradeWizard;
