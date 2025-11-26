import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Star, Building2, Wallet, Edit2, Check, Eye, EyeOff, AlertCircle, Camera, Download, Upload, ToggleLeft, ToggleRight, Database, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { TradingAccount } from '../types';

// Avatar options - using different styles and seeds for variety
const AVATAR_OPTIONS = [
  { id: 'avatar1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=10b981' },
  { id: 'avatar2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=6366f1' },
  { id: 'avatar3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo&backgroundColor=f59e0b' },
  { id: 'avatar4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=ec4899' },
  { id: 'avatar5', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Trader1&backgroundColor=10b981' },
  { id: 'avatar6', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Trader2&backgroundColor=6366f1' },
  { id: 'avatar7', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Trader3&backgroundColor=f59e0b' },
  { id: 'avatar8', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=TraderPro&backgroundColor=10b981' },
  { id: 'avatar9', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=ChartMaster&backgroundColor=6366f1' },
  { id: 'avatar10', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Pip&backgroundColor=10b981' },
  { id: 'avatar11', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Profit&backgroundColor=ec4899' },
  { id: 'avatar12', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Bull&backgroundColor=10b981' },
  { id: 'avatar13', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Bear&backgroundColor=f43f5e' },
  { id: 'avatar14', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy&backgroundColor=10b981' },
  { id: 'avatar15', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool&backgroundColor=6366f1' },
];

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser, accounts, addAccount, updateAccount, deleteAccount, setMainAccount, getAccountBalance, trades, settings, updateSettings, exportData, importData } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'accounts' | 'backup'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.name || '');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', broker: '', startingBalance: '' });
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', broker: '', startingBalance: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateUser({ name: tempName.trim() });
      setEditingName(false);
    }
  };

  const handleSelectAvatar = (avatarUrl: string) => {
    updateUser({ avatar: avatarUrl });
    setShowAvatarPicker(false);
  };

  const getCurrentAvatar = () => {
    if (user?.avatar) return user.avatar;
    return `https://ui-avatars.com/api/?name=${user?.name || 'Trader'}&background=10b981&color=0f172a&bold=true&size=80`;
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);
    const result = await importData(file);
    setImportStatus({ type: result.success ? 'success' : 'error', message: result.message });
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddAccount = () => {
    if (!newAccount.name.trim()) return;
    
    const account: TradingAccount = {
      id: `account_${Date.now()}`,
      name: newAccount.name.trim(),
      broker: newAccount.broker.trim() || undefined,
      startingBalance: parseFloat(newAccount.startingBalance) || 0,
      isMain: accounts.length === 0, // First account becomes main
      isHidden: false,
      createdAt: new Date().toISOString()
    };
    
    addAccount(account);
    setNewAccount({ name: '', broker: '', startingBalance: '' });
    setShowAddAccount(false);
  };

  const startEditAccount = (account: TradingAccount) => {
    setEditingAccountId(account.id);
    setEditForm({
      name: account.name,
      broker: account.broker || '',
      startingBalance: account.startingBalance.toString()
    });
  };

  const handleSaveAccount = (id: string) => {
    if (!editForm.name.trim()) return;
    updateAccount(id, {
      name: editForm.name.trim(),
      broker: editForm.broker.trim() || undefined,
      startingBalance: parseFloat(editForm.startingBalance) || 0
    });
    setEditingAccountId(null);
  };

  const handleToggleHidden = (account: TradingAccount) => {
    updateAccount(account.id, { isHidden: !account.isHidden });
  };

  const handleDeleteAccount = (id: string) => {
    deleteAccount(id);
    setDeleteConfirmId(null);
  };

  const visibleAccounts = accounts.filter(a => !a.isHidden);
  const hiddenAccounts = accounts.filter(a => a.isHidden);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Account Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'accounts'
                ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Accounts
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'backup'
                ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Backup
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="relative group"
                >
                  <img 
                    src={getCurrentAvatar()} 
                    alt="User" 
                    className="w-20 h-20 rounded-full border-4 border-slate-700 group-hover:border-brand-500 transition-colors" 
                  />
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={24} className="text-white" />
                  </div>
                </button>
                <div>
                  <p className="text-sm text-slate-500">Profile Picture</p>
                  <p className="text-xs text-slate-600">Click to choose an avatar</p>
                </div>
              </div>

              {/* Avatar Picker */}
              {showAvatarPicker && (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-white">Choose Your Avatar</h4>
                    <button 
                      onClick={() => setShowAvatarPicker(false)}
                      className="text-slate-500 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => handleSelectAvatar(avatar.url)}
                        className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                          user?.avatar === avatar.url 
                            ? 'border-brand-500 ring-2 ring-brand-500/30' 
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <img 
                          src={avatar.url} 
                          alt={avatar.id} 
                          className="w-full h-full object-cover bg-slate-900"
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      updateUser({ avatar: undefined });
                      setShowAvatarPicker(false);
                    }}
                    className="mt-3 w-full text-xs text-slate-500 hover:text-white py-2 transition-colors"
                  >
                    Reset to default (initials)
                  </button>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Display Name</label>
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={e => setTempName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-brand-500 outline-none"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-4 py-2 bg-brand-500 text-slate-900 rounded-lg font-medium hover:bg-brand-600 transition-colors"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingName(false);
                        setTempName(user?.name || '');
                      }}
                      className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg font-medium hover:text-white transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700">
                    <span className="text-white font-medium">{user?.name || 'Trader'}</span>
                    <button
                      onClick={() => {
                        setTempName(user?.name || '');
                        setEditingName(true);
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Account Summary */}
              <div className="mt-8 p-4 bg-slate-800/30 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Total Accounts</p>
                    <p className="text-xl font-bold text-white">{accounts.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Main Account</p>
                    <p className="text-xl font-bold text-brand-400">{accounts.find(a => a.isMain)?.name || 'None'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-4">
              {/* No accounts message */}
              {accounts.length === 0 && !showAddAccount && (
                <div className="p-8 text-center border-2 border-dashed border-slate-700 rounded-xl">
                  <Wallet size={40} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400 mb-1">No trading accounts yet</p>
                  <p className="text-xs text-slate-600 mb-4">Add your first trading account to start tracking your performance</p>
                  <button
                    onClick={() => setShowAddAccount(true)}
                    className="px-4 py-2 bg-brand-500 text-slate-900 rounded-lg font-medium hover:bg-brand-600 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Your First Account
                  </button>
                </div>
              )}

              {/* Account List */}
              {visibleAccounts.map(account => (
                <div
                  key={account.id}
                  className={`p-4 rounded-xl border transition-all ${
                    account.isMain
                      ? 'bg-brand-500/5 border-brand-500/30'
                      : 'bg-slate-800/30 border-slate-700'
                  }`}
                >
                  {editingAccountId === account.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Account Name *</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Broker (Optional)</label>
                        <input
                          type="text"
                          value={editForm.broker}
                          onChange={e => setEditForm({ ...editForm, broker: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Starting Balance *</label>
                        <input
                          type="number"
                          value={editForm.startingBalance}
                          onChange={e => setEditForm({ ...editForm, startingBalance: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleSaveAccount(account.id)}
                          disabled={!editForm.name.trim()}
                          className="flex-1 px-4 py-2 bg-brand-500 text-slate-900 rounded-lg font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingAccountId(null)}
                          className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : deleteConfirmId === account.id ? (
                    // Delete Confirmation
                    <div className="text-center py-2">
                      <AlertCircle size={32} className="mx-auto text-rose-400 mb-2" />
                      <p className="text-white font-medium mb-1">Delete "{account.name}"?</p>
                      <p className="text-xs text-slate-500 mb-4">This action cannot be undone. Trades linked to this account will remain.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition-colors"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            account.isMain ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-700 text-slate-400'
                          }`}>
                            <Wallet size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white">{account.name}</h3>
                              {account.isMain && (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-brand-500/20 text-brand-400 rounded">
                                  Main
                                </span>
                              )}
                            </div>
                            {account.broker && (
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Building2 size={12} /> {account.broker}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditAccount(account)}
                            className="p-2 text-slate-500 hover:text-white transition-colors"
                            title="Edit account"
                          >
                            <Edit2 size={16} />
                          </button>
                          {!account.isMain && (
                            <button
                              onClick={() => setMainAccount(account.id)}
                              className="p-2 text-slate-500 hover:text-brand-400 transition-colors"
                              title="Set as main account"
                            >
                              <Star size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleHidden(account)}
                            className="p-2 text-slate-500 hover:text-amber-400 transition-colors"
                            title="Hide account"
                          >
                            <EyeOff size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(account.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete account"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Starting Balance</p>
                          <p className="text-lg font-mono font-bold text-white">
                            ${account.startingBalance.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Current Balance</p>
                          <p className={`text-lg font-mono font-bold ${
                            getAccountBalance(account.id) >= account.startingBalance ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            ${getAccountBalance(account.id).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Hidden Accounts Section */}
              {hiddenAccounts.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                    <EyeOff size={14} />
                    Hidden Accounts ({hiddenAccounts.length})
                  </h3>
                  <div className="space-y-2">
                    {hiddenAccounts.map(account => (
                      <div
                        key={account.id}
                        className="p-3 rounded-lg bg-slate-800/20 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Wallet size={16} className="text-slate-600" />
                          <span className="text-slate-500">{account.name}</span>
                          <span className="text-xs text-slate-600 font-mono">${account.startingBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleHidden(account)}
                            className="p-2 text-slate-600 hover:text-white transition-colors"
                            title="Show account"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(account.id)}
                            className="p-2 text-slate-600 hover:text-rose-400 transition-colors"
                            title="Delete account"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Account Form */}
              {accounts.length > 0 && (
                showAddAccount ? (
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 border-dashed">
                    <h3 className="text-sm font-bold text-white mb-4">New Trading Account</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Account Name *</label>
                        <input
                          type="text"
                          placeholder="e.g., FTMO Challenge"
                          value={newAccount.name}
                          onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Broker (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g., IC Markets"
                          value={newAccount.broker}
                          onChange={e => setNewAccount({ ...newAccount, broker: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Starting Balance *</label>
                        <input
                          type="number"
                          placeholder="e.g., 10000"
                          value={newAccount.startingBalance}
                          onChange={e => setNewAccount({ ...newAccount, startingBalance: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleAddAccount}
                        disabled={!newAccount.name.trim()}
                        className="flex-1 px-4 py-2 bg-brand-500 text-slate-900 rounded-lg font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Account
                      </button>
                      <button
                        onClick={() => {
                          setShowAddAccount(false);
                          setNewAccount({ name: '', broker: '', startingBalance: '' });
                        }}
                        className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddAccount(true)}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:border-brand-500 hover:text-brand-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Add Trading Account
                  </button>
                )
              )}
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />

              {/* Data Overview */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <Database size={20} className="text-brand-400" />
                  <h3 className="font-bold text-white">Your Data</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{trades.length}</p>
                    <p className="text-xs text-slate-500">Trades</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{accounts.length}</p>
                    <p className="text-xs text-slate-500">Accounts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {settings.lastExportDate 
                        ? new Date(settings.lastExportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        : 'Never'
                      }
                    </p>
                    <p className="text-xs text-slate-500">Last Backup</p>
                  </div>
                </div>
              </div>

              {/* Export Section */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Download size={20} className="text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-white">Export Backup</h3>
                      <p className="text-xs text-slate-500">Download all your data as a JSON file</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={exportData}
                  className="w-full mt-2 px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg font-medium hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download Backup File
                </button>
              </div>

              {/* Import Section */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Upload size={20} className="text-indigo-400" />
                    <div>
                      <h3 className="font-bold text-white">Import Backup</h3>
                      <p className="text-xs text-slate-500">Restore data from a backup file</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-2 px-4 py-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg font-medium hover:bg-indigo-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  Select Backup File
                </button>
                {importStatus && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${
                    importStatus.type === 'success' 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}>
                    {importStatus.message}
                  </div>
                )}
              </div>

              {/* Auto Export */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-amber-400" />
                    <div>
                      <h3 className="font-bold text-white">Auto Backup</h3>
                      <p className="text-xs text-slate-500">Automatically download backup when adding new trades</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings({ autoExport: !settings.autoExport })}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {settings.autoExport ? (
                      <ToggleRight size={32} className="text-brand-500" />
                    ) : (
                      <ToggleLeft size={32} className="text-slate-600" />
                    )}
                  </button>
                </div>
                {settings.autoExport && (
                  <p className="mt-3 text-xs text-amber-400/70 bg-amber-500/10 p-2 rounded-lg">
                    ✓ A backup file will be downloaded each time you add a new trade
                  </p>
                )}
              </div>

              {/* Warning */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex gap-2 items-start">
                  <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-500/80">
                    <span className="font-bold">Important:</span> Keep your backup files safe. If you forget your PIN 
                    and need to reset the app, you can restore your data from a backup.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsModal;
