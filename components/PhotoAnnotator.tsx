import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Clock, TrendingUp, TrendingDown, Minus, BookOpen, Type, RotateCcw, Zap } from 'lucide-react';
import { Strategy } from '../types';

interface PhotoAnnotatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (annotatedImageDataUrl: string) => void;
    strategies: Strategy[];
    theme: any;
    isLightTheme?: boolean;
    mode?: 'trade' | 'setup';
    initialImageUrl?: string;
    viewOnly?: boolean;
}

type TrendType = 'bullish' | 'bearish' | 'ranging' | 'poi' | 'entry' | 'sl' | 'tp' | null;

interface Annotation {
    time: string;
    trend: TrendType;
    strategy: string;
    caption: string;
    timeframe: string;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 900;

const PhotoAnnotator: React.FC<PhotoAnnotatorProps> = ({
    isOpen,
    onClose,
    onSave,
    strategies,
    theme,
    isLightTheme = false,
    mode = 'trade',
    initialImageUrl,
    viewOnly = false,
}) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [annotation, setAnnotation] = useState<Annotation>({
        time: '',
        trend: null,
        strategy: '',
        caption: '',
        timeframe: '',
    });
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showStrategyPicker, setShowStrategyPicker] = useState(false);
    const [showTimeframePicker, setShowTimeframePicker] = useState(false);
    const [customMarkers, setCustomMarkers] = useState<string[]>([]);
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customInput, setCustomInput] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Time presets
    const timePresets = [
        'Asian Open', 'Asian Session', 'Pre-London',
        'London Open', 'London Session', 'London/NY Overlap',
        'NY Open', 'NY Session', 'NY Close'
    ];

    const timeframePresets = ['1m', '5m', '15m', '30m', '1h', '4h', 'D1', 'W1'];

    const contentRef = useRef<HTMLDivElement>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setImageFile(null);
            setImagePreviewUrl(null);
            setError(null);
            setAnnotation({ time: '', trend: null, strategy: '', caption: '', timeframe: '' });
            setShowTimePicker(false);
            setShowStrategyPicker(false);
            setShowTimeframePicker(false);
            setIsAddingCustom(false);
            setCustomInput('');
        } else {
            // Scroll to top when opening
            if (contentRef.current) {
                contentRef.current.scrollTop = 0;
            }
            if (initialImageUrl) {
                setImagePreviewUrl(initialImageUrl);
            }
        }
    }, [isOpen, initialImageUrl]);

    // Clean up object URLs
    useEffect(() => {
        return () => {
            if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Quick size check (allow up to 20MB for processing, we'll compress it)
        if (file.size > 20 * 1024 * 1024) {
            setError('Image is too large. Please select an image under 20MB.');
            return;
        }

        setError(null);
        setImageFile(file);

        // Create preview URL (using blob URL is memory efficient)
        const previewUrl = URL.createObjectURL(file);
        setImagePreviewUrl(previewUrl);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleAddCustomMarker = () => {
        if (customInput.trim()) {
            setCustomMarkers([...customMarkers, customInput.trim()]);
            setAnnotation({ ...annotation, strategy: customInput.trim() });
            setCustomInput('');
            setIsAddingCustom(false);
        }
    };

    const handleSave = useCallback(async () => {
        if (!imagePreviewUrl || !canvasRef.current) return;

        setIsProcessing(true);
        setError(null);

        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { alpha: false });
            if (!ctx) throw new Error('Could not get canvas context');

            // Set canvas size
            canvas.width = CANVAS_WIDTH;
            canvas.height = CANVAS_HEIGHT;

            // Load image
            const img = new Image();
            const imageLoadPromise = new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Image load timeout')), 15000);
                img.onload = () => {
                    clearTimeout(timeout);
                    resolve();
                };
                img.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Failed to load image'));
                };
            });

            // Use blob URL for loading (more memory efficient than data URL)
            img.src = imagePreviewUrl || (imageFile ? URL.createObjectURL(imageFile) : '');
            if (!img.src) throw new Error('No image to process');
            await imageLoadPromise;

            // Calculate scaling to fit canvas while maintaining aspect ratio
            const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const offsetX = (CANVAS_WIDTH - scaledWidth) / 2;
            const offsetY = (CANVAS_HEIGHT - scaledHeight) / 2;

            // Fill background (black for letterboxing)
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Draw scaled image
            ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

            // Check if there are any annotations to draw
            const hasAnnotations = annotation.time || annotation.trend || annotation.strategy || annotation.caption || annotation.timeframe;

            if (hasAnnotations) {
                // Draw annotation bar at bottom
                const barHeight = 80;
                const barY = CANVAS_HEIGHT - barHeight;

                // Semi-transparent background
                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                ctx.fillRect(0, barY, CANVAS_WIDTH, barHeight);

                // Draw top border
                ctx.strokeStyle = theme.primary || '#8b5cf6';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, barY);
                ctx.lineTo(CANVAS_WIDTH, barY);
                ctx.stroke();

                // Draw annotations
                let xPos = 20;
                const badgeY = barY + 20;
                const captionY = barY + 55;

                // Helper to draw badge
                const drawBadge = (text: string, bgColor: string, textColor: string = '#fff') => {
                    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
                    const textWidth = ctx.measureText(text).width;
                    const badgeWidth = textWidth + 24;
                    const badgeHeight = 28;

                    // Badge background
                    ctx.fillStyle = bgColor;
                    if (ctx.roundRect) {
                        ctx.beginPath();
                        ctx.roundRect(xPos, badgeY, badgeWidth, badgeHeight, 6);
                        ctx.fill();
                    } else {
                        // Fallback for environments where roundRect is not supported
                        ctx.fillRect(xPos, badgeY, badgeWidth, badgeHeight);
                    }

                    // Badge text
                    ctx.fillStyle = textColor;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'left';
                    ctx.fillText(text, xPos + 12, badgeY + badgeHeight / 2 + 1);

                    xPos += badgeWidth + 10;
                };

                // Time badge
                if (annotation.time) {
                    drawBadge(`🕐 ${annotation.time}`, 'rgba(59, 130, 246, 0.9)');
                }

                // Trend badge
                if (annotation.trend) {
                    const trendColors = {
                        bullish: 'rgba(34, 197, 94, 0.9)',
                        bearish: 'rgba(239, 68, 68, 0.9)',
                        ranging: 'rgba(234, 179, 8, 0.9)',
                    };
                    const trendEmojis = {
                        bullish: '📈',
                        bearish: '📉',
                        ranging: '↔️',
                        poi: '📍',
                        entry: '🎯',
                        sl: '🛑',
                        tp: '🏁',
                    };
                    const trendLabels = {
                        bullish: 'Bullish',
                        bearish: 'Bearish',
                        ranging: 'Ranging',
                        poi: 'POI',
                        entry: 'Entry',
                        sl: 'SL',
                        tp: 'TP',
                    };
                    drawBadge(`${trendEmojis[annotation.trend]} ${trendLabels[annotation.trend]}`, trendColors[annotation.trend] || 'rgba(100, 116, 139, 0.9)');
                }

                // Timeframe badge
                if (annotation.timeframe) {
                    drawBadge(`⏳ ${annotation.timeframe}`, 'rgba(14, 165, 233, 0.9)');
                }

                // Strategy badge
                if (annotation.strategy) {
                    drawBadge(`📋 ${annotation.strategy}`, theme.primary || 'rgba(139, 92, 246, 0.9)');
                }

                // Caption text
                if (annotation.caption) {
                    ctx.font = '14px Inter, system-ui, sans-serif';
                    ctx.fillStyle = 'rgba(226, 232, 240, 0.95)';
                    ctx.textBaseline = 'middle';

                    // Truncate if too long
                    let captionText = annotation.caption;
                    const maxWidth = CANVAS_WIDTH - 40;
                    while (ctx.measureText(captionText).width > maxWidth && captionText.length > 0) {
                        captionText = captionText.slice(0, -1);
                    }
                    if (captionText.length < annotation.caption.length) {
                        captionText = captionText.slice(0, -3) + '...';
                    }

                    ctx.fillText(captionText, 25, captionY);
                }
            }

            // Convert to data URL with compression
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);

            // Clean up
            canvas.width = 0;
            canvas.height = 0;

            onSave(dataUrl);
            onClose();
        } catch (err) {
            console.error('Failed to process image:', err);
            setError(err instanceof Error ? err.message : 'Failed to process image');
        } finally {
            setIsProcessing(false);
        }
    }, [imageFile, imagePreviewUrl, annotation, theme, onSave, onClose]);

    const resetAnnotations = () => {
        setAnnotation({ time: '', trend: null, strategy: '', caption: '', timeframe: '' });
    };

    if (!isOpen) return null;

    const textPrimary = isLightTheme ? 'text-slate-900' : 'text-white';
    const textSecondary = isLightTheme ? 'text-slate-600' : 'text-slate-400';
    const bgPrimary = isLightTheme ? 'bg-white' : 'bg-slate-900';
    const bgSecondary = isLightTheme ? 'bg-slate-100' : 'bg-slate-800';
    const borderColor = isLightTheme ? 'border-slate-200' : 'border-slate-700';

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${borderColor} ${bgPrimary}`}>
                <button
                    onClick={onClose}
                    className={`p-2 rounded-lg ${textSecondary} hover:${textPrimary} transition-colors`}
                >
                    <X size={24} />
                </button>
                <h2 className={`text-lg font-bold ${textPrimary}`}>{viewOnly ? 'View Screenshot' : 'Annotate Screenshot'}</h2>
                <button
                    onClick={handleSave}
                    disabled={(!imageFile && !imagePreviewUrl) || isProcessing}
                    className={`p-2 rounded-lg transition-colors ${(!imageFile && !imagePreviewUrl) || isProcessing
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-emerald-500 hover:text-emerald-400'
                        }`}
                >
                    {isProcessing ? (
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Check size={24} />
                    )}
                </button>
            </div>

            {/* Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto pb-32">
                {/* Image Preview / Upload Area */}
                <div className="p-4">
                    {imagePreviewUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-700">
                            <img
                                src={imagePreviewUrl}
                                alt="Selected"
                                className="w-full h-64 object-contain bg-slate-900 cursor-pointer"
                                onClick={() => setIsFullscreen(true)}
                            />
                            <button
                                onClick={() => {
                                    if (imagePreviewUrl.startsWith('blob:')) {
                                        URL.revokeObjectURL(imagePreviewUrl);
                                    }
                                    setImageFile(null);
                                    setImagePreviewUrl(null);
                                }}
                                className="absolute top-2 right-2 p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg text-white transition-colors"
                            >
                                <X size={18} />
                            </button>

                            {/* Annotation preview overlay */}
                            {(annotation.time || annotation.trend || annotation.strategy || annotation.caption || annotation.timeframe) && (
                                <div className="absolute bottom-0 left-0 right-0 bg-slate-900/85 px-3 py-2 border-t-2" style={{ borderColor: theme.primary }}>
                                    <div className="flex flex-wrap gap-2 mb-1">
                                        {annotation.time && (
                                            <span className="px-2 py-0.5 bg-blue-500/90 text-white text-xs rounded-md font-medium">
                                                🕐 {annotation.time}
                                            </span>
                                        )}
                                        {annotation.timeframe && (
                                            <span className="px-2 py-0.5 bg-sky-500/90 text-white text-xs rounded-md font-medium">
                                                ⏳ {annotation.timeframe}
                                            </span>
                                        )}
                                        {annotation.trend && (
                                            <span className={`px-2 py-0.5 text-white text-xs rounded-md font-medium ${['bullish', 'entry', 'tp'].includes(annotation.trend) ? 'bg-green-500/90' :
                                                ['bearish', 'sl'].includes(annotation.trend) ? 'bg-red-500/90' : 'bg-yellow-500/90'
                                                }`}>
                                                {annotation.trend === 'bullish' ? '📈 Bullish' :
                                                    annotation.trend === 'bearish' ? '📉 Bearish' :
                                                        annotation.trend === 'ranging' ? '↔️ Ranging' :
                                                            annotation.trend === 'poi' ? '📍 POI' :
                                                                annotation.trend === 'entry' ? '🎯 Entry' :
                                                                    annotation.trend === 'sl' ? '🛑 SL' : '🏁 TP'}
                                            </span>
                                        )}
                                        {annotation.strategy && (
                                            <span className="px-2 py-0.5 text-white text-xs rounded-md font-medium" style={{ backgroundColor: theme.primary }}>
                                                📋 {annotation.strategy}
                                            </span>
                                        )}
                                    </div>
                                    {annotation.caption && (
                                        <p className="text-slate-300 text-xs truncate">{annotation.caption}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-80 border-2 border-dashed border-slate-600 hover:border-slate-500 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors"
                        >
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${theme.primary}20` }}
                            >
                                <Zap size={32} style={{ color: theme.primary }} />
                            </div>
                            <div className="text-center px-6">
                                <p className={`font-medium ${textPrimary}`}>Tap to select screenshot</p>
                                <p className={`text-sm mt-1 ${textSecondary}`}>High-res images will be optimized for better performance</p>
                            </div>
                        </button>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-4 mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Annotation Controls */}
                {(imageFile || imagePreviewUrl) && (
                    <div className="px-4 pb-32 space-y-6">
                        {/* Quick Actions Header */}
                        <div className="flex items-center justify-between">
                            <h3 className={`text-sm font-bold uppercase ${textSecondary}`}>Add Annotations</h3>
                            <button
                                onClick={resetAnnotations}
                                className={`flex items-center gap-1 text-xs ${textSecondary} hover:${textPrimary} transition-colors`}
                            >
                                <RotateCcw size={12} />
                                Reset
                            </button>
                        </div>

                        {/* Mode-based UI */}
                        {mode === 'setup' ? (
                            <>
                                {/* Setup Tags (Checklist mode) */}
                                <div>
                                    <label className={`text-xs font-medium ${textSecondary} mb-2 block`}>
                                        <Zap size={12} className="inline mr-1" />
                                        Setup Markers
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'poi', label: '📍 POI', color: 'bg-slate-700' },
                                            { id: 'entry', label: '🎯 Entry', color: 'bg-green-600' },
                                            { id: 'sl', label: '🛑 Stop Loss', color: 'bg-red-600' },
                                            { id: 'tp', label: '🏁 Take Profit', color: 'bg-blue-600' },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setAnnotation({ ...annotation, trend: annotation.trend === item.id as any ? null : item.id as any })}
                                                className={`py-3 rounded-lg text-xs font-bold shadow-sm transition-all ${annotation.trend === item.id
                                                    ? `${item.color} text-white ring-2 ring-white/20`
                                                    : `${bgSecondary} ${textSecondary} hover:${textPrimary}`
                                                    }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}

                                        {/* Custom Markers Display */}
                                        {customMarkers.map((marker, idx) => (
                                            <button
                                                key={`custom-${idx}`}
                                                onClick={() => setAnnotation({ ...annotation, strategy: annotation.strategy === marker ? '' : marker })}
                                                className={`py-3 rounded-lg text-xs font-bold shadow-sm transition-all truncate px-2 ${annotation.strategy === marker
                                                    ? 'bg-slate-600 text-white ring-2 ring-white/20'
                                                    : `${bgSecondary} ${textSecondary} hover:${textPrimary}`
                                                    }`}
                                            >
                                                ✨ {marker}
                                            </button>
                                        ))}

                                        {/* Add Custom Button */}
                                        {!isAddingCustom ? (
                                            <button
                                                onClick={() => setIsAddingCustom(true)}
                                                className={`py-3 rounded-lg text-xs font-bold border border-dashed ${borderColor} ${textSecondary} hover:${textPrimary} hover:border-slate-500 transition-all`}
                                            >
                                                + Custom
                                            </button>
                                        ) : (
                                            <div className="flex gap-2 col-span-2 bg-slate-900 p-2 rounded-xl animate-in zoom-in-95">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={customInput}
                                                    onChange={(e) => setCustomInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomMarker()}
                                                    placeholder="e.g. BOS"
                                                    className="flex-1 bg-transparent border-none text-white text-xs outline-none px-2"
                                                />
                                                <button
                                                    onClick={handleAddCustomMarker}
                                                    className="p-2 bg-emerald-500 rounded-lg text-white"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setIsAddingCustom(false)}
                                                    className="p-2 bg-slate-800 rounded-lg text-slate-400"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Timeframe Selection */}
                                <div>
                                    <label className={`text-xs font-medium ${textSecondary} mb-3 block`}>
                                        <Clock size={12} className="inline mr-1" />
                                        Timeframe
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {timeframePresets.map((tf) => (
                                            <button
                                                key={tf}
                                                onClick={() => setAnnotation({ ...annotation, timeframe: annotation.timeframe === tf ? '' : tf })}
                                                className={`min-w-[45px] py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all ${annotation.timeframe === tf
                                                    ? 'bg-sky-500 text-white shadow-sky-500/20'
                                                    : `${bgSecondary} ${textSecondary}`
                                                    }`}
                                            >
                                                {tf}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Trade Tags (Log mode) */}
                                {/* Time Selection */}
                                <div>
                                    <label className={`text-xs font-medium ${textSecondary} mb-2 block`}>
                                        <Clock size={12} className="inline mr-1" />
                                        Time / Session
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {timePresets.slice(0, 4).map((preset) => (
                                            <button
                                                key={preset}
                                                onClick={() => setAnnotation({ ...annotation, time: annotation.time === preset ? '' : preset })}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${annotation.time === preset
                                                    ? 'bg-blue-500 text-white'
                                                    : `${bgSecondary} ${textSecondary}`
                                                    }`}
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setShowTimePicker(!showTimePicker)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${bgSecondary} ${textSecondary}`}
                                        >
                                            More...
                                        </button>
                                    </div>
                                    {showTimePicker && (
                                        <div className="mt-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
                                            {timePresets.slice(4).map((preset) => (
                                                <button
                                                    key={preset}
                                                    onClick={() => setAnnotation({ ...annotation, time: annotation.time === preset ? '' : preset })}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${annotation.time === preset
                                                        ? 'bg-blue-500 text-white'
                                                        : `${bgSecondary} ${textSecondary}`
                                                        }`}
                                                >
                                                    {preset}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Trend Selection */}
                                <div>
                                    <label className={`text-xs font-medium ${textSecondary} mb-2 block`}>
                                        <TrendingUp size={12} className="inline mr-1" />
                                        Market Trend
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setAnnotation({ ...annotation, trend: annotation.trend === 'bullish' ? null : 'bullish' })}
                                            className={`py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${annotation.trend === 'bullish'
                                                ? 'bg-green-500 text-white'
                                                : `${bgSecondary} text-green-500`
                                                }`}
                                        >
                                            <TrendingUp size={14} />
                                            Bullish
                                        </button>
                                        <button
                                            onClick={() => setAnnotation({ ...annotation, trend: annotation.trend === 'bearish' ? null : 'bearish' })}
                                            className={`py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${annotation.trend === 'bearish'
                                                ? 'bg-red-500 text-white'
                                                : `${bgSecondary} text-red-500`
                                                }`}
                                        >
                                            <TrendingDown size={14} />
                                            Bearish
                                        </button>
                                        <button
                                            onClick={() => setAnnotation({ ...annotation, trend: annotation.trend === 'ranging' ? null : 'ranging' })}
                                            className={`py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${annotation.trend === 'ranging'
                                                ? 'bg-yellow-500 text-white'
                                                : `${bgSecondary} text-yellow-500`
                                                }`}
                                        >
                                            <Minus size={14} />
                                            Ranging
                                        </button>
                                    </div>
                                </div>

                                {/* Strategy Selection */}
                                {strategies.length > 0 && (
                                    <div>
                                        <label className={`text-xs font-medium ${textSecondary} mb-2 block`}>
                                            <BookOpen size={12} className="inline mr-1" />
                                            Strategy
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {strategies.slice(0, showStrategyPicker ? strategies.length : 3).map((strat) => (
                                                <button
                                                    key={strat.id}
                                                    onClick={() => setAnnotation({ ...annotation, strategy: annotation.strategy === strat.title ? '' : strat.title })}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${annotation.strategy === strat.title
                                                        ? 'text-white'
                                                        : `${bgSecondary} ${textSecondary}`
                                                        }`}
                                                    style={annotation.strategy === strat.title ? { backgroundColor: theme.primary } : {}}
                                                >
                                                    {strat.title}
                                                </button>
                                            ))}
                                            {strategies.length > 3 && !showStrategyPicker && (
                                                <button
                                                    onClick={() => setShowStrategyPicker(true)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${bgSecondary} ${textSecondary}`}
                                                >
                                                    +{strategies.length - 3} more
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Caption Input */}
                        <div className="bg-slate-900/40 p-1.5 rounded-2xl border border-slate-800">
                            <label className={`text-xs font-bold uppercase ${textSecondary} mb-2 px-2 pt-1 block`}>
                                <Type size={12} className="inline mr-1" />
                                Caption
                            </label>
                            <input
                                type="text"
                                value={annotation.caption}
                                onChange={(e) => setAnnotation({ ...annotation, caption: e.target.value })}
                                placeholder="Tap to add note..."
                                maxLength={100}
                                className={`w-full px-4 py-4 rounded-xl border ${borderColor} ${bgSecondary} ${textPrimary} text-sm font-medium focus:outline-none focus:ring-1 focus:ring-white/20 shadow-inner`}
                                style={{ focusRingColor: theme.primary }}
                            />
                            <div className="flex justify-between px-2 pt-1.5 pb-1">
                                <p className={`text-[10px] ${textSecondary}`}>{annotation.caption.length}/100 characters</p>
                                <p className={`text-[10px] ${textSecondary}`}>Visibly saved on image</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden Elements */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Fullscreen Overlay */}
            {isFullscreen && imagePreviewUrl && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-200">
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all z-10"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={imagePreviewUrl}
                        alt="Fullscreen"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )}
        </div>
    );
};

export default PhotoAnnotator;
