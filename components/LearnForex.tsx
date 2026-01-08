import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronRight, ChevronLeft, BookOpen, HelpCircle, CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LearnForexProps {
    moduleId: string;
    moduleTitle: string;
    onBack: () => void;
    onComplete: (score: number) => void;
    onSectionRead: (sectionIndex: number) => void;
    initialSectionsRead: number;
}

interface Section {
    title: string;
    content: string[];
}

interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

interface ModuleContent {
    sections: Section[];
    questions: Question[];
}

// Educational content for each module
const MODULE_CONTENT: Record<string, ModuleContent> = {
    'forex-basics': {
        sections: [
            {
                title: 'What is Forex?',
                content: [
                    'Forex (Foreign Exchange) is the global marketplace for trading national currencies. It\'s the largest financial market in the world with over $6 trillion traded daily.',
                    'Unlike stocks, forex operates 24 hours a day, 5 days a week across major financial centers like London, New York, Tokyo, and Sydney.',
                    'Currency trading always involves pairs - you\'re buying one currency while simultaneously selling another. For example, EUR/USD means you\'re trading Euros against US Dollars.',
                ],
            },
            {
                title: 'Currency Pairs Explained',
                content: [
                    'Currency pairs are divided into three categories: Major pairs (include USD), Minor pairs (exclude USD but include major currencies), and Exotic pairs (include emerging market currencies).',
                    'The first currency in a pair is the BASE currency, and the second is the QUOTE currency. EUR/USD = 1.1000 means 1 Euro equals 1.10 US Dollars.',
                    'Major pairs like EUR/USD, GBP/USD, and USD/JPY have the tightest spreads and highest liquidity, making them ideal for beginners.',
                ],
            },
            {
                title: 'Understanding Pips',
                content: [
                    'A pip (Percentage in Point) is the smallest price move in a currency pair. For most pairs, a pip is 0.0001 (the fourth decimal place).',
                    'For JPY pairs, a pip is 0.01 (the second decimal place). If EUR/USD moves from 1.1000 to 1.1050, that\'s a 50-pip move.',
                    'Pip value depends on your position size. Calculating pip value helps you understand your potential profit or loss on each trade.',
                ],
            },
            {
                title: 'Lots and Position Sizing',
                content: [
                    'Position size in forex is measured in lots. A Standard Lot = 100,000 units, Mini Lot = 10,000 units, Micro Lot = 1,000 units.',
                    'For EUR/USD with a standard lot, each pip is worth approximately $10. With a mini lot, each pip is worth $1.',
                    'Proper position sizing is crucial for risk management. Never risk more than 1-2% of your account on a single trade.',
                ],
            },
            {
                title: 'Leverage and Margin',
                content: [
                    'Leverage allows you to control large positions with a small amount of capital. 100:1 leverage means $1,000 controls $100,000.',
                    'Margin is the deposit required to open a leveraged position. With 100:1 leverage, you need 1% margin ($1,000 for a $100,000 position).',
                    'Warning: Leverage amplifies both profits AND losses. High leverage is the #1 reason retail traders blow their accounts.',
                ],
            },
        ],
        questions: [
            { question: 'What does Forex stand for?', options: ['Foreign Export', 'Foreign Exchange', 'Forward Exchange', 'Future Exchange'], correctIndex: 1, explanation: 'Forex is short for Foreign Exchange - the global currency trading market.' },
            { question: 'In the pair EUR/USD, which is the base currency?', options: ['USD', 'EUR', 'Both equally', 'Neither'], correctIndex: 1, explanation: 'The first currency (EUR) is always the base currency in a pair.' },
            { question: 'How many pips is a move from 1.3050 to 1.3150?', options: ['10 pips', '50 pips', '100 pips', '1000 pips'], correctIndex: 2, explanation: '1.3150 - 1.3050 = 0.0100 = 100 pips (each pip is 0.0001).' },
            { question: 'What is a Standard Lot equal to?', options: ['1,000 units', '10,000 units', '100,000 units', '1,000,000 units'], correctIndex: 2, explanation: 'A Standard Lot equals 100,000 units of the base currency.' },
            { question: 'With 50:1 leverage, how much margin is needed for a $100,000 position?', options: ['$500', '$1,000', '$2,000', '$5,000'], correctIndex: 2, explanation: '50:1 leverage requires 2% margin: $100,000 × 2% = $2,000.' },
            { question: 'Which pair would have a pip at the 2nd decimal place?', options: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'], correctIndex: 2, explanation: 'JPY pairs use 2 decimal places, so pips are at 0.01 instead of 0.0001.' },
            { question: 'What is the recommended maximum risk per trade?', options: ['5-10%', '1-2%', '10-20%', '25%'], correctIndex: 1, explanation: 'Professional traders typically risk only 1-2% of their account per trade.' },
            { question: 'When is the Forex market closed?', options: ['Never open', 'Weekends only', 'Nights only', 'Holidays only'], correctIndex: 1, explanation: 'Forex trades 24/5, closing only on weekends (Saturday-Sunday).' },
            { question: 'What type of pair is EUR/GBP?', options: ['Major pair', 'Minor pair', 'Exotic pair', 'Commodity pair'], correctIndex: 1, explanation: 'EUR/GBP is a minor pair - it excludes USD but includes major currencies.' },
            { question: 'If spread is 2 pips on EUR/USD standard lot, what is your cost?', options: ['$2', '$10', '$20', '$200'], correctIndex: 2, explanation: 'Standard lot = $10/pip. 2 pips × $10 = $20 spread cost.' },
        ],
    },
    'candlestick-basics': {
        sections: [
            {
                title: 'Candlestick Anatomy',
                content: [
                    'Each candlestick shows four prices: Open, High, Low, and Close (OHLC). The body shows the range between open and close.',
                    'A bullish (green/white) candle closes higher than it opens. A bearish (red/black) candle closes lower than it opens.',
                    'The wicks (shadows) show the high and low extremes. Long wicks indicate rejection of those price levels.',
                ],
            },
            {
                title: 'Single Candle Patterns',
                content: [
                    'Doji: Open and close are nearly equal, showing indecision. The market is at a balance point between buyers and sellers.',
                    'Hammer/Hanging Man: Small body at top, long lower wick. Hammer (bottom of downtrend) is bullish, Hanging Man (top of uptrend) is bearish.',
                    'Shooting Star/Inverted Hammer: Small body at bottom, long upper wick. Shows rejection of higher prices.',
                ],
            },
            {
                title: 'Engulfing Patterns',
                content: [
                    'Bullish Engulfing: A large green candle completely engulfs the previous red candle. Strong reversal signal at support.',
                    'Bearish Engulfing: A large red candle completely engulfs the previous green candle. Strong reversal signal at resistance.',
                    'The larger the engulfing candle relative to previous candles, the stronger the signal. Volume confirmation adds strength.',
                ],
            },
            {
                title: 'Morning & Evening Stars',
                content: [
                    'Morning Star (bullish): 3-candle pattern at bottom - large red candle, small-bodied candle, large green candle closing past midpoint of first.',
                    'Evening Star (bearish): Opposite at top - large green candle, small-bodied candle, large red candle closing past midpoint of first.',
                    'These patterns show clear sentiment shift from one side to another over 3 periods.',
                ],
            },
            {
                title: 'Reading Candles in Context',
                content: [
                    'Candlestick patterns work best at key levels (support, resistance, moving averages). A hammer at random has little meaning.',
                    'Always consider the trend. Bullish patterns in uptrends are continuation signals. At trend exhaustion, they may signal reversal.',
                    'Combine candlestick analysis with volume, timeframe confluence, and other indicators for higher probability trades.',
                ],
            },
        ],
        questions: [
            { question: 'What does OHLC stand for?', options: ['Open, High, Low, Close', 'Order, Hold, Limit, Cancel', 'Over, Higher, Lower, Current', 'Offer, High, Low, Change'], correctIndex: 0, explanation: 'OHLC represents the four prices in each candlestick: Open, High, Low, Close.' },
            { question: 'A doji candle indicates:', options: ['Strong buying', 'Strong selling', 'Market indecision', 'End of trading'], correctIndex: 2, explanation: 'Doji shows open ≈ close, meaning neither bulls nor bears won - indecision.' },
            { question: 'What pattern has a small body and long lower wick at a bottom?', options: ['Shooting Star', 'Hanging Man', 'Hammer', 'Doji'], correctIndex: 2, explanation: 'A Hammer appears at bottoms with a small body and long lower wick, signaling potential reversal up.' },
            { question: 'A Bearish Engulfing pattern suggests:', options: ['Continue buying', 'Potential reversal down', 'Market closed', 'Need more data'], correctIndex: 1, explanation: 'Bearish Engulfing shows sellers overwhelming buyers - potential reversal downward.' },
            { question: 'How many candles form a Morning Star pattern?', options: ['1', '2', '3', '4'], correctIndex: 2, explanation: 'Morning Star is a 3-candle pattern: large red, small body, large green.' },
            { question: 'Long upper wicks suggest:', options: ['Strong support', 'Rejection of higher prices', 'Buyers in control', 'Trend continuation'], correctIndex: 1, explanation: 'Long upper wicks show price tried to go higher but was rejected back down.' },
            { question: 'Where are candlestick patterns most reliable?', options: ['Random locations', 'Key support/resistance levels', 'During low volume', 'On 1-minute charts only'], correctIndex: 1, explanation: 'Patterns are most reliable at significant levels where they represent actual supply/demand zones.' },
            { question: 'What color is typically used for bullish candles?', options: ['Red', 'Black', 'Green/White', 'Blue'], correctIndex: 2, explanation: 'Bullish candles are typically shown as green or white (close > open).' },
            { question: 'An Evening Star appears at:', options: ['Market bottoms', 'Market tops', 'Anywhere', 'Opening bell only'], correctIndex: 1, explanation: 'Evening Star is a bearish reversal pattern that appears at tops/end of uptrends.' },
            { question: 'The body of a candle represents:', options: ['High to Low range', 'Open to Close range', 'Volume traded', 'Time elapsed'], correctIndex: 1, explanation: 'The body spans from open to close price, showing the main price action.' },
        ],
    },
    'trend-htf': {
        sections: [
            {
                title: 'Identifying Trends',
                content: [
                    'Uptrend: Series of Higher Highs (HH) and Higher Lows (HL). Each swing high surpasses the previous, and pullbacks stay above prior lows.',
                    'Downtrend: Series of Lower Highs (LH) and Lower Lows (LL). Each swing low breaks the previous, and rallies fail below prior highs.',
                    'Range/Consolidation: Price oscillates between defined support and resistance without making new trend structure.',
                ],
            },
            {
                title: 'Support and Resistance',
                content: [
                    'Support: Price level where buying pressure has historically stopped price from falling further. Demand zone.',
                    'Resistance: Price level where selling pressure has historically stopped price from rising further. Supply zone.',
                    'Role Reversal: Once broken, support becomes resistance and resistance becomes support. This is a key trading concept.',
                ],
            },
            {
                title: 'Multi-Timeframe Analysis',
                content: [
                    'Higher timeframes show the dominant trend and major levels. Lower timeframes show entry opportunities within that context.',
                    'Common approach: Weekly/Daily for trend direction, H4/H1 for setup identification, M15/M5 for precision entries.',
                    'Trade WITH the higher timeframe trend. If Weekly is bullish, look for long setups on lower timeframes.',
                ],
            },
            {
                title: 'Timeframe Confluence',
                content: [
                    'Best setups occur when multiple timeframes align. Example: Daily uptrend + H4 pullback to support + H1 bullish engulfing.',
                    'Conflicts between timeframes often lead to choppy price action. Wait for alignment for cleaner trades.',
                    'Higher timeframe levels are stronger than lower timeframe levels. A daily support zone matters more than an H1 zone.',
                ],
            },
            {
                title: 'Trend Trading vs Counter-Trend',
                content: [
                    'Trend following: Trading pullbacks in established trends. Higher probability, good risk-reward when timing entries at structure.',
                    'Counter-trend: Trading reversals against the trend. Lower probability but potentially bigger wins. Requires strong confirmation.',
                    'Most successful traders focus on trend-following strategies. Trade what you see, not what you think will happen.',
                ],
            },
        ],
        questions: [
            { question: 'An uptrend is defined by:', options: ['Lower lows', 'Higher highs and higher lows', 'Equal highs and lows', 'Lower highs'], correctIndex: 1, explanation: 'Uptrends form when price makes higher highs (HH) and higher lows (HL).' },
            { question: 'When support is broken, it often becomes:', options: ['Stronger support', 'Resistance', 'Irrelevant', 'A buy zone'], correctIndex: 1, explanation: 'Role reversal: broken support becomes resistance and vice versa.' },
            { question: 'What timeframe shows the dominant trend?', options: ['M1', 'M5', 'Higher timeframes (D/W)', 'All equal'], correctIndex: 2, explanation: 'Higher timeframes (Daily, Weekly) show the dominant trend direction.' },
            { question: 'Multi-timeframe analysis involves:', options: ['Only using 1 chart', 'Checking several timeframes', 'Ignoring trends', 'Random entry'], correctIndex: 1, explanation: 'MTF analysis uses multiple timeframes for context, setups, and entries.' },
            { question: 'Which trade type has higher probability?', options: ['Counter-trend', 'Trend-following', 'Both equal', 'Random'], correctIndex: 1, explanation: 'Trading with the trend (trend-following) has higher probability of success.' },
            { question: 'A demand zone is another term for:', options: ['Resistance', 'Support', 'Trend line', 'Moving average'], correctIndex: 1, explanation: 'Support/demand zones are where buyers historically step in.' },
            { question: 'LH and LL structure indicates:', options: ['Uptrend', 'Downtrend', 'Range', 'Breakout'], correctIndex: 1, explanation: 'Lower Highs and Lower Lows (LH/LL) define a downtrend structure.' },
            { question: 'Best setups occur when:', options: ['Timeframes conflict', 'Only 1 TF is used', 'Multiple timeframes align', 'News is released'], correctIndex: 2, explanation: 'Confluence from multiple aligned timeframes creates the best trading setups.' },
            { question: 'A daily support zone is ____ than an H1 zone:', options: ['Weaker', 'Stronger', 'Equal', 'Unrelated'], correctIndex: 1, explanation: 'Higher timeframe levels carry more significance and strength.' },
            { question: 'Price oscillating between defined levels is called:', options: ['Trending', 'Breaking out', 'Range/Consolidation', 'Reversal'], correctIndex: 2, explanation: 'When price moves sideways between support and resistance, it\'s ranging.' },
        ],
    },
    'daytrading-basics': {
        sections: [
            {
                title: 'Top-Down Analysis',
                content: [
                    'Start from higher timeframes (Weekly/Daily) to understand the big picture trend and major levels before drilling down.',
                    'Mark major support/resistance zones on Daily. Then move to H4 to see how price is approaching those zones.',
                    'Finally, use H1/M15 to identify entry triggers once price reaches your area of interest. This is Top-Down Execution.',
                ],
            },
            {
                title: 'Building Confluence',
                content: [
                    'Confluence = Multiple factors pointing to the same trade. More confluence = higher probability trade.',
                    'Examples: Support zone + 200 EMA + Bullish engulfing + Fibonacci 61.8% = 4 factors of confluence.',
                    'Avoid trading single signals. Wait for 2-3 confluence factors minimum before taking a trade.',
                ],
            },
            {
                title: 'Entry Criteria Checklist',
                content: [
                    '1. Trend alignment - Am I trading with the higher timeframe trend?',
                    '2. Key level - Is price at significant support/resistance/moving average?',
                    '3. Price action - Is there a clear candlestick pattern or rejection signal?',
                    '4. Risk-reward - Can I get minimum 1:2 RR to the next major level?',
                ],
            },
            {
                title: 'Managing the Trade',
                content: [
                    'Set stop loss BEFORE entering. Place it below support (longs) or above resistance (shorts) with buffer room.',
                    'Take partial profits at 1:1 risk-reward to lock in gains. Move stop to breakeven on remainder.',
                    'Let winners run but trail your stop. Don\'t exit early out of fear. Respect your original analysis.',
                ],
            },
            {
                title: 'Daytrading Psychology',
                content: [
                    'Accept that losses are part of trading. A 50% win rate with 1:2 RR is still profitable long-term.',
                    'Never revenge trade after a loss. Stick to your plan. The market will always offer new opportunities.',
                    'Keep a trading journal. Review your trades weekly. Learn from both winners and losers to improve.',
                ],
            },
        ],
        questions: [
            { question: 'Top-down analysis starts with:', options: ['Lower timeframes', 'Higher timeframes', 'News events', 'Random chart'], correctIndex: 1, explanation: 'Top-down starts high (Weekly/Daily) and drills down to lower timeframes.' },
            { question: 'Confluence means:', options: ['Single entry signal', 'Multiple factors aligning', 'Random entry', 'Counter-trend trade'], correctIndex: 1, explanation: 'Confluence is when multiple technical factors point to the same trade direction.' },
            { question: 'Minimum risk-reward ratio recommended:', options: ['1:0.5', '1:1', '1:2 or better', '1:10'], correctIndex: 2, explanation: 'Aim for 1:2 minimum RR - risk 1 unit to potentially gain 2 units.' },
            { question: 'Where should stop loss be placed for a long trade?', options: ['Above resistance', 'Below support', 'At entry price', 'Anywhere'], correctIndex: 1, explanation: 'For longs, stop goes below support level with some buffer room.' },
            { question: 'After a losing trade, you should:', options: ['Revenge trade immediately', 'Double position size', 'Stick to your plan', 'Quit trading'], correctIndex: 2, explanation: 'Never revenge trade. Accept the loss and wait for next valid setup.' },
            { question: 'What is a trading journal for?', options: ['Entertainment', 'Reviewing and improving', 'Bragging rights', 'Tax evasion'], correctIndex: 1, explanation: 'Journals help you analyze past trades and identify areas for improvement.' },
            { question: 'How many confluence factors minimum before trading?', options: ['0', '1', '2-3', '10+'], correctIndex: 2, explanation: 'Wait for at least 2-3 confluence factors for higher probability trades.' },
            { question: 'When should stop loss be set?', options: ['After entry', 'Before entry', 'Never', 'Only on winners'], correctIndex: 1, explanation: 'Always determine your stop loss location BEFORE entering the trade.' },
            { question: 'A 50% win rate with 1:2 RR is:', options: ['Unprofitable', 'Breakeven', 'Profitable', 'Impossible'], correctIndex: 2, explanation: 'Win 5/10 trades: 5×$2 = $10 gain, 5×$1 = $5 loss. Net +$5 profit.' },
            { question: 'Taking partial profits at 1:1 RR helps to:', options: ['Increase risk', 'Lock in gains', 'Lose money', 'Exit everything'], correctIndex: 1, explanation: 'Partial profits at 1:1 secures some gains while letting the rest run.' },
        ],
    },
};

const LearnForex: React.FC<LearnForexProps> = ({
    moduleId,
    moduleTitle,
    onBack,
    onComplete,
    onSectionRead,
    initialSectionsRead,
}) => {
    const { theme, isLightTheme } = useTheme();
    const [view, setView] = useState<'sections' | 'quiz' | 'results'>('sections');
    const [currentSectionIndex, setCurrentSectionIndex] = useState(Math.min(initialSectionsRead, (MODULE_CONTENT[moduleId]?.sections.length || 1) - 1));
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [showExplanation, setShowExplanation] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    const content = MODULE_CONTENT[moduleId];
    const sections = content?.sections || [];
    const questions = content?.questions || [];

    const score = useMemo(() => {
        if (answers.length === 0) return 0;
        const correct = answers.filter((a, i) => a === questions[i]?.correctIndex).length;
        return Math.round((correct / questions.length) * 100);
    }, [answers, questions]);

    const handleNextSection = () => {
        if (currentSectionIndex < sections.length - 1) {
            onSectionRead(currentSectionIndex);
            setCurrentSectionIndex(currentSectionIndex + 1);
        } else {
            onSectionRead(currentSectionIndex);
            setView('quiz');
            setCurrentQuestionIndex(0);
            setAnswers([]);
            setShowExplanation(false);
            setSelectedAnswer(null);
        }
    };

    const handlePrevSection = () => {
        if (currentSectionIndex > 0) {
            setCurrentSectionIndex(currentSectionIndex - 1);
        }
    };

    const handleAnswerSelect = (optionIndex: number) => {
        if (showExplanation) return;
        setSelectedAnswer(optionIndex);
        setShowExplanation(true);
        setAnswers([...answers, optionIndex]);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setShowExplanation(false);
            setSelectedAnswer(null);
        } else {
            setView('results');
        }
    };

    const handleRetry = () => {
        setView('quiz');
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setShowExplanation(false);
        setSelectedAnswer(null);
    };

    const handleFinish = () => {
        onComplete(score);
    };

    // Theme-aware colors
    const textPrimary = isLightTheme ? 'text-slate-800' : 'text-white';
    const textSecondary = isLightTheme ? 'text-slate-600' : 'text-slate-400';
    const cardBg = isLightTheme ? 'bg-white' : '';

    const currentSection = sections[currentSectionIndex];
    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div
            className="flex-1 h-full overflow-y-auto custom-scrollbar"
            style={{ background: theme.bgGradient, backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}
        >
            <div className="px-4 pt-4 pb-20 max-w-lg mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                        style={{ background: `${theme.primary}15` }}
                    >
                        <ArrowLeft size={20} style={{ color: theme.primary }} />
                    </button>
                    <div>
                        <h1 className={`text-lg font-bold ${textPrimary}`}>{moduleTitle}</h1>
                        <p className={`text-xs ${textSecondary}`}>
                            {view === 'sections' && `Section ${currentSectionIndex + 1} of ${sections.length}`}
                            {view === 'quiz' && `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                            {view === 'results' && 'Quiz Complete'}
                        </p>
                    </div>
                </div>

                {/* Section View */}
                {view === 'sections' && currentSection && (
                    <div className="space-y-4">
                        <div
                            className={`p-5 rounded-2xl ${cardBg}`}
                            style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}20` }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <BookOpen size={18} style={{ color: theme.primary }} />
                                <h2 className={`text-base font-semibold ${textPrimary}`}>{currentSection.title}</h2>
                            </div>
                            <div className="space-y-4">
                                {currentSection.content.map((paragraph, idx) => (
                                    <p key={idx} className={`text-sm leading-relaxed ${textSecondary}`}>
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* Progress dots */}
                        <div className="flex justify-center gap-2 py-2">
                            {sections.map((_, idx) => (
                                <div
                                    key={idx}
                                    className="w-2 h-2 rounded-full transition-all"
                                    style={{
                                        background: idx === currentSectionIndex ? theme.primary : `${theme.primary}30`,
                                        boxShadow: idx === currentSectionIndex ? `0 0 8px ${theme.primary}` : 'none'
                                    }}
                                />
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-3">
                            {currentSectionIndex > 0 && (
                                <button
                                    onClick={handlePrevSection}
                                    className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
                                    style={{ background: `${theme.primary}15`, color: theme.primary }}
                                >
                                    <ChevronLeft size={18} /> Previous
                                </button>
                            )}
                            <button
                                onClick={handleNextSection}
                                className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all text-white"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                                    boxShadow: `0 0 20px ${theme.primary}40`
                                }}
                            >
                                {currentSectionIndex < sections.length - 1 ? (
                                    <>Next <ChevronRight size={18} /></>
                                ) : (
                                    <>Take Quiz <HelpCircle size={18} /></>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Quiz View */}
                {view === 'quiz' && currentQuestion && (
                    <div className="space-y-4">
                        <div
                            className={`p-5 rounded-2xl ${cardBg}`}
                            style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}20` }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <HelpCircle size={18} style={{ color: theme.primary }} />
                                <span className={`text-xs font-medium ${textSecondary}`}>Question {currentQuestionIndex + 1}/{questions.length}</span>
                            </div>
                            <h2 className={`text-base font-semibold mb-4 ${textPrimary}`}>{currentQuestion.question}</h2>

                            <div className="space-y-2">
                                {currentQuestion.options.map((option, idx) => {
                                    const isCorrect = idx === currentQuestion.correctIndex;
                                    const isSelected = idx === selectedAnswer;
                                    let bgColor = `${theme.primary}10`;
                                    let borderColor = `${theme.primary}20`;

                                    if (showExplanation) {
                                        if (isCorrect) {
                                            bgColor = `${theme.accent}15`;
                                            borderColor = theme.accent;
                                        } else if (isSelected && !isCorrect) {
                                            bgColor = `${theme.secondary}15`;
                                            borderColor = theme.secondary;
                                        }
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswerSelect(idx)}
                                            disabled={showExplanation}
                                            className={`w-full p-3 rounded-xl text-left text-sm font-medium transition-all flex items-center gap-3 ${showExplanation ? '' : 'hover:scale-[1.02]'}`}
                                            style={{ background: bgColor, border: `1px solid ${borderColor}` }}
                                        >
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold`}
                                                style={{ background: `${theme.primary}20`, color: theme.primary }}
                                            >
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className={textPrimary}>{option}</span>
                                            {showExplanation && isCorrect && (
                                                <CheckCircle2 size={18} style={{ color: theme.accent, marginLeft: 'auto' }} />
                                            )}
                                            {showExplanation && isSelected && !isCorrect && (
                                                <XCircle size={18} style={{ color: theme.secondary, marginLeft: 'auto' }} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explanation */}
                            {showExplanation && (
                                <div
                                    className="mt-4 p-3 rounded-xl text-sm"
                                    style={{ background: `${theme.accent}10`, borderLeft: `3px solid ${theme.accent}` }}
                                >
                                    <p className={textPrimary}>{currentQuestion.explanation}</p>
                                </div>
                            )}
                        </div>

                        {/* Next button */}
                        {showExplanation && (
                            <button
                                onClick={handleNextQuestion}
                                className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all text-white"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                                    boxShadow: `0 0 20px ${theme.primary}40`
                                }}
                            >
                                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                )}

                {/* Results View */}
                {view === 'results' && (
                    <div className="space-y-4 text-center">
                        <div
                            className={`p-6 rounded-2xl ${cardBg}`}
                            style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}20` }}
                        >
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                                style={{ background: `linear-gradient(135deg, ${score >= 70 ? theme.accent : theme.secondary}30, ${score >= 70 ? theme.accent : theme.secondary}10)` }}
                            >
                                <Trophy size={36} style={{ color: score >= 70 ? theme.accent : theme.secondary }} />
                            </div>
                            <h2 className={`text-xl font-bold mb-2 ${textPrimary}`}>
                                {score >= 70 ? 'Great Job!' : 'Keep Practicing!'}
                            </h2>
                            <p className={`text-3xl font-bold font-mono mb-2`} style={{ color: score >= 70 ? theme.accent : theme.secondary }}>
                                {score}%
                            </p>
                            <p className={`text-sm ${textSecondary}`}>
                                You got {answers.filter((a, i) => a === questions[i]?.correctIndex).length} out of {questions.length} correct
                            </p>
                        </div>

                        <div className="flex gap-3">
                            {score < 70 && (
                                <button
                                    onClick={handleRetry}
                                    className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
                                    style={{ background: `${theme.primary}15`, color: theme.primary }}
                                >
                                    <RotateCcw size={18} /> Retry Quiz
                                </button>
                            )}
                            <button
                                onClick={handleFinish}
                                className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all text-white"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                                    boxShadow: `0 0 20px ${theme.primary}40`
                                }}
                            >
                                {score >= 70 ? 'Complete Module' : 'Continue Anyway'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default LearnForex;
