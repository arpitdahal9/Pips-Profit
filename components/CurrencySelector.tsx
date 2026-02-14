import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';

const CURRENCY_SYMBOLS = ['$', '£', '€', '¥', '₹', '₽', '₪', '₩', '₫', '฿', '₺', '₴', 'R', '₵', 'Sh'];

interface CurrencySelectorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {label && <label className="text-xs text-slate-500 block mb-1">{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-[42px] bg-slate-950 border border-slate-700 rounded-lg px-3 flex items-center justify-between text-white text-sm hover:border-slate-600 transition-colors focus:outline-none"
            >
                <span className="font-mono">{value}</span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                    {CURRENCY_SYMBOLS.map((sym) => (
                        <button
                            key={sym}
                            type="button"
                            onClick={() => {
                                onChange(sym);
                                setIsOpen(false);
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition-colors text-white border-b border-slate-800 last:border-0"
                        >
                            <span className="font-mono text-base">{sym}</span>
                            {value === sym ? (
                                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center">
                                    <CheckCircle2 size={14} className="text-brand-500" />
                                </div>
                            ) : (
                                <div className="w-5 h-5 rounded-full border border-slate-700" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CurrencySelector;
