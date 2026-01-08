import React, { useState, useEffect } from 'react';
import { X, Save, Calculator } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Trade, TradeStatus, TradingSession } from '../types';

interface TradeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getInitialFormData = (): Partial<Trade> => ({
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  symbol: 'XAUUSD',
  session: 'New York',
  side: 'LONG',
  status: TradeStatus.OPEN,
  lots: 1.0,
  entryPrice: 0,
  exitPrice: 0,
  pnl: 0,
  pips: 0,
  rating: 3,
  notes: '',
  tags: []
});

const TradeFormModal: React.FC<TradeFormModalProps> = ({ isOpen, onClose }) => {
  const { addTrade } = useStore();

  const [formData, setFormData] = useState<Partial<Trade>>(getInitialFormData());

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTrade: Trade = {
      id: Date.now().toString(),
      symbol: formData.symbol?.toUpperCase() || 'XAUUSD',
      // Simple mapping for TV symbol, usually requires more logic or user input
      tradingViewSymbol: formData.symbol?.toUpperCase() === 'XAUUSD' ? 'OANDA:XAUUSD' : `FX:${formData.symbol?.toUpperCase()}`,
      date: formData.date || '',
      time: formData.time || '',
      session: formData.session as TradingSession,
      side: formData.side as 'LONG' | 'SHORT',
      status: formData.status as TradeStatus,
      pnl: Number(formData.pnl) || 0,
      entryPrice: Number(formData.entryPrice) || 0,
      exitPrice: Number(formData.exitPrice) || 0,
      lots: Number(formData.lots) || 0,
      pips: Number(formData.pips) || 0,
      rating: Number(formData.rating) || 3,
      strategyId: '',
      tags: [],
      notes: formData.notes || ''
    };

    addTrade(newTrade);
    setFormData(getInitialFormData());
    onClose();
  };

  // Simple helper to auto-calc PnL/Pips if prices exist (rough estimate for gold/forex)
  const calculateMetrics = () => {
    const entry = Number(formData.entryPrice);
    const exit = Number(formData.exitPrice);
    const lots = Number(formData.lots);
    
    if (!entry || !exit) return;

    let pipsDiff = 0;
    if (formData.symbol?.toUpperCase().includes('JPY')) {
        pipsDiff = (exit - entry) * 100;
    } else if (formData.symbol?.toUpperCase() === 'XAUUSD') {
        pipsDiff = (exit - entry) * 10; 
    } else {
        pipsDiff = (exit - entry) * 10000;
    }

    if (formData.side === 'SHORT') pipsDiff = -pipsDiff;

    // Very rough PnL calc: Pips * Lots * 10 (Standard lot value approx)
    // This is just a helper, user should override
    const estPnl = pipsDiff * lots * 10; 

    setFormData(prev => ({
        ...prev,
        pips: parseFloat(pipsDiff.toFixed(1)),
        pnl: parseFloat(estPnl.toFixed(2)),
        status: estPnl > 0 ? TradeStatus.WIN : estPnl < 0 ? TradeStatus.LOSS : TradeStatus.BE
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Log New Trade</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* Row 1 */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Date</label>
                    <input 
                        type="date" 
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Time</label>
                    <input 
                        type="time" 
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none"
                        value={formData.time}
                        onChange={e => setFormData({...formData, time: e.target.value})}
                    />
                </div>

                {/* Row 2 */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Symbol</label>
                    <input 
                        type="text" 
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none uppercase"
                        placeholder="XAUUSD"
                        value={formData.symbol}
                        onChange={e => setFormData({...formData, symbol: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Session</label>
                    <select 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none"
                        value={formData.session}
                        onChange={e => setFormData({...formData, session: e.target.value as TradingSession})}
                    >
                        <option value="Asian">Asian</option>
                        <option value="London">London</option>
                        <option value="New York">New York</option>
                        <option value="Overlap">Overlap</option>
                    </select>
                </div>

                {/* Row 3 */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Direction</label>
                    <div className="flex rounded-lg overflow-hidden border border-slate-800">
                        <button 
                            type="button"
                            className={`flex-1 py-2 text-sm font-bold transition-colors ${formData.side === 'LONG' ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'}`}
                            onClick={() => setFormData({...formData, side: 'LONG'})}
                        >
                            LONG
                        </button>
                        <div className="w-px bg-slate-800"></div>
                        <button 
                            type="button"
                            className={`flex-1 py-2 text-sm font-bold transition-colors ${formData.side === 'SHORT' ? 'bg-rose-500 text-white' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'}`}
                            onClick={() => setFormData({...formData, side: 'SHORT'})}
                        >
                            SHORT
                        </button>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status</label>
                    <select 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as TradeStatus})}
                    >
                        <option value={TradeStatus.OPEN}>OPEN</option>
                        <option value={TradeStatus.WIN}>WIN</option>
                        <option value={TradeStatus.LOSS}>LOSS</option>
                        <option value={TradeStatus.BE}>BREAK EVEN</option>
                    </select>
                </div>

                {/* Row 4 - Pricing */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Entry Price</label>
                    <input 
                        type="number" 
                        step="0.001"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none font-mono"
                        value={formData.entryPrice || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData({...formData, entryPrice: val === '' ? 0 : parseFloat(val) || 0});
                        }}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Exit Price</label>
                    <input 
                        type="number" 
                        step="0.001"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none font-mono"
                        value={formData.exitPrice || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData({...formData, exitPrice: val === '' ? 0 : parseFloat(val) || 0});
                        }}
                    />
                </div>
                
                {/* Row 5 - Size & Result */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Lot Size</label>
                    <input 
                        type="number" 
                        step="0.01"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none font-mono"
                        value={formData.lots || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData({...formData, lots: val === '' ? 0 : parseFloat(val) || 0});
                        }}
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                         <label className="text-xs font-bold text-slate-500 uppercase block">P&L ($)</label>
                         <button type="button" onClick={calculateMetrics} className="text-[10px] text-brand-500 hover:underline flex items-center gap-1">
                            <Calculator size={10} /> Auto-Calc
                         </button>
                    </div>
                    <input 
                        type="number" 
                        step="0.01"
                        className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-brand-500 outline-none font-mono font-bold ${Number(formData.pnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                        value={formData.pnl || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData({...formData, pnl: val === '' ? 0 : parseFloat(val) || 0});
                        }}
                    />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Quick Notes</label>
                <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-brand-500 outline-none h-24 resize-none"
                    placeholder="Why did you take this trade?"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                ></textarea>
            </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSubmit}
                className="bg-brand-500 hover:bg-brand-600 text-slate-900 px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
            >
                <Save size={16} /> Save Trade
            </button>
        </div>
      </div>
    </div>
  );
};

export default TradeFormModal;