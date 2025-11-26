import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Filter, Trash2, Plus, Wallet, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import TradeWizard from './TradeWizard';

const TradeLog = () => {
  const { trades, tags, deleteTrade, accounts, updateTrade } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');
  const [showAccountFilter, setShowAccountFilter] = useState(false);

  const visibleAccounts = accounts.filter(a => !a.isHidden);

  const filteredTrades = useMemo(() => {
    if (selectedAccountFilter === 'all') return trades;
    return trades.filter(t => t.accountId === selectedAccountFilter);
  }, [trades, selectedAccountFilter]);

  const selectedFilterAccount = accounts.find(a => a.id === selectedAccountFilter);

  return (
      <div className="flex-1 h-full overflow-y-auto p-8 custom-scrollbar bg-slate-950">
       <TradeWizard isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
       
       <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Trade Journal</h1>
            <p className="text-slate-500 text-sm mt-1">Review your execution and refine your edge.</p>
          </div>
          <div className="flex gap-3">
            {/* Account Filter */}
            <div className="relative">
              <button 
                onClick={() => setShowAccountFilter(!showAccountFilter)}
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-400 px-4 py-2 rounded-lg text-sm font-medium hover:text-white transition-colors"
              >
                <Wallet size={16} />
                <span>{selectedAccountFilter === 'all' ? 'All Accounts' : selectedFilterAccount?.name || 'Account'}</span>
                <ChevronDown size={14} />
              </button>
              {showAccountFilter && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowAccountFilter(false)} />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        setSelectedAccountFilter('all');
                        setShowAccountFilter(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors ${
                        selectedAccountFilter === 'all' ? 'bg-brand-500/10 text-brand-400' : 'text-slate-300'
                      }`}
                    >
                      All Accounts
                    </button>
                    {visibleAccounts.map(account => (
                      <button
                        key={account.id}
                        onClick={() => {
                          setSelectedAccountFilter(account.id);
                          setShowAccountFilter(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center justify-between ${
                          account.id === selectedAccountFilter ? 'bg-brand-500/10 text-brand-400' : 'text-slate-300'
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
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-slate-900 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-white/5 transition-all flex items-center gap-2"
            >
                <Plus size={16} /> Add Trade
            </button>
          </div>
       </div>

       <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-xl">
           {filteredTrades.length === 0 ? (
               <div className="p-12 text-center">
                   <p className="text-slate-500 mb-4">
                     {selectedAccountFilter === 'all' ? 'No trades logged yet.' : 'No trades found for this account.'}
                   </p>
                   <button onClick={() => setIsModalOpen(true)} className="text-brand-500 font-bold hover:underline">Log your first trade</button>
               </div>
           ) : (
           <table className="w-full text-left border-collapse">
               <thead>
                   <tr className="bg-slate-900/50 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4">Symbol</th>
                       <th className="px-6 py-4">Account</th>
                       <th className="px-6 py-4">Session</th>
                       <th className="px-6 py-4">Side</th>
                       <th className="px-6 py-4 text-right">Net P&L</th>
                       <th className="px-6 py-4 text-center">Include</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                   {filteredTrades.map((trade) => {
                       const tradeAccount = accounts.find(a => a.id === trade.accountId);
                       return (
                       <tr key={trade.id} className="hover:bg-slate-800/50 transition-colors group">
                           <td className="px-6 py-4">
                               <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                   trade.status === 'WIN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                   trade.status === 'LOSS' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-slate-700 text-slate-300 border-slate-600'
                               }`}>
                                   {trade.status}
                               </span>
                           </td>
                           <td className="px-6 py-4">
                               <div className="font-bold text-white">{trade.symbol}</div>
                               <div className="text-xs text-slate-500">{trade.date}</div>
                           </td>
                           <td className="px-6 py-4">
                               <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                                   {tradeAccount?.name || '-'}
                               </span>
                           </td>
                           <td className="px-6 py-4 text-slate-400 text-sm">
                               <div className="flex items-center gap-2">
                                 <span className={`w-1.5 h-1.5 rounded-full ${trade.session === 'New York' ? 'bg-emerald-500' : trade.session === 'London' ? 'bg-indigo-500' : 'bg-slate-500'}`}></span>
                                 {trade.session}
                               </div>
                           </td>
                           <td className="px-6 py-4 text-sm">
                               <span className={trade.side === 'LONG' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                   {trade.side}
                               </span>
                           </td>
                           <td className={`px-6 py-4 text-right font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                               {trade.pnl >= 0 ? '+' : ''}${Math.abs(trade.pnl).toFixed(2)}
                           </td>
                           <td className="px-6 py-4 text-center">
                               <button 
                                 onClick={() => updateTrade(trade.id, { includeInAccount: !(trade.includeInAccount !== false) })}
                                 className="text-slate-400 hover:text-white transition-colors"
                                 title={trade.includeInAccount !== false ? 'Included in account balance' : 'Excluded from account balance'}
                               >
                                 {trade.includeInAccount !== false ? (
                                   <ToggleRight size={20} className="text-brand-500" />
                                 ) : (
                                   <ToggleLeft size={20} className="text-slate-600" />
                                 )}
                               </button>
                           </td>
                           <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Link to="/tracking" className="text-slate-500 hover:text-brand-500 transition-colors">
                                       <ArrowRight size={16} />
                                   </Link>
                                   <button onClick={() => deleteTrade(trade.id)} className="text-slate-500 hover:text-rose-500 transition-colors">
                                       <Trash2 size={16} />
                                   </button>
                               </div>
                           </td>
                       </tr>
                       );
                   })}
               </tbody>
           </table>
           )}
           <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
               <span className="text-xs text-slate-500">
                 Showing {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''}
                 {selectedAccountFilter !== 'all' && ` for ${selectedFilterAccount?.name}`}
               </span>
               <button className="text-xs text-slate-500 hover:text-white transition-colors">Load more trades</button>
           </div>
       </div>
    </div>
  );
};

export default TradeLog;