import React, { useState, useRef } from 'react';
import { User, Wallet, Download, Upload, Camera, Edit2, Trash2, Plus, Eye, EyeOff, Palette, Check, Heart, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme, THEMES, ThemeId } from '../context/ThemeContext';
import { TradingAccount } from '../types';

// Avatar options
const AVATAR_OPTIONS = [
  { id: 'avatar1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=8b5cf6' },
  { id: 'avatar2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=a78bfa' },
  { id: 'avatar3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo&backgroundColor=c4b5fd' },
  { id: 'avatar4', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Trader1&backgroundColor=8b5cf6' },
  { id: 'avatar5', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Trader2&backgroundColor=a78bfa' },
  { id: 'avatar6', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=TraderPro&backgroundColor=8b5cf6' },
  { id: 'avatar7', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Pip&backgroundColor=8b5cf6' },
  { id: 'avatar8', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy&backgroundColor=8b5cf6' },
];

const SettingsPage: React.FC = () => {
  const { 
    user, updateUser, accounts, addAccount, updateAccount, deleteAccount, 
    getAccountBalance, trades, settings, 
    exportData, importData 
  } = useStore();
  const { theme, themeId, setTheme, isLightTheme } = useTheme();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.name || '');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', startingBalance: '' });
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', startingBalance: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const avatarUploadRef = useRef<HTMLInputElement>(null);
  const [showCommunityThanks, setShowCommunityThanks] = useState(false);
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(true);
  const [isThemeExpanded, setIsThemeExpanded] = useState(true);
  const [isBackupExpanded, setIsBackupExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'accounts' | 'theme'>('accounts');

  // Theme-aware colors
  const textPrimary = isLightTheme ? 'text-slate-800' : 'text-white';
  const textSecondary = isLightTheme ? 'text-slate-600' : 'text-slate-400';
  const cardBg = isLightTheme ? 'bg-white' : '';
  const inputBg = isLightTheme ? '#f8fafc' : 'rgba(51,65,85,0.3)';

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateUser({ name: tempName.trim() });
      setEditingName(false);
    }
  };

  const handleAddAccount = () => {
    if (newAccount.name && newAccount.startingBalance) {
      addAccount({
        id: `acc_${Date.now()}`,
        name: newAccount.name,
        startingBalance: parseFloat(newAccount.startingBalance),
        createdAt: new Date().toISOString(),
        isMain: false,
        isHidden: false,
      });
      setNewAccount({ name: '', startingBalance: '' });
      setShowAddAccount(false);
    }
  };

  const handleEditAccount = (account: TradingAccount) => {
    setEditingAccountId(account.id);
    setEditForm({
      name: account.name,
      startingBalance: account.startingBalance.toString(),
    });
  };

  const handleSaveAccount = () => {
    if (editingAccountId && editForm.name && editForm.startingBalance) {
      updateAccount(editingAccountId, {
        name: editForm.name,
        startingBalance: parseFloat(editForm.startingBalance),
      });
      setEditingAccountId(null);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importData(file);
        setImportStatus({ type: 'success', message: 'Data imported successfully!' });
      } catch (error) {
        setImportStatus({ type: 'error', message: `Import failed: ${error instanceof Error ? error.message : String(error)}` });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setImportStatus(null), 5000);
      }
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        setImportStatus({ type: 'error', message: 'Please select an image file' });
        setTimeout(() => setImportStatus(null), 3000);
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setImportStatus({ type: 'error', message: 'Image size must be less than 5MB' });
        setTimeout(() => setImportStatus(null), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          updateUser({ avatarUrl: result });
          setShowAvatarPicker(false);
        }
      };
      reader.onerror = () => {
        setImportStatus({ type: 'error', message: 'Failed to read image file' });
        setTimeout(() => setImportStatus(null), 3000);
      };
      reader.readAsDataURL(file);
      
      if (avatarUploadRef.current) avatarUploadRef.current.value = '';
    }
  };

  // Calculate user stats for profile
  const userStats = {
    totalTrades: trades.length,
    totalAccounts: accounts.length,
    memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'N/A',
    winRate: trades.length > 0 ? (trades.filter(t => t.pnl > 0).length / trades.length * 100).toFixed(0) : '0',
  };

  return (
    <div 
      className="flex-1 h-full overflow-y-auto custom-scrollbar pb-20"
      style={{ background: theme.bgGradient, backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}
    >
      <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
        
        {/* Header */}
        <div className="mb-4">
          <h1 className={`text-xl font-bold ${textPrimary}`}>Accounts</h1>
        </div>

        {/* Local tabs inside Accounts page */}
        <div className="mb-6 flex gap-2 p-1 rounded-xl" style={{ backgroundColor: isLightTheme ? '#e2e8f0' : 'rgba(30,64,175,0.25)' }}>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'accounts' ? 'text-white shadow-md' : isLightTheme ? 'text-slate-700' : 'text-slate-400'
            }`}
            style={activeTab === 'accounts' ? { backgroundColor: theme.primary } : {}}
          >
            Accounts
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'theme' ? 'text-white shadow-md' : isLightTheme ? 'text-slate-700' : 'text-slate-400'
            }`}
            style={activeTab === 'theme' ? { backgroundColor: theme.primary } : {}}
          >
            Theme
          </button>
        </div>

        {activeTab === 'accounts' && (
        <>
        {/* Profile Pic & Stats Header */}
        <div className={`p-6 rounded-2xl mb-6 ${cardBg}`} style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}20` }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <img
                src={user?.avatarUrl || AVATAR_OPTIONS[0].url}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl object-cover"
                style={{ border: `2px solid ${theme.primary}` }}
              />
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: theme.primary }}
              >
                <Camera size={14} />
              </button>
            </div>
            <div className="flex-1">
              {editingName ? (
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className={`rounded-lg px-3 py-2 text-lg font-bold outline-none w-full ${textPrimary}`}
                  style={{ 
                    backgroundColor: inputBg,
                    border: `1px solid ${theme.primary}50`
                  }}
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className={`text-xl font-bold ${textPrimary}`}>{user?.name || 'Trader'}</h2>
                  <button 
                    onClick={() => setEditingName(true)} 
                    className={textSecondary}
                    style={{ color: theme.primary }}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className={`text-2xl font-bold font-mono ${textPrimary}`}>{userStats.totalTrades}</p>
              <p className={`text-[10px] uppercase ${textSecondary}`}>Trades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono" style={{ color: theme.primary }}>{userStats.winRate}%</p>
              <p className={`text-[10px] uppercase ${textSecondary}`}>Win Rate</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold font-mono ${textPrimary}`}>{userStats.totalAccounts}</p>
              <p className={`text-[10px] uppercase ${textSecondary}`}>Accounts</p>
            </div>
          </div>
        </div>

        {/* Accounts Section */}
        <div className="mb-6">
          <button
            onClick={() => setIsAccountsExpanded(!isAccountsExpanded)}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className={`text-lg font-bold ${textPrimary}`}>Accounts</h2>
            {isAccountsExpanded ? (
              <ChevronUp size={20} className={textSecondary} />
            ) : (
              <ChevronDown size={20} className={textSecondary} />
            )}
          </button>
          {isAccountsExpanded && (
            <div className="space-y-4">
            {accounts.length === 0 ? (
              <div 
                className={`p-8 text-center rounded-2xl ${cardBg}`}
                style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}20` }}
              >
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${theme.primary}15` }}
                >
                  <Wallet size={28} style={{ color: theme.primary }} />
                </div>
                <p className={`font-medium mb-2 ${textPrimary}`}>No accounts yet</p>
                <p className={`text-xs mb-4 ${textSecondary}`}>Add your first trading account</p>
                <div 
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
                >
                  ⚡ Earn +75 XP
                </div>
              </div>
            ) : (
              accounts.map(account => (
                <div 
                  key={account.id} 
                  className={`p-4 rounded-2xl ${cardBg}`}
                  style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}15` }}
                >
                  {editingAccountId === account.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Account name"
                        className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${textPrimary}`}
                        style={{ backgroundColor: inputBg, border: `1px solid ${theme.primary}30` }}
                      />
                      <input
                        type="number"
                        value={editForm.startingBalance}
                        onChange={e => setEditForm({ ...editForm, startingBalance: e.target.value })}
                        placeholder="Starting balance"
                        className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${textPrimary}`}
                        style={{ backgroundColor: inputBg, border: `1px solid ${theme.primary}30` }}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSaveAccount} 
                          className="flex-1 py-2 text-white rounded-lg text-sm font-bold"
                          style={{ backgroundColor: theme.primary }}
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingAccountId(null)} 
                          className={`flex-1 py-2 rounded-lg text-sm ${textSecondary}`}
                          style={{ backgroundColor: isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.5)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${theme.primary}20` }}
                          >
                            <Wallet size={18} style={{ color: theme.primary }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`font-bold ${textPrimary}`}>{account.name}</h3>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 items-center">
                          <button 
                            onClick={() => handleEditAccount(account)} 
                            className={`p-2 rounded-lg ${textSecondary}`}
                            title="Edit account"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => updateAccount(account.id, { isHidden: !account.isHidden })} 
                            className={`p-2 rounded-lg ${textSecondary}`}
                            title={account.isHidden ? 'Show account' : 'Hide account'}
                          >
                            {account.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(account.id)} 
                            className="p-2 rounded-lg"
                            style={{ color: theme.secondary }}
                            title="Delete account"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div 
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: isLightTheme ? '#f8fafc' : 'rgba(51,65,85,0.3)' }}
                        >
                          <p className={`text-[10px] uppercase ${textSecondary}`}>Starting</p>
                          <p className={`font-mono ${textPrimary}`}>${account.startingBalance.toLocaleString()}</p>
                        </div>
                        <div 
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: isLightTheme ? '#f8fafc' : 'rgba(51,65,85,0.3)' }}
                        >
                          <p className={`text-[10px] uppercase ${textSecondary}`}>Current</p>
                          <p className="font-mono" style={{ color: theme.primary }}>${getAccountBalance(account.id).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Deposit / Withdraw */}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {
                            const amountStr = window.prompt('Deposit amount?', '');
                            const amount = amountStr ? parseFloat(amountStr) : NaN;
                            if (!isNaN(amount) && amount > 0) {
                              const current = getAccountBalance(account.id);
                              const diff = amount;
                              // store new startingBalance so current = starting + trades; we approximate by shifting starting
                              updateAccount(account.id, { startingBalance: account.startingBalance + diff });
                            }
                          }}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/10 transition-colors"
                        >
                          Deposit
                        </button>
                        <button
                          onClick={() => {
                            const amountStr = window.prompt('Withdraw amount?', '');
                            const amount = amountStr ? parseFloat(amountStr) : NaN;
                            if (!isNaN(amount) && amount > 0) {
                              const current = getAccountBalance(account.id);
                              const diff = -amount;
                              updateAccount(account.id, { startingBalance: account.startingBalance + diff });
                            }
                          }}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold text-rose-400 border border-rose-500/40 hover:bg-rose-500/10 transition-colors"
                        >
                          Withdraw
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}

            {/* Add Account */}
            {showAddAccount ? (
              <div 
                className={`p-4 space-y-3 rounded-2xl ${cardBg}`}
                style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}20` }}
              >
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="Account name"
                  className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${textPrimary}`}
                  style={{ backgroundColor: inputBg, border: `1px solid ${theme.primary}30` }}
                />
                <input
                  type="number"
                  value={newAccount.startingBalance}
                  onChange={e => setNewAccount({ ...newAccount, startingBalance: e.target.value })}
                  placeholder="Starting balance"
                  className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${textPrimary}`}
                  style={{ backgroundColor: inputBg, border: `1px solid ${theme.primary}30` }}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddAccount} 
                    className="flex-1 py-3 text-white rounded-xl text-sm font-bold"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Create Account
                  </button>
                  <button 
                    onClick={() => setShowAddAccount(false)} 
                    className={`flex-1 py-3 rounded-xl text-sm ${textSecondary}`}
                    style={{ backgroundColor: isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.5)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddAccount(true)}
                className={`w-full py-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 ${textSecondary}`}
                style={{ borderColor: isLightTheme ? '#cbd5e1' : 'rgba(71,85,105,0.5)' }}
              >
                <Plus size={18} /> Add Account
              </button>
            )}
            </div>
          )}
        </div>

        {/* Theme Section */}
        </>
        )}

        {activeTab === 'theme' && (
        <div className="mb-6">
          <button
            onClick={() => setIsThemeExpanded(!isThemeExpanded)}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className={`text-lg font-bold ${textPrimary}`}>Theme</h2>
            {isThemeExpanded ? (
              <ChevronUp size={20} className={textSecondary} />
            ) : (
              <ChevronDown size={20} className={textSecondary} />
            )}
          </button>
          {isThemeExpanded && (
            <div className="space-y-4">
            <div 
              className={`p-4 rounded-xl ${cardBg}`}
              style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}20` }}
            >
              <h3 className={`text-sm font-bold mb-3 ${textSecondary}`}>Choose Theme</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(THEMES).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as ThemeId)}
                    className={`relative p-4 rounded-xl text-left transition-all ${
                      themeId === t.id ? 'ring-2' : ''
                    }`}
                    style={{ 
                      ringColor: themeId === t.id ? t.primary : 'transparent',
                      background: t.id === 'ledger' ? '#fefce8' : (isLightTheme ? '#f8fafc' : 'rgba(15,23,42,0.8)')
                    }}
                  >
                    {/* Color Preview */}
                    <div className="flex gap-1 mb-2">
                      <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: t.primary }} />
                      <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: t.secondary }} />
                      <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: t.accent }} />
                    </div>
                    <p className={`text-sm font-bold ${t.id === 'ledger' ? 'text-slate-800' : textPrimary}`}>
                      {t.name}
                    </p>
                    <p className={`text-[10px] ${t.id === 'ledger' ? 'text-slate-600' : textSecondary}`}>
                      {t.description}
                    </p>
                    {themeId === t.id && (
                      <div 
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: t.primary }}
                      >
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Preview */}
            <div 
              className={`p-4 rounded-xl ${cardBg}`}
              style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}20` }}
            >
              <h3 className={`text-sm font-bold mb-3 ${textSecondary}`}>Preview</h3>
              <div 
                className="p-4 rounded-xl"
                style={{ background: theme.cardBg, border: `1px solid ${theme.primary}30` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${theme.primary}20` }}
                  >
                    <span style={{ color: theme.primary }}>📈</span>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>Sample Trade</p>
                    <p className={textSecondary} style={{ fontSize: '12px' }}>EURUSD • Long</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div 
                    className="flex-1 p-2 rounded-lg text-center"
                    style={{ backgroundColor: `${theme.primary}15` }}
                  >
                    <p className={`text-[10px] ${textSecondary}`}>Profit</p>
                    <p className="font-mono font-bold" style={{ color: theme.primary }}>+$125.50</p>
                  </div>
                  <div 
                    className="flex-1 p-2 rounded-lg text-center"
                    style={{ backgroundColor: `${theme.secondary}15` }}
                  >
                    <p className={`text-[10px] ${textSecondary}`}>Loss</p>
                    <p className="font-mono font-bold" style={{ color: theme.secondary }}>-$45.20</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}
        </div>
        )}

        {/* Backup Section */}
        <div className="mb-6">
          <button
            onClick={() => setIsBackupExpanded(!isBackupExpanded)}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className={`text-lg font-bold ${textPrimary}`}>Backup</h2>
            {isBackupExpanded ? (
              <ChevronUp size={20} className={textSecondary} />
            ) : (
              <ChevronDown size={20} className={textSecondary} />
            )}
          </button>
          {isBackupExpanded && (
            <div className="space-y-4">
            <div 
              className={`p-5 rounded-2xl ${cardBg}`}
              style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}20` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${theme.primary}20` }}
                >
                  <Download size={18} style={{ color: theme.primary }} />
                </div>
                <div>
                  <h3 className={`font-bold ${textPrimary}`}>Export Data</h3>
                  <p className={`text-xs ${textSecondary}`}>Create a backup of all your data</p>
                </div>
              </div>
              <button
                onClick={exportData}
                className="w-full py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.primary, boxShadow: `0 0 20px ${theme.primary}40` }}
              >
                <Download size={18} /> Export Backup
              </button>
              {settings.lastExportDate && (
                <p className={`text-xs text-center mt-3 ${textSecondary}`}>
                  Last export: {new Date(settings.lastExportDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <div 
              className={`p-5 rounded-2xl ${cardBg}`}
              style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}20` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.5)' }}
                >
                  <Upload size={18} className={textSecondary} />
                </div>
                <div>
                  <h3 className={`font-bold ${textPrimary}`}>Import Data</h3>
                  <p className={`text-xs ${textSecondary}`}>Restore from a backup file</p>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors`}
                style={{ 
                  backgroundColor: isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.5)',
                  color: isLightTheme ? '#475569' : '#e2e8f0'
                }}
              >
                <Upload size={18} /> Import Backup
              </button>
              {importStatus && (
                <p className="text-xs text-center mt-3" style={{ color: importStatus.type === 'success' ? theme.primary : theme.secondary }}>
                  {importStatus.message}
                </p>
              )}
            </div>
            </div>
          )}
        </div>

        {/* Community Thanks Section */}
        <div 
          className={`p-5 rounded-2xl ${cardBg} cursor-pointer mb-6`}
          style={{ background: isLightTheme ? 'white' : theme.cardBg, border: `1px solid ${theme.primary}20` }}
          onClick={() => setShowCommunityThanks(true)}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.primary}20` }}
            >
              <Heart size={18} style={{ color: theme.primary }} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold ${textPrimary}`}>Thanks for Community Feedback</h3>
              <p className={`text-xs ${textSecondary}`}>Tap to see contributors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Thanks Modal */}
      {showCommunityThanks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div 
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ 
                background: isLightTheme ? 'white' : theme.cardBg,
                border: `1px solid ${theme.primary}30`
              }}
            >
              <div 
                className="p-5"
                style={{ borderBottom: `1px solid ${isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.5)'}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg font-bold ${textPrimary}`}>Community Contributors</h3>
                  <button
                    onClick={() => setShowCommunityThanks(false)}
                    className={`p-1 hover:bg-slate-800 rounded-lg transition-colors ${textSecondary}`}
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className={`text-sm ${textSecondary}`}>Thanks for community feedback which helped us upgrade the app</p>
              </div>
              <div className="p-5">
                <div className="mb-4">
                  <h4 className={`text-sm font-bold mb-3 ${textPrimary}`}>Reddit Community:</h4>
                  <div className="space-y-2">
                    <div className={`p-3 rounded-lg ${isLightTheme ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                      <p className={`text-sm ${textPrimary}`}>Even_Competition2461</p>
                    </div>
                    <div className={`p-3 rounded-lg ${isLightTheme ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                      <p className={`text-sm ${textPrimary}`}>Mysterious_Drag_519</p>
                    </div>
                    <div className={`p-3 rounded-lg ${isLightTheme ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                      <p className={`text-sm ${textPrimary}`}>Few-Pepper858</p>
                    </div>
                    <div className={`p-3 rounded-lg ${isLightTheme ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                      <p className={`text-sm ${textPrimary}`}>Peppie79</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowCommunityThanks(false)}
                  className="w-full py-3 rounded-xl font-medium text-white"
                  style={{ backgroundColor: theme.primary }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div 
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ 
                background: isLightTheme ? 'white' : theme.cardBg,
                border: `1px solid ${theme.primary}30`
              }}
            >
              <div 
                className="p-4"
                style={{ borderBottom: `1px solid ${isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.5)'}` }}
              >
                <h3 className={`text-lg font-bold ${textPrimary}`}>Choose Avatar</h3>
              </div>
              <div className="grid grid-cols-4 gap-3 p-4">
                {AVATAR_OPTIONS.map(avatar => (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      updateUser({ avatarUrl: avatar.url });
                      setShowAvatarPicker(false);
                    }}
                    className="p-1 rounded-xl border-2 transition-all"
                    style={{ 
                      borderColor: user?.avatarUrl === avatar.url ? theme.primary : 'transparent'
                    }}
                  >
                    <img src={avatar.url} alt="" className="w-full rounded-lg" />
                  </button>
                ))}
              </div>
              <div 
                className="p-4 space-y-2"
                style={{ borderTop: `1px solid ${isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.5)' }` }}
              >
                <input
                  type="file"
                  ref={avatarUploadRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => avatarUploadRef.current?.click()}
                  className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${textPrimary}`}
                  style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
                >
                  <Upload size={16} />
                  Upload Your Photo
                </button>
                <button
                  onClick={() => setShowAvatarPicker(false)}
                  className={`w-full py-3 rounded-xl font-medium ${textSecondary}`}
                  style={{ backgroundColor: isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.5)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div 
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ 
                background: isLightTheme ? 'white' : theme.cardBg,
                border: `1px solid ${theme.secondary}30`
              }}
            >
              <div className="p-5">
                <h3 className={`text-lg font-bold mb-2 ${textPrimary}`}>Delete Account?</h3>
                <p className={`text-sm ${textSecondary}`}>This will also delete all trades associated with this account.</p>
              </div>
              <div 
                className="flex"
                style={{ borderTop: `1px solid ${isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.5)'}` }}
              >
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className={`flex-1 py-4 text-sm font-medium ${textSecondary}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { deleteAccount(deleteConfirmId); setDeleteConfirmId(null); }}
                  className="flex-1 py-4 text-sm font-bold"
                  style={{ 
                    color: theme.secondary,
                    borderLeft: `1px solid ${isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.5)'}`
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default SettingsPage;
