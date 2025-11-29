import React, { useState, useEffect, useRef } from 'react';
import { Zap, Delete, ArrowRight, User, Lock, AlertTriangle, Trash2 } from 'lucide-react';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  // Flow state: 'loading' -> check LS -> 'register_name' | 'register_pin' | 'login'
  const [view, setView] = useState<'loading' | 'register_name' | 'register_pin' | 'login'>('loading');
  
  // Data state
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [savedUser, setSavedUser] = useState<{name: string, pin: string} | null>(null);
  const [error, setError] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Store the latest onAuthenticated callback in a ref to avoid dependency issues
  const onAuthenticatedRef = useRef(onAuthenticated);
  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
  }, [onAuthenticated]);

  useEffect(() => {
    const stored = localStorage.getItem('velox_user');
    if (stored) {
      const user = JSON.parse(stored);
      setSavedUser(user);
      setName(user.name); // Set name for display
      setView('login');
    } else {
      setView('register_name');
    }
  }, []);

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleResetApp = () => {
    if (resetConfirmText === 'RESET') {
      // Clear all localStorage
      localStorage.removeItem('velox_user');
      localStorage.removeItem('velox_trades');
      localStorage.removeItem('velox_accounts');
      localStorage.removeItem('velox_strategies');
      localStorage.removeItem('velox_tags');
      localStorage.removeItem('velox_settings');
      // Reload the page
      window.location.reload();
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length > 0) {
      setView('register_pin');
    }
  };

  // Effect to check PIN completion
  useEffect(() => {
    if (pin.length === 6) {
      if (view === 'register_pin') {
        // Save new user
        const newUser = { name, pin };
        localStorage.setItem('velox_user', JSON.stringify(newUser));
        setTimeout(() => onAuthenticatedRef.current(), 300);
      } else if (view === 'login') {
        // Validate existing user
        if (savedUser && pin === savedUser.pin) {
          onAuthenticatedRef.current();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  }, [pin, view, name, savedUser]);

  if (view === 'loading') return <div className="h-screen w-full bg-[#0f172a]"></div>;

  return (
    <div className="h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambient Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center w-full max-w-sm">
        
        {/* Brand */}
        <div className="mb-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center text-slate-900 shadow-2xl shadow-brand-500/30 mb-4">
             <Zap size={40} fill="currentColor" />
          </div>
          <h1 className="font-bold text-3xl text-white tracking-tight">Pips&<span className="text-brand-500">Profit</span></h1>
          <p className="text-slate-500 text-sm font-medium tracking-wider uppercase mt-1">Secure Terminal Access</p>
        </div>

        {/* VIEW: Register Name */}
        {view === 'register_name' && (
          <div className="w-full animate-in slide-in-from-right-8 duration-500">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-2 text-center">Create Profile</h2>
              <p className="text-slate-400 text-sm mb-6 text-center">Enter your name to personalize your journal.</p>
              
              <form onSubmit={handleNameSubmit}>
                <div className="relative mb-6">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input 
                    type="text" 
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={name.trim().length === 0}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </form>
            </div>
            
            {/* PIN Warning */}
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex gap-2 items-start">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-500/80">
                  <span className="font-bold">Important:</span> This app works offline. If you forget your PIN, there is no recovery option. 
                  Please remember your PIN or use the backup feature regularly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: PIN Entry (Register or Login) */}
        {(view === 'register_pin' || view === 'login') && (
          <div className="w-full animate-in slide-in-from-right-8 duration-500 flex flex-col items-center">
             
             <div className="mb-8 text-center">
                <h2 className="text-xl font-bold text-white mb-1">
                  {view === 'register_pin' ? 'Set Access PIN' : `Welcome back, ${name}`}
                </h2>
                <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                  <Lock size={12} />
                  {view === 'register_pin' ? 'Create a 6-digit code' : 'Enter your PIN to unlock'}
                </p>
             </div>

            {/* PIN Dots Display */}
            <div className="flex gap-4 mb-10">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    i < pin.length 
                      ? error 
                        ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                        : 'bg-brand-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] scale-110' 
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                ></div>
              ))}
            </div>

            {/* Error Message */}
            <div className="h-6 mb-4">
                {error && <span className="text-rose-500 text-sm font-medium animate-pulse">Incorrect PIN. Please try again.</span>}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4 w-full px-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num.toString())}
                  className="h-16 w-16 mx-auto rounded-full bg-slate-800/50 border border-slate-700 hover:bg-slate-700 hover:border-brand-500/50 text-2xl text-white font-medium transition-all active:scale-90 flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              
              <button
                onClick={handleClear}
                className="h-16 w-16 mx-auto rounded-full hover:bg-slate-800/50 text-sm text-slate-500 font-bold uppercase transition-all active:scale-90 flex items-center justify-center"
              >
                CLR
              </button>
              
              <button
                onClick={() => handleNumberClick('0')}
                className="h-16 w-16 mx-auto rounded-full bg-slate-800/50 border border-slate-700 hover:bg-slate-700 hover:border-brand-500/50 text-2xl text-white font-medium transition-all active:scale-90 flex items-center justify-center"
              >
                0
              </button>

              <button
                onClick={handleDelete}
                className="h-16 w-16 mx-auto rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-rose-400 transition-all active:scale-90 flex items-center justify-center"
              >
                <Delete size={24} />
              </button>
            </div>

            {view === 'register_pin' && (
              <>
                <button onClick={() => setView('register_preference')} className="mt-8 text-sm text-slate-500 hover:text-white transition-colors">
                  Back to Preferences
                </button>
                {/* PIN Warning */}
                <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-xs">
                  <div className="flex gap-2 items-start">
                    <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-amber-500/80">
                      <span className="font-bold">Remember this PIN!</span> No recovery option if forgotten. Use backups regularly.
                    </p>
                  </div>
                </div>
              </>
            )}

            {view === 'login' && (
              <button 
                onClick={() => setShowResetConfirm(true)} 
                className="mt-8 text-xs text-slate-600 hover:text-rose-400 transition-colors"
              >
                Forgot PIN? Reset App
              </button>
            )}
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trash2 size={24} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Reset Application?</h3>
                <p className="text-sm text-slate-400">
                  This will <span className="text-rose-400 font-bold">permanently delete</span> all your data including trades, accounts, and settings.
                </p>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-rose-400 text-center">
                  ⚠️ Make sure you've exported your trade logs before resetting!
                </p>
              </div>

              <div className="mb-4">
                <label className="text-xs text-slate-500 mb-2 block">Type <span className="font-mono font-bold text-white">RESET</span> to confirm:</label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={e => setResetConfirmText(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-center font-mono focus:border-rose-500 outline-none"
                  placeholder="Type RESET"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleResetApp}
                  disabled={resetConfirmText !== 'RESET'}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition-colors"
                >
                  Reset Everything
                </button>
                <button
                  onClick={() => {
                    setShowResetConfirm(false);
                    setResetConfirmText('');
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
            <p className="text-xs text-slate-600">Protected by Pips&Profit Security Layer v2.1</p>
        </div>

      </div>
    </div>
  );
};

export default AuthScreen;