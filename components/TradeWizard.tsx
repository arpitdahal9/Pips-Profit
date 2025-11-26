import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Upload, Image as ImageIcon, CheckCircle2, Calendar, Wallet, ChevronDown, ListChecks, MessageSquare } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Trade, TradeStatus, TradingSession } from '../types';

type FormMode = 'interactive' | 'form';

interface TradeWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 
  | 'start'
  | 'confirm'
  | 'pair'
  | 'tradeType'
  | 'timeframe'
  | 'strategy'
  | 'tradeCount'
  | 'journalSeparately'
  | 'planDiscipline'
  | 'news'
  | 'risk'
  | 'tp'
  | 'winLose'
  | 'session'
  | 'overTrade'
  | 'emotion'
  | 'mistakes'
  | 'photo';

const COMMON_PAIRS = [
  'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 
  'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'XAGUSD'
];

const EMOTIONS = [
  'Confident',
  'Anxious',
  'Greedy',
  'Fearful',
  'Frustrated',
  'Calm',
  'Excited',
  'Indifferent',
  'Regretful',
  'Hopeful'
];

const MISTAKES = [
  "I shouldn't have moved SL",
  "I shouldn't have revenge traded",
  "I shouldn't have over traded",
  "I should've closed the position when I knew price action is showing opposite bias",
  "I should've waited for better entry",
  "I should've taken profit earlier",
  "I shouldn't have ignored my strategy",
  "I should've checked the news calendar",
  "I shouldn't have traded with emotions",
  "I should've respected my risk management"
];

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'Daily'];

const STRATEGIES = [
  'Breakout',
  'Pullback',
  'Trend continuation',
  'Range',
  'S&D Zone',
  'Other'
];

interface TradeData {
  date: string;
  symbol: string;
  tradeType: 'Buy' | 'Sell' | '';
  timeframe: string;
  strategy: string;
  customStrategy: string;
  tradeCount: number;
  journalSeparately: boolean;
  planDiscipline: boolean | null;
  tradedDuringNews: boolean;
  riskAmount: number;
  tpAmount: number;
  winLose: 'WIN' | 'LOSS';
  session: TradingSession;
  time: string;
  timeEnabled: boolean;
  overTraded: boolean;
  emotions: string[];
  mistakes: string[];
  customMistake: string;
  photo: string | null;
  accountId: string;
}

const TradeWizard: React.FC<TradeWizardProps> = ({ isOpen, onClose }) => {
  const { addTrade, accounts, getMainAccount } = useStore();
  const [formMode, setFormMode] = useState<FormMode>('interactive');
  const [currentStep, setCurrentStep] = useState<WizardStep>('pair');
  const [currentTradeIndex, setCurrentTradeIndex] = useState(0);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [tradesArray, setTradesArray] = useState<TradeData[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const getDefaultAccountId = () => {
    const mainAccount = getMainAccount();
    const visibleAccounts = accounts.filter(a => !a.isHidden);
    if (mainAccount && !mainAccount.isHidden) return mainAccount.id;
    if (visibleAccounts.length > 0) return visibleAccounts[0].id;
    return '';
  };
  
  const [tradeData, setTradeData] = useState<TradeData>({
    date: new Date().toISOString().split('T')[0],
    symbol: '',
    tradeType: '',
    timeframe: '',
    strategy: '',
    customStrategy: '',
    tradeCount: 1,
    journalSeparately: false,
    planDiscipline: null,
    tradedDuringNews: false,
    riskAmount: 0,
    tpAmount: 0,
    winLose: 'WIN',
    session: 'New York',
    time: new Date().toTimeString().slice(0, 5),
    timeEnabled: false,
    overTraded: false,
    emotions: [],
    mistakes: [],
    customMistake: '',
    photo: null,
    accountId: getDefaultAccountId()
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('pair');
      setCurrentTradeIndex(0);
      setTradesArray([]);
      setShowAccountDropdown(false);
      setTradeData({
        date: new Date().toISOString().split('T')[0],
        symbol: '',
        tradeType: '',
        timeframe: '',
        strategy: '',
        customStrategy: '',
        tradeCount: 1,
        journalSeparately: false,
        planDiscipline: null,
        tradedDuringNews: false,
        riskAmount: 0,
        tpAmount: 0,
        winLose: 'WIN',
        session: 'New York',
        time: new Date().toTimeString().slice(0, 5),
        timeEnabled: false,
        overTraded: false,
        emotions: [],
        mistakes: [],
        customMistake: '',
        photo: null,
        accountId: getDefaultAccountId()
      });
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const getNextStep = (current: WizardStep): WizardStep | null => {
    const steps: WizardStep[] = [
      'pair', 'tradeType', 'timeframe', 'strategy', 'tradeCount', 'journalSeparately',
      'planDiscipline', 'news', 'risk', 'tp', 'winLose', 'session', 'overTrade',
      'emotion', 'mistakes', 'photo'
    ];
    
    const currentIndex = steps.indexOf(current);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      // Skip journalSeparately if tradeCount is 1
      if (nextStep === 'journalSeparately' && tradeData.tradeCount === 1) {
        return getNextStep('journalSeparately');
      }
      return nextStep;
    }
    return null;
  };

  const getPreviousStep = (current: WizardStep): WizardStep | null => {
    const steps: WizardStep[] = [
      'pair', 'tradeType', 'timeframe', 'strategy', 'tradeCount', 'journalSeparately',
      'planDiscipline', 'news', 'risk', 'tp', 'winLose', 'session', 'overTrade',
      'emotion', 'mistakes', 'photo'
    ];
    
    const currentIndex = steps.indexOf(current);
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      // Skip journalSeparately if tradeCount is 1
      if (prevStep === 'journalSeparately' && tradeData.tradeCount === 1) {
        return getPreviousStep('journalSeparately');
      }
      return prevStep;
    }
    return null;
  };

  const handleNext = () => {
    const next = getNextStep(currentStep);
    if (next) {
      setCurrentStep(next);
    }
  };

  const handleBack = () => {
    const prev = getPreviousStep(currentStep);
    if (prev) {
      setCurrentStep(prev);
    } else {
      onClose();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'pair':
        return tradeData.symbol !== '';
      case 'tradeType':
        return tradeData.tradeType !== '';
      case 'timeframe':
        return tradeData.timeframe !== '';
      case 'strategy':
        return tradeData.strategy !== '' || tradeData.customStrategy.trim() !== '';
      case 'tradeCount':
        return tradeData.tradeCount > 0;
      case 'journalSeparately':
        return true;
      case 'planDiscipline':
        return tradeData.planDiscipline !== null;
      case 'news':
        return true;
      case 'risk':
        return tradeData.riskAmount > 0;
      case 'tp':
        return tradeData.tpAmount > 0;
      case 'winLose':
        return true;
      case 'session':
        return true;
      case 'overTrade':
        return true;
      case 'emotion':
        return tradeData.emotions.length > 0 && tradeData.emotions.length <= 3;
      case 'mistakes':
        return (tradeData.mistakes.length > 0 && tradeData.mistakes.length <= 3) || tradeData.customMistake.trim() !== '';
      case 'photo':
        return true;
      default:
        return false;
    }
  };

  const createTradeFromData = (data: TradeData, index: number = 0): Trade => {
    // Calculate R:R for all trades that have both risk and TP values
    const isWin = data.winLose === 'WIN';
    const riskRewardRatio = data.riskAmount > 0 && data.tpAmount > 0 
      ? data.tpAmount / data.riskAmount 
      : undefined;

    return {
      id: `${Date.now()}-${index}`,
      symbol: data.symbol.toUpperCase(),
      tradingViewSymbol: data.symbol.toUpperCase() === 'XAUUSD' 
        ? 'OANDA:XAUUSD' 
        : `FX:${data.symbol.toUpperCase()}`,
      date: data.date,
      time: data.timeEnabled ? data.time : '',
      session: data.session,
      side: data.tradeType === 'Buy' ? 'LONG' : 'SHORT',
      status: isWin ? TradeStatus.WIN : TradeStatus.LOSS,
      pnl: isWin ? data.tpAmount : -data.riskAmount,
      entryPrice: 0, // Could be asked in future
      exitPrice: 0, // Could be asked in future
      lots: 1, // Default
      pips: 0, // Could be calculated
      rating: 3, // Default
      strategyId: '',
      tags: [],
        notes: [
          `Trade Type: ${data.tradeType}`,
          `Timeframe: ${data.timeframe}`,
          `Strategy: ${data.strategy === 'Other' ? data.customStrategy : data.strategy}`,
          `Followed Plan: ${data.planDiscipline ? 'Yes' : 'No'}`,
          `Traded during news: ${data.tradedDuringNews ? 'Yes' : 'No'}`,
          `Risk: $${data.riskAmount}`,
          `TP: $${data.tpAmount}`,
          `Over traded: ${data.overTraded ? 'Yes' : 'No'}`,
          data.emotions.length > 0 ? `Emotions: ${data.emotions.join(', ')}` : '',
          data.mistakes.length > 0 ? `Mistakes: ${data.mistakes.join('; ')}` : '',
          data.customMistake ? `Custom Mistake: ${data.customMistake}` : ''
        ].filter(Boolean).join('\n'),
      tradedDuringNews: data.tradedDuringNews,
      riskAmount: data.riskAmount,
      tpAmount: data.tpAmount,
      tradeType: data.tradeType as 'Buy' | 'Sell',
      timeframe: data.timeframe,
      strategy: data.strategy === 'Other' ? data.customStrategy : data.strategy,
      customStrategy: data.strategy === 'Other' ? data.customStrategy : undefined,
      planDiscipline: data.planDiscipline,
      overTraded: data.overTraded,
      emotion: data.emotions.join(', '),
      mistakes: data.customMistake ? [data.customMistake] : data.mistakes,
      photo: data.photo || undefined,
      accountId: data.accountId,
      includeInAccount: true,
      riskRewardRatio
    };
  };

  const handleFinish = () => {
    if (tradeData.journalSeparately && tradeData.tradeCount > 1) {
      // Save current trade to array
      const updatedTrades = [...tradesArray, { ...tradeData }];
      
      if (currentTradeIndex < tradeData.tradeCount - 1) {
        // Move to next trade
        setTradesArray(updatedTrades);
        setCurrentTradeIndex(currentTradeIndex + 1);
        // Reset trade data and go back to planDiscipline step (keep date, symbol, tradeType, timeframe, strategy)
        setTradeData({
          ...tradeData,
          planDiscipline: null,
          tradedDuringNews: false,
          riskAmount: 0,
          tpAmount: 0,
          winLose: 'WIN',
          overTraded: false,
          emotions: [],
          mistakes: [],
          customMistake: '',
          photo: null
        });
        setCurrentStep('planDiscipline');
      } else {
        // All trades collected, save them all
        updatedTrades.forEach((data, index) => {
          addTrade(createTradeFromData(data, index));
        });
        onClose();
      }
    } else {
      // Single trade or not journaling separately
      addTrade(createTradeFromData(tradeData));
      onClose();
    }
  };

  const handleJournalSeparately = (value: boolean) => {
    setTradeData({ ...tradeData, journalSeparately: value });
    if (value && tradeData.tradeCount > 1) {
      // If journaling separately and multiple trades, we'll repeat questions for each trade
      // Start with first trade
      setCurrentTradeIndex(0);
      setTradesArray([]);
    }
    handleNext();
  };

  const toggleMistake = (mistake: string) => {
    if (tradeData.customMistake) {
      // If custom mistake is filled, clear it when selecting predefined
      setTradeData({
        ...tradeData,
        customMistake: '',
        mistakes: tradeData.mistakes.includes(mistake)
          ? tradeData.mistakes.filter(m => m !== mistake)
          : tradeData.mistakes.length < 3
          ? [...tradeData.mistakes, mistake]
          : tradeData.mistakes
      });
    } else {
      setTradeData({
        ...tradeData,
        mistakes: tradeData.mistakes.includes(mistake)
          ? tradeData.mistakes.filter(m => m !== mistake)
          : tradeData.mistakes.length < 3
          ? [...tradeData.mistakes, mistake]
          : tradeData.mistakes
      });
    }
  };

  const toggleEmotion = (emotion: string) => {
    setTradeData({
      ...tradeData,
      emotions: tradeData.emotions.includes(emotion)
        ? tradeData.emotions.filter(e => e !== emotion)
        : tradeData.emotions.length < 3
        ? [...tradeData.emotions, emotion]
        : tradeData.emotions
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTradeData({ ...tradeData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'pair':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">Which pair?</h3>
            <p className="text-slate-400 text-sm mb-6">Select the trading pair</p>
            <div className="grid grid-cols-3 gap-3">
              {COMMON_PAIRS.map(pair => (
                <button
                  key={pair}
                  onClick={() => {
                    setTradeData({ ...tradeData, symbol: pair });
                    setTimeout(handleNext, 300);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all font-mono text-sm font-bold ${
                    tradeData.symbol === pair
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {pair}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Or type custom pair (e.g., BTCUSD)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-brand-500 outline-none uppercase"
                value={tradeData.symbol}
                onChange={e => setTradeData({ ...tradeData, symbol: e.target.value.toUpperCase() })}
                onKeyDown={e => {
                  if (e.key === 'Enter' && tradeData.symbol) {
                    handleNext();
                  }
                }}
              />
            </div>
          </div>
        );

      case 'tradeType':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">Trade Type</h3>
            <p className="text-slate-400 text-sm mb-6">Was this a buy or sell?</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setTradeData({ ...tradeData, tradeType: 'Buy' });
                  setTimeout(handleNext, 300);
                }}
                className={`flex-1 px-6 py-6 rounded-lg border-2 transition-all font-bold text-lg ${
                  tradeData.tradeType === 'Buy'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => {
                  setTradeData({ ...tradeData, tradeType: 'Sell' });
                  setTimeout(handleNext, 300);
                }}
                className={`flex-1 px-6 py-6 rounded-lg border-2 transition-all font-bold text-lg ${
                  tradeData.tradeType === 'Sell'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                Sell
              </button>
            </div>
          </div>
        );

      case 'timeframe':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">Timeframe</h3>
            <p className="text-slate-400 text-sm mb-6">Which timeframe did you trade?</p>
            <div className="grid grid-cols-3 gap-3">
              {TIMEFRAMES.map(timeframe => (
                <button
                  key={timeframe}
                  onClick={() => {
                    setTradeData({ ...tradeData, timeframe });
                    setTimeout(handleNext, 300);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all font-bold text-sm ${
                    tradeData.timeframe === timeframe
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>
        );

      case 'strategy':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">Strategy / Setup</h3>
            <p className="text-slate-400 text-sm mb-6">What setup did you use?</p>
            <div className="space-y-2 mb-4">
              {STRATEGIES.map(strategy => (
                <button
                  key={strategy}
                  onClick={() => {
                    if (strategy === 'Other') {
                      setTradeData({ ...tradeData, strategy: 'Other', customStrategy: '' });
                    } else {
                      setTradeData({ ...tradeData, strategy, customStrategy: '' });
                      setTimeout(handleNext, 300);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    tradeData.strategy === strategy
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {strategy}
                </button>
              ))}
            </div>
            {tradeData.strategy === 'Other' && (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Enter your custom strategy..."
                  value={tradeData.customStrategy}
                  onChange={e => setTradeData({ ...tradeData, customStrategy: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-brand-500 outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && tradeData.customStrategy.trim()) {
                      handleNext();
                    }
                  }}
                  autoFocus
                />
              </div>
            )}
          </div>
        );

      case 'tradeCount':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">Number of Trades</h3>
            <p className="text-slate-400 text-sm mb-6">How many trades did you take?</p>
            <div className="flex gap-4 items-center justify-center">
              <button
                onClick={() => setTradeData({ ...tradeData, tradeCount: Math.max(1, tradeData.tradeCount - 1) })}
                className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold hover:bg-slate-700 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={tradeData.tradeCount}
                onChange={e => setTradeData({ ...tradeData, tradeCount: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-24 text-center text-3xl font-bold text-white bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:border-brand-500 outline-none"
              />
              <button
                onClick={() => setTradeData({ ...tradeData, tradeCount: tradeData.tradeCount + 1 })}
                className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold hover:bg-slate-700 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        );

      case 'journalSeparately':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">Do you want to journal all your trades separately?</h3>
            <p className="text-slate-400 text-sm mb-6">Each trade will have its own entry</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleJournalSeparately(true)}
                className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all font-bold ${
                  tradeData.journalSeparately
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => handleJournalSeparately(false)}
                className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all font-bold ${
                  !tradeData.journalSeparately
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                No
              </button>
            </div>
          </div>
        );

      case 'planDiscipline':
        return (
          <div className="py-6">
            {tradeData.journalSeparately && tradeData.tradeCount > 1 && (
              <div className="mb-4 p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg">
                <p className="text-sm text-brand-400 font-medium">
                  Trade {currentTradeIndex + 1} of {tradeData.tradeCount}
                </p>
              </div>
            )}
            <h3 className="text-xl font-bold text-white mb-2">Plan Discipline</h3>
            <p className="text-slate-400 text-sm mb-6">Did you follow your trading plan?</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setTradeData({ ...tradeData, planDiscipline: true });
                  setTimeout(handleNext, 300);
                }}
                className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all font-bold ${
                  tradeData.planDiscipline === true
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setTradeData({ ...tradeData, planDiscipline: false });
                  setTimeout(handleNext, 300);
                }}
                className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all font-bold ${
                  tradeData.planDiscipline === false
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                No
              </button>
            </div>
          </div>
        );

      case 'news':
        return (
          <div className="py-6">
            {tradeData.journalSeparately && tradeData.tradeCount > 1 && (
              <div className="mb-4 p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg">
                <p className="text-sm text-brand-400 font-medium">
                  Trade {currentTradeIndex + 1} of {tradeData.tradeCount}
                </p>
              </div>
            )}
            <h3 className="text-xl font-bold text-white mb-2">Did you trade during news?</h3>
            <p className="text-slate-400 text-sm mb-6">Were there any major news events?</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setTradeData({ ...tradeData, tradedDuringNews: true });
                  setTimeout(handleNext, 300);
                }}
                className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all font-bold ${
                  tradeData.tradedDuringNews
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setTradeData({ ...tradeData, tradedDuringNews: false });
                  setTimeout(handleNext, 300);
                }}
                className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all font-bold ${
                  !tradeData.tradedDuringNews
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                No
              </button>
            </div>
          </div>
        );

      case 'risk':
        return (
          <div className="py-6">
            {tradeData.journalSeparately && tradeData.tradeCount > 1 && (
              <div className="mb-4 p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg">
                <p className="text-sm text-brand-400 font-medium">
                  Trade {currentTradeIndex + 1} of {tradeData.tradeCount}
                </p>
              </div>
            )}
            <h3 className="text-xl font-bold text-white mb-2">How much did you risk?</h3>
            <p className="text-slate-400 text-sm mb-6">Enter the amount in dollars</p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl text-slate-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tradeData.riskAmount || ''}
                onChange={e => setTradeData({ ...tradeData, riskAmount: parseFloat(e.target.value) || 0 })}
                className="flex-1 text-3xl font-bold text-white bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:border-brand-500 outline-none"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>
        );

      case 'tp':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">How much was your TP?</h3>
            <p className="text-slate-400 text-sm mb-6">Enter your take profit amount in dollars</p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl text-slate-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tradeData.tpAmount || ''}
                onChange={e => setTradeData({ ...tradeData, tpAmount: parseFloat(e.target.value) || 0 })}
                className="flex-1 text-3xl font-bold text-white bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:border-brand-500 outline-none"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>
        );

      case 'winLose':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">Did you win or lose the trade?</h3>
            <div className="flex gap-4 justify-center mt-8">
              <button
                onClick={() => {
                  setTradeData({ ...tradeData, winLose: 'WIN' });
                  setTimeout(handleNext, 300);
                }}
                className={`flex-1 px-6 py-6 rounded-lg border-2 transition-all font-bold text-lg ${
                  tradeData.winLose === 'WIN'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                Win
              </button>
              <button
                onClick={() => {
                  setTradeData({ ...tradeData, winLose: 'LOSS' });
                  setTimeout(handleNext, 300);
                }}
                className={`flex-1 px-6 py-6 rounded-lg border-2 transition-all font-bold text-lg ${
                  tradeData.winLose === 'LOSS'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                Lose
              </button>
            </div>
          </div>
        );

      case 'session':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">What session did you trade?</h3>
            <p className="text-slate-400 text-sm mb-6">Select the trading session</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(['Asian', 'London', 'New York', 'Overlap'] as TradingSession[]).map(session => (
                <button
                  key={session}
                  onClick={() => setTradeData({ ...tradeData, session })}
                  className={`p-4 rounded-lg border-2 transition-all font-bold ${
                    tradeData.session === session
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {session}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={tradeData.timeEnabled}
                  onChange={e => setTradeData({ ...tradeData, timeEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-slate-900"
                />
                <span className="text-sm text-slate-400 group-hover:text-slate-300">Add time (optional)</span>
              </label>
              {tradeData.timeEnabled && (
                <input
                  type="time"
                  value={tradeData.time}
                  onChange={e => setTradeData({ ...tradeData, time: e.target.value })}
                  className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-brand-500 outline-none"
                />
              )}
            </div>
          </div>
        );

      case 'overTrade':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">Did you over trade?</h3>
            <p className="text-slate-400 text-sm mb-6">Did you take more trades than planned?</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setTradeData({ ...tradeData, overTraded: true });
                  setTimeout(handleNext, 300);
                }}
                className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all font-bold ${
                  tradeData.overTraded
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setTradeData({ ...tradeData, overTraded: false });
                  setTimeout(handleNext, 300);
                }}
                className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all font-bold ${
                  !tradeData.overTraded
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                No
              </button>
            </div>
          </div>
        );

      case 'emotion':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">What was your emotion during the trade?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Select up to 3 emotions ({tradeData.emotions.length}/3 selected)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion}
                  onClick={() => toggleEmotion(emotion)}
                  disabled={!tradeData.emotions.includes(emotion) && tradeData.emotions.length >= 3}
                  className={`p-4 rounded-lg border-2 transition-all font-medium ${
                    tradeData.emotions.includes(emotion)
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {tradeData.emotions.includes(emotion) && (
                      <CheckCircle2 size={16} className="text-brand-500 flex-shrink-0" />
                    )}
                    <span>{emotion}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'mistakes':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">What could you've done differently in this trade?</h3>
            <p className="text-slate-400 text-sm mb-6">
              {tradeData.customMistake 
                ? 'Enter your custom response' 
                : `Select up to 3 options (${tradeData.mistakes.length}/3 selected) OR enter a custom response`}
            </p>
            
            {!tradeData.customMistake ? (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar mb-4">
                  {MISTAKES.map(mistake => (
                    <button
                      key={mistake}
                      onClick={() => toggleMistake(mistake)}
                      disabled={!tradeData.mistakes.includes(mistake) && tradeData.mistakes.length >= 3}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        tradeData.mistakes.includes(mistake)
                          ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                          : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {tradeData.mistakes.includes(mistake) && (
                          <CheckCircle2 size={20} className="text-brand-500 flex-shrink-0" />
                        )}
                        <span className="text-sm">{mistake}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-2">Or enter a custom response:</p>
                  <input
                    type="text"
                    placeholder="Type your custom response..."
                    value={tradeData.customMistake}
                    onChange={e => {
                      if (e.target.value) {
                        setTradeData({ ...tradeData, customMistake: e.target.value, mistakes: [] });
                      } else {
                        setTradeData({ ...tradeData, customMistake: '' });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-brand-500 outline-none"
                  />
                </div>
              </>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Type your custom response..."
                  value={tradeData.customMistake}
                  onChange={e => setTradeData({ ...tradeData, customMistake: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-brand-500 outline-none mb-4"
                />
                <button
                  onClick={() => setTradeData({ ...tradeData, customMistake: '', mistakes: [] })}
                  className="text-sm text-slate-400 hover:text-white underline"
                >
                  Use predefined options instead
                </button>
              </div>
            )}
          </div>
        );

      case 'photo':
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-2">Attach photo of your trade</h3>
            <p className="text-slate-400 text-sm mb-6">Or skip if you don't have one</p>
            <div className="space-y-4">
              {tradeData.photo ? (
                <div className="relative">
                  <img src={tradeData.photo} alt="Trade screenshot" className="w-full rounded-lg border border-slate-800" />
                  <button
                    onClick={() => setTradeData({ ...tradeData, photo: null })}
                    className="absolute top-2 right-2 bg-slate-900/80 text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-700 rounded-lg hover:border-brand-500 transition-colors cursor-pointer">
                  <Upload size={48} className="text-slate-500 mb-4" />
                  <span className="text-slate-400 font-medium">Click to upload or drag and drop</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const stepTitles: Record<WizardStep, string> = {
      start: 'Welcome',
      confirm: 'Confirmation',
      pair: 'Trading Pair',
      tradeType: 'Trade Type',
      timeframe: 'Timeframe',
      strategy: 'Strategy / Setup',
      tradeCount: 'Number of Trades',
      journalSeparately: 'Journal Separately',
      planDiscipline: 'Plan Discipline',
      news: 'News Trading',
      risk: 'Risk Amount',
      tp: 'Take Profit',
      winLose: 'Result',
      session: 'Trading Session',
      overTrade: 'Over Trading',
      emotion: 'Emotion',
      mistakes: 'Mistakes',
      photo: 'Photo'
    };
    return stepTitles[currentStep] || '';
  };

  const getAllSteps = (): WizardStep[] => {
    const steps: WizardStep[] = [
      'pair', 'tradeType', 'timeframe', 'strategy', 'tradeCount', 'journalSeparately',
      'planDiscipline', 'news', 'risk', 'tp', 'winLose', 'session', 'overTrade',
      'emotion', 'mistakes', 'photo'
    ];
    // Remove journalSeparately if tradeCount is 1
    return steps.filter(step => !(step === 'journalSeparately' && tradeData.tradeCount === 1));
  };

  const getStepNumber = () => {
    const allSteps = getAllSteps();
    return allSteps.indexOf(currentStep) + 1;
  };

  const totalSteps = getAllSteps().length;

  const handleFormSubmit = () => {
    // Create and save the trade
    addTrade(createTradeFromData(tradeData));
    onClose();
  };

  const renderFormMode = () => (
    <div className="space-y-6">
      {/* Basic Info Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Symbol */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Trading Pair *</label>
          <input
            type="text"
            value={tradeData.symbol}
            onChange={e => setTradeData({ ...tradeData, symbol: e.target.value.toUpperCase() })}
            placeholder="e.g., XAUUSD"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none"
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {COMMON_PAIRS.slice(0, 6).map(pair => (
              <button
                key={pair}
                onClick={() => setTradeData({ ...tradeData, symbol: pair })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  tradeData.symbol === pair 
                    ? 'bg-brand-500 text-slate-900' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {pair}
              </button>
            ))}
          </div>
        </div>

        {/* Trade Type */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Trade Type *</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Buy', 'Sell'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTradeData({ ...tradeData, tradeType: type })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tradeData.tradeType === type
                    ? type === 'Buy' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeframe & Strategy Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Timeframe */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Timeframe *</label>
          <div className="flex flex-wrap gap-1">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTradeData({ ...tradeData, timeframe: tf })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tradeData.timeframe === tf
                    ? 'bg-brand-500 text-slate-900'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Strategy *</label>
          <div className="flex flex-wrap gap-1">
            {STRATEGIES.map(strat => (
              <button
                key={strat}
                onClick={() => setTradeData({ ...tradeData, strategy: strat })}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  tradeData.strategy === strat
                    ? 'bg-brand-500 text-slate-900'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {strat}
              </button>
            ))}
          </div>
          {tradeData.strategy === 'Other' && (
            <input
              type="text"
              value={tradeData.customStrategy}
              onChange={e => setTradeData({ ...tradeData, customStrategy: e.target.value })}
              placeholder="Describe your strategy..."
              className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
            />
          )}
        </div>
      </div>

      {/* Risk/TP/Result Row */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Risk ($) *</label>
          <input
            type="number"
            value={tradeData.riskAmount || ''}
            onChange={e => setTradeData({ ...tradeData, riskAmount: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Take Profit ($) *</label>
          <input
            type="number"
            value={tradeData.tpAmount || ''}
            onChange={e => setTradeData({ ...tradeData, tpAmount: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Result *</label>
          <div className="grid grid-cols-2 gap-2">
            {(['WIN', 'LOSS'] as const).map(result => (
              <button
                key={result}
                onClick={() => setTradeData({ ...tradeData, winLose: result })}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  tradeData.winLose === result
                    ? result === 'WIN' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {result}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Session Row */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Session *</label>
        <div className="flex flex-wrap gap-2">
          {(['London', 'New York', 'Asian', 'Overlap'] as TradingSession[]).map(session => (
            <button
              key={session}
              onClick={() => setTradeData({ ...tradeData, session })}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tradeData.session === session
                  ? 'bg-brand-500 text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {session}
            </button>
          ))}
        </div>
      </div>

      {/* Yes/No Questions */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Followed Plan?</label>
          <div className="flex gap-2">
            {[true, false].map(val => (
              <button
                key={String(val)}
                onClick={() => setTradeData({ ...tradeData, planDiscipline: val })}
                className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  tradeData.planDiscipline === val
                    ? val ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {val ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">During News?</label>
          <div className="flex gap-2">
            {[true, false].map(val => (
              <button
                key={String(val)}
                onClick={() => setTradeData({ ...tradeData, tradedDuringNews: val })}
                className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  tradeData.tradedDuringNews === val
                    ? 'bg-brand-500 text-slate-900'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {val ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Over Traded?</label>
          <div className="flex gap-2">
            {[true, false].map(val => (
              <button
                key={String(val)}
                onClick={() => setTradeData({ ...tradeData, overTraded: val })}
                className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  tradeData.overTraded === val
                    ? val ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {val ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Emotions */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
          Emotions <span className="text-slate-600">(max 3)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map(emotion => (
            <button
              key={emotion}
              onClick={() => toggleEmotion(emotion)}
              disabled={tradeData.emotions.length >= 3 && !tradeData.emotions.includes(emotion)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tradeData.emotions.includes(emotion)
                  ? 'bg-brand-500 text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50'
              }`}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      {/* Mistakes */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
          What could you've done differently? <span className="text-slate-600">(max 3 or custom)</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {MISTAKES.slice(0, 5).map(mistake => (
            <button
              key={mistake}
              onClick={() => toggleMistake(mistake)}
              disabled={(tradeData.mistakes.length >= 3 && !tradeData.mistakes.includes(mistake)) || tradeData.customMistake.length > 0}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                tradeData.mistakes.includes(mistake)
                  ? 'bg-brand-500 text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50'
              }`}
            >
              {mistake.length > 30 ? mistake.slice(0, 30) + '...' : mistake}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={tradeData.customMistake}
          onChange={e => {
            if (e.target.value) {
              setTradeData({ ...tradeData, customMistake: e.target.value, mistakes: [] });
            } else {
              setTradeData({ ...tradeData, customMistake: '' });
            }
          }}
          placeholder="Or type your own reflection..."
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
        />
      </div>

      {/* Photo */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Trade Screenshot (Optional)</label>
        {tradeData.photo ? (
          <div className="relative">
            <img src={tradeData.photo} alt="Trade" className="w-full h-32 object-cover rounded-lg" />
            <button
              onClick={() => setTradeData({ ...tradeData, photo: null })}
              className="absolute top-2 right-2 p-1 bg-slate-900/80 rounded-full text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition-colors">
            <Upload size={20} className="text-slate-500 mb-1" />
            <span className="text-xs text-slate-500">Click to upload</span>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setTradeData({ ...tradeData, photo: ev.target?.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );

  const canSubmitForm = () => {
    return (
      tradeData.symbol.trim() !== '' &&
      tradeData.tradeType !== '' &&
      tradeData.timeframe !== '' &&
      tradeData.strategy !== '' &&
      (tradeData.strategy !== 'Other' || tradeData.customStrategy.trim() !== '') &&
      tradeData.riskAmount > 0 &&
      tradeData.tpAmount > 0 &&
      tradeData.planDiscipline !== null
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Log New Trade</h2>
            <p className="text-xs text-slate-500 mt-1">
              {formMode === 'interactive' 
                ? `Step ${getStepNumber()} of ${totalSteps} • ${getStepTitle()}`
                : 'Fill in all trade details below'
              }
            </p>
          </div>
          <div className="flex items-center gap-3 relative">
            {/* Mode Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setFormMode('interactive')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                  formMode === 'interactive' 
                    ? 'bg-brand-500 text-slate-900' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Interactive mode"
              >
                <MessageSquare size={12} />
                <span className="hidden sm:inline">Interactive</span>
              </button>
              <button
                onClick={() => setFormMode('form')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                  formMode === 'form' 
                    ? 'bg-brand-500 text-slate-900' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Form mode"
              >
                <ListChecks size={12} />
                <span className="hidden sm:inline">Form</span>
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-2 group"
              >
                <Calendar size={16} className="group-hover:text-brand-500 transition-colors" />
                <span className="group-hover:text-white transition-colors">
                  {new Date(tradeData.date).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
              </button>
              
              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDatePicker(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4 z-20 min-w-[280px]">
                    <div className="flex gap-2 items-end">
                      {/* Day Dropdown */}
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Day</label>
                        <select
                          value={new Date(tradeData.date).getDate()}
                          onChange={e => {
                            const newDate = new Date(tradeData.date);
                            const selectedDay = parseInt(e.target.value);
                            const daysInMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
                            newDate.setDate(Math.min(selectedDay, daysInMonth));
                            setTradeData({ ...tradeData, date: newDate.toISOString().split('T')[0] });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                        >
                          {(() => {
                            const currentDate = new Date(tradeData.date);
                            const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                            return Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>{day}</option>
                            ));
                          })()}
                        </select>
                      </div>
                      
                      {/* Month Dropdown */}
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Month</label>
                        <select
                          value={new Date(tradeData.date).getMonth()}
                          onChange={e => {
                            const newDate = new Date(tradeData.date);
                            const selectedMonth = parseInt(e.target.value);
                            const currentDay = newDate.getDate();
                            newDate.setMonth(selectedMonth);
                            // Adjust day if current day doesn't exist in new month (e.g., Feb 30 -> Feb 28/29)
                            const daysInNewMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
                            if (currentDay > daysInNewMonth) {
                              newDate.setDate(daysInNewMonth);
                            }
                            setTradeData({ ...tradeData, date: newDate.toISOString().split('T')[0] });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                        >
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                            <option key={index} value={index}>{month}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Year Dropdown */}
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Year</label>
                        <select
                          value={new Date(tradeData.date).getFullYear()}
                          onChange={e => {
                            const newDate = new Date(tradeData.date);
                            const selectedYear = parseInt(e.target.value);
                            const currentDay = newDate.getDate();
                            newDate.setFullYear(selectedYear);
                            // Adjust day if current day doesn't exist in new year (e.g., Feb 29 in non-leap year)
                            const daysInMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
                            if (currentDay > daysInMonth) {
                              newDate.setDate(daysInMonth);
                            }
                            setTradeData({ ...tradeData, date: newDate.toISOString().split('T')[0] });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                        >
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setTradeData({ ...tradeData, date: new Date().toISOString().split('T')[0] });
                        setShowDatePicker(false);
                      }}
                      className="mt-3 w-full px-3 py-2 text-xs font-medium text-brand-400 hover:text-brand-300 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Set to Today
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {/* Account Selector */}
            {accounts.filter(a => !a.isHidden).length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-2 group"
                >
                  <Wallet size={16} className="group-hover:text-brand-500 transition-colors" />
                  <span className="group-hover:text-white transition-colors max-w-[100px] truncate">
                    {accounts.find(a => a.id === tradeData.accountId)?.name || 'No Account'}
                  </span>
                  <ChevronDown size={12} className="text-slate-500" />
                </button>
                
                {showAccountDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowAccountDropdown(false)} />
                    <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-20 overflow-hidden">
                      {accounts.filter(a => !a.isHidden).map(account => (
                        <button
                          key={account.id}
                          onClick={() => {
                            setTradeData({ ...tradeData, accountId: account.id });
                            setShowAccountDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center justify-between ${
                            account.id === tradeData.accountId ? 'bg-brand-500/10 text-brand-400' : 'text-slate-300'
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
            )}
            
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Bar - only in interactive mode */}
        {formMode === 'interactive' && (
          <div className="h-1 bg-slate-800">
            <div
              className="h-full bg-brand-500 transition-all duration-300"
              style={{ width: `${(getStepNumber() / totalSteps) * 100}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
          {formMode === 'interactive' ? renderStep() : renderFormMode()}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 flex justify-between items-center">
          {formMode === 'form' ? (
            <>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={!canSubmitForm()}
                className="bg-brand-500 hover:bg-brand-600 text-slate-900 px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={16} />
                Save Trade
              </button>
            </>
          ) : (
            <>
              <button
                onClick={currentStep === 'start' ? onClose : handleBack}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft size={16} />
                {currentStep === 'start' ? 'Cancel' : 'Back'}
              </button>
              
              {currentStep === 'photo' ? (
                <button
                  onClick={handleFinish}
                  className="bg-brand-500 hover:bg-brand-600 text-slate-900 px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
                >
                  {tradeData.journalSeparately && tradeData.tradeCount > 1 && currentTradeIndex < tradeData.tradeCount - 1
                    ? `Continue to Trade ${currentTradeIndex + 2}`
                    : `Save Trade${tradeData.tradeCount > 1 && !tradeData.journalSeparately ? 's' : ''}`}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-brand-500 hover:bg-brand-600 text-slate-900 px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeWizard;

