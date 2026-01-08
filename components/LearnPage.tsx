import React, { useState, useEffect } from 'react';
import { Gamepad2, BookOpen, ChevronRight, TrendingUp, BarChart3, LineChart, Target, CheckCircle2, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import PredictGame from './PredictGame';
import LearnForex from './LearnForex';

interface ModuleProgress {
    completed: boolean;
    score: number;
    sectionsRead: number;
}

const MODULES = [
    {
        id: 'forex-basics',
        title: 'Forex Basics',
        description: 'Currency pairs, pips, lots & leverage',
        icon: TrendingUp,
        totalSections: 5,
    },
    {
        id: 'candlestick-basics',
        title: 'Candlestick Basics',
        description: 'Patterns, anatomy & price action',
        icon: BarChart3,
        totalSections: 5,
    },
    {
        id: 'trend-htf',
        title: 'Trend & HTF Analysis',
        description: 'Trends, support/resistance & timeframes',
        icon: LineChart,
        totalSections: 5,
    },
    {
        id: 'daytrading-basics',
        title: 'Daytrading Basics',
        description: 'Top-down analysis & confluence',
        icon: Target,
        totalSections: 5,
    },
];

const LearnPage: React.FC = () => {
    const { theme, isLightTheme } = useTheme();
    const [isGameOpen, setIsGameOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>({});

    // Load progress from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('pips_learn_progress');
        if (saved) {
            setModuleProgress(JSON.parse(saved));
        }
    }, []);

    // Save progress to localStorage
    const saveProgress = (moduleId: string, progress: ModuleProgress) => {
        const updated = { ...moduleProgress, [moduleId]: progress };
        setModuleProgress(updated);
        localStorage.setItem('pips_learn_progress', JSON.stringify(updated));
    };

    const handleModuleComplete = (moduleId: string, score: number) => {
        saveProgress(moduleId, {
            completed: true,
            score,
            sectionsRead: MODULES.find(m => m.id === moduleId)?.totalSections || 0,
        });
        setSelectedModule(null);
    };

    const handleSectionRead = (moduleId: string, sectionIndex: number) => {
        const current = moduleProgress[moduleId] || { completed: false, score: 0, sectionsRead: 0 };
        if (sectionIndex + 1 > current.sectionsRead) {
            saveProgress(moduleId, { ...current, sectionsRead: sectionIndex + 1 });
        }
    };

    // Theme-aware colors
    const textPrimary = isLightTheme ? 'text-slate-800' : 'text-white';
    const textSecondary = isLightTheme ? 'text-slate-600' : 'text-slate-400';
    const cardBg = isLightTheme ? 'bg-white/80 border border-slate-200' : '';

    // If a module is selected, show the LearnForex component
    if (selectedModule) {
        const module = MODULES.find(m => m.id === selectedModule);
        const progress = moduleProgress[selectedModule];
        return (
            <LearnForex
                moduleId={selectedModule}
                moduleTitle={module?.title || ''}
                onBack={() => setSelectedModule(null)}
                onComplete={(score) => handleModuleComplete(selectedModule, score)}
                onSectionRead={(idx) => handleSectionRead(selectedModule, idx)}
                initialSectionsRead={progress?.sectionsRead || 0}
            />
        );
    }

    return (
        <div
            className="flex-1 h-full overflow-y-auto custom-scrollbar pb-8"
            style={{ background: theme.bgGradient, backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}
        >
            <PredictGame isOpen={isGameOpen} onClose={() => setIsGameOpen(false)} />

            <div className="px-4 pt-6 pb-20 max-w-lg mx-auto">



                {/* Header */}
                <div className="mb-6">
                    <h1 className={`text-2xl font-bold ${textPrimary}`}>Learn</h1>
                    <p className={`text-sm ${textSecondary}`}>Improve your trading skills</p>
                </div>

                {/* Predict the Chart Card */}
                <button
                    onClick={() => setIsGameOpen(true)}
                    className={`w-full p-4 mb-6 rounded-2xl card-hover text-left ${cardBg}`}
                    style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}15` }}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${theme.primary}30, ${theme.secondary}30)` }}
                        >
                            <Gamepad2 size={28} style={{ color: theme.primary }} />
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-base font-bold ${textPrimary}`}>Predict the Chart</h3>
                            <p className={`text-xs ${textSecondary}`}>Test your pattern recognition skills</p>
                        </div>
                        <ChevronRight size={20} className={textSecondary} />
                    </div>
                </button>

                {/* Learn Forex Section */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen size={18} style={{ color: theme.primary }} />
                        <h2 className={`text-lg font-semibold ${textPrimary}`}>Learn Forex</h2>
                    </div>

                    <div className="space-y-3">
                        {MODULES.map((module) => {
                            const progress = moduleProgress[module.id];
                            const isCompleted = progress?.completed;
                            const sectionsRead = progress?.sectionsRead || 0;
                            const progressPercent = (sectionsRead / module.totalSections) * 100;
                            const Icon = module.icon;

                            return (
                                <button
                                    key={module.id}
                                    onClick={() => setSelectedModule(module.id)}
                                    className={`w-full p-4 rounded-2xl text-left transition-all ${cardBg} card-hover`}
                                    style={{
                                        background: isLightTheme ? 'white' : theme.cardBg,
                                        border: `1px solid ${isCompleted ? theme.accent : theme.primary}${isCompleted ? '40' : '15'}`
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                                            style={{
                                                background: isCompleted
                                                    ? `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}10)`
                                                    : `linear-gradient(135deg, ${theme.primary}20, ${theme.primary}05)`
                                            }}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle2 size={24} style={{ color: theme.accent }} />
                                            ) : (
                                                <Icon size={22} style={{ color: theme.primary }} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`text-sm font-semibold ${textPrimary}`}>{module.title}</h3>
                                                {isCompleted && (
                                                    <span
                                                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                                        style={{ background: `${theme.accent}20`, color: theme.accent }}
                                                    >
                                                        {progress?.score}%
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-xs ${textSecondary} truncate`}>{module.description}</p>

                                            {/* Progress bar */}
                                            {sectionsRead > 0 && !isCompleted && (
                                                <div className="mt-2 h-1 rounded-full bg-slate-700/30 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${progressPercent}%`,
                                                            background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryLight})`
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight size={18} className={textSecondary} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LearnPage;
