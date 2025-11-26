import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, CheckCircle2, GripVertical, Save } from 'lucide-react';
import { ChecklistItem, Strategy } from '../types';

const StrategyView = () => {
  const { strategies, addStrategy, deleteStrategy } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  
  const [newStrategy, setNewStrategy] = useState<{title: string, symbol: string, items: {text: string}[]}>({
    title: '',
    symbol: 'XAUUSD',
    items: [{ text: '' }]
  });

  const handleAddItem = () => {
    setNewStrategy(prev => ({
      ...prev,
      items: [...prev.items, { text: '' }]
    }));
  };

  const handleItemChange = (index: number, text: string) => {
    const newItems = [...newStrategy.items];
    newItems[index].text = text;
    setNewStrategy(prev => ({ ...prev, items: newItems }));
  };

  const handleRemoveItem = (index: number) => {
    setNewStrategy(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!newStrategy.title || !newStrategy.symbol) return;

    const strategy: Strategy = {
      id: Date.now().toString(),
      title: newStrategy.title,
      symbol: newStrategy.symbol.toUpperCase(),
      items: newStrategy.items.filter(i => i.text.trim() !== '').map((i, idx) => ({
        id: `chk_${Date.now()}_${idx}`,
        text: i.text,
        checked: false
      }))
    };

    addStrategy(strategy);
    setIsCreating(false);
    setNewStrategy({ title: '', symbol: 'XAUUSD', items: [{ text: '' }] });
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 custom-scrollbar bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Strategy Manager</h1>
              <p className="text-slate-500 text-sm mt-1">Define your execution checklists for each pair.</p>
            </div>
            <button 
                onClick={() => setIsCreating(true)}
                className="bg-brand-500 hover:bg-brand-600 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
            >
                <Plus size={16} /> Create Strategy
            </button>
        </div>

        {isCreating && (
            <div className="glass-panel p-6 rounded-xl border border-slate-800 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">New Strategy Checklist</h2>
                    <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-white">Cancel</button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Strategy Title</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-brand-500 outline-none"
                            placeholder="e.g., London Breakout"
                            value={newStrategy.title}
                            onChange={e => setNewStrategy({...newStrategy, title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Pair / Symbol</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-brand-500 outline-none uppercase"
                            placeholder="e.g., XAUUSD"
                            value={newStrategy.symbol}
                            onChange={e => setNewStrategy({...newStrategy, symbol: e.target.value})}
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Checklist Items</label>
                    <div className="space-y-2">
                        {newStrategy.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <GripVertical size={16} className="text-slate-600 cursor-grab" />
                                <input 
                                    type="text"
                                    className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-slate-500 outline-none"
                                    placeholder={`Rule #${idx + 1}`}
                                    value={item.text}
                                    onChange={e => handleItemChange(idx, e.target.value)}
                                />
                                <button onClick={() => handleRemoveItem(idx)} className="text-slate-500 hover:text-rose-500 p-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button onClick={handleAddItem} className="text-xs text-brand-500 font-medium hover:underline flex items-center gap-1 mt-2">
                            <Plus size={12} /> Add Rule
                        </button>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={!newStrategy.title || !newStrategy.symbol}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                    >
                        <Save size={16} /> Save Strategy
                    </button>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {strategies.map(strategy => (
                <div key={strategy.id} className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-white text-lg">{strategy.title}</h3>
                            <span className="text-xs font-bold text-slate-900 bg-brand-500 px-2 py-0.5 rounded mt-1 inline-block">
                                {strategy.symbol}
                            </span>
                        </div>
                        <button 
                            onClick={() => deleteStrategy(strategy.id)}
                            className="text-slate-600 hover:text-rose-500 transition-colors p-2"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    
                    <div className="space-y-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                        {strategy.items.map(item => (
                            <div key={item.id} className="flex items-center gap-3 text-sm text-slate-400">
                                <div className="w-4 h-4 rounded border border-slate-600 flex items-center justify-center"></div>
                                {item.text}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StrategyView;