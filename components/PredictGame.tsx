import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Trophy, RefreshCw, Zap, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

// Generate random candlestick data
const generateCandles = (count: number, startPrice: number = 100): Candle[] => {
  const candles: Candle[] = [];
  let price = startPrice;
  
  for (let i = 0; i < count; i++) {
    const volatility = Math.random() * 3 + 1;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const change = direction * volatility;
    
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    candles.push({ open, high, low, close });
    price = close;
  }
  
  return candles;
};

// Draw candlestick chart
const CandlestickChart: React.FC<{ candles: Candle[]; visibleCount: number; width: number; height: number }> = ({ 
  candles, visibleCount, width, height 
}) => {
  const visibleCandles = candles.slice(0, visibleCount);
  
  const prices = visibleCandles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices) - 1;
  const maxPrice = Math.max(...prices) + 1;
  const priceRange = maxPrice - minPrice;
  
  const candleWidth = (width - 40) / candles.length;
  const padding = 20;
  
  const scaleY = (price: number) => height - padding - ((price - minPrice) / priceRange) * (height - padding * 2);
  
  return (
    <svg width={width} height={height} className="chart-container rounded-xl">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(ratio => (
        <line
          key={ratio}
          x1={padding}
          y1={padding + (height - padding * 2) * ratio}
          x2={width - padding}
          y2={padding + (height - padding * 2) * ratio}
          stroke="rgba(139, 92, 246, 0.1)"
          strokeDasharray="4"
        />
      ))}
      
      {/* Candles */}
      {visibleCandles.map((candle, i) => {
        const x = padding + i * candleWidth + candleWidth / 2;
        const isGreen = candle.close >= candle.open;
        const color = isGreen ? '#a78bfa' : '#f472b6';
        
        const bodyTop = scaleY(Math.max(candle.open, candle.close));
        const bodyBottom = scaleY(Math.min(candle.open, candle.close));
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
        
        return (
          <g key={i}>
            {/* Wick */}
            <line
              x1={x}
              y1={scaleY(candle.high)}
              x2={x}
              y2={scaleY(candle.low)}
              stroke={color}
              strokeWidth={1}
            />
            {/* Body */}
            <rect
              x={x - candleWidth * 0.3}
              y={bodyTop}
              width={candleWidth * 0.6}
              height={bodyHeight}
              fill={isGreen ? color : 'transparent'}
              stroke={color}
              strokeWidth={1.5}
              rx={1}
            />
          </g>
        );
      })}
      
      {/* Hidden candles indicator */}
      {visibleCount < candles.length && (
        <g>
          <rect
            x={padding + visibleCount * candleWidth}
            y={padding}
            width={(candles.length - visibleCount) * candleWidth}
            height={height - padding * 2}
            fill="rgba(139, 92, 246, 0.05)"
            stroke="rgba(139, 92, 246, 0.2)"
            strokeDasharray="4"
            rx={8}
          />
          <text
            x={padding + visibleCount * candleWidth + ((candles.length - visibleCount) * candleWidth) / 2}
            y={height / 2}
            textAnchor="middle"
            fill="rgba(139, 92, 246, 0.5)"
            fontSize={12}
          >
            ?
          </text>
        </g>
      )}
    </svg>
  );
};

interface PredictGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const PredictGame: React.FC<PredictGameProps> = ({ isOpen, onClose }) => {
  const { theme, isLightTheme } = useTheme();
  const [candles, setCandles] = useState<Candle[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [prediction, setPrediction] = useState<'BUY' | 'SELL' | null>(null);
  const [result, setResult] = useState<'WIN' | 'LOSE' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  
  const TOTAL_CANDLES = 8;
  const VISIBLE_CANDLES = 5;

  // Initialize game
  const initGame = () => {
    setCandles(generateCandles(TOTAL_CANDLES));
    setVisibleCount(VISIBLE_CANDLES);
    setPrediction(null);
    setResult(null);
  };

  useEffect(() => {
    if (isOpen) {
      initGame();
      // Load best streak from localStorage
      const saved = localStorage.getItem('predict_game_best');
      if (saved) setBestStreak(parseInt(saved));
    }
  }, [isOpen]);

  const handlePrediction = (pred: 'BUY' | 'SELL') => {
    if (prediction) return;
    
    setPrediction(pred);
    
    // Reveal remaining candles with animation
    let count = visibleCount;
    const interval = setInterval(() => {
      count++;
      setVisibleCount(count);
      if (count >= TOTAL_CANDLES) {
        clearInterval(interval);
        
        // Calculate result
        const lastVisibleClose = candles[VISIBLE_CANDLES - 1].close;
        const finalClose = candles[TOTAL_CANDLES - 1].close;
        const actualDirection = finalClose > lastVisibleClose ? 'BUY' : 'SELL';
        
        const won = pred === actualDirection;
        setResult(won ? 'WIN' : 'LOSE');
        setGamesPlayed(g => g + 1);
        
        if (won) {
          setScore(s => s + (10 * (streak + 1)));
          setStreak(s => {
            const newStreak = s + 1;
            if (newStreak > bestStreak) {
              setBestStreak(newStreak);
              localStorage.setItem('predict_game_best', newStreak.toString());
            }
            return newStreak;
          });
          
        } else {
          setStreak(0);
        }
      }
    }, 300);
  };

  const handleNextRound = () => {
    initGame();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-[#0f0a1e] border border-[#8b5cf6]/20 w-full max-w-md rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center">
              <Zap size={16} className="text-[#8b5cf6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Predict the Chart</h2>
                <span className="px-1.5 py-0.5 text-[8px] font-bold text-slate-400 bg-slate-800 rounded">Just for Fun</span>
              </div>
              <p className="text-[10px] text-slate-500">Randomized practice mode</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-800/30">
          <div className="text-center">
            <p className="text-lg font-bold text-[#8b5cf6] font-mono">{score}</p>
            <p className="text-[10px] text-slate-500">Score</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#fbbf24] font-mono">{streak}</p>
            <p className="text-[10px] text-slate-500">Streak</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white font-mono">{bestStreak}</p>
            <p className="text-[10px] text-slate-500">Best</p>
          </div>
        </div>

        {/* Chart */}
        <div className="p-4">
          <CandlestickChart 
            candles={candles} 
            visibleCount={visibleCount}
            width={350}
            height={180}
          />
        </div>

        {/* Result or Prediction Buttons */}
        <div className="p-4">
          {result ? (
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl mb-4 ${
                result === 'WIN' 
                  ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' 
                  : 'bg-[#f472b6]/20 text-[#f472b6]'
              }`}>
                {result === 'WIN' ? <Trophy size={20} /> : <TrendingDown size={20} />}
                <span className="text-lg font-bold">{result === 'WIN' ? 'Correct!' : 'Wrong!'}</span>
              </div>
              
              {result === 'WIN' && (
                <div className="mb-4 space-y-1">
                  <p className="text-sm text-[#8b5cf6] font-medium">+5 XP earned!</p>
                  {streak > 1 && (
                    <p className="text-sm text-[#fbbf24]">🔥 {streak} streak! +{10 * streak} points</p>
                  )}
                </div>
              )}
              
              <button
                onClick={handleNextRound}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 neon-glow"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white' }}
              >
                <RefreshCw size={18} />
                Next Round
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePrediction('BUY')}
                disabled={!!prediction}
                className="py-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/30 transition-all disabled:opacity-50"
              >
                <TrendingUp size={20} />
                BUY
              </button>
              <button
                onClick={() => handlePrediction('SELL')}
                disabled={!!prediction}
                className="py-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-[#f472b6]/20 text-[#f472b6] border border-[#f472b6]/30 hover:bg-[#f472b6]/30 transition-all disabled:opacity-50"
              >
                <TrendingDown size={20} />
                SELL
              </button>
            </div>
          )}
        </div>

        {/* Hint */}
        {!prediction && (
          <p className="text-center text-xs text-slate-500 pb-4">
            Analyze the pattern and predict the next 3 candles
          </p>
        )}
      </div>
    </div>
  );
};

export default PredictGame;

