import React, { useState, useEffect } from 'react';
import { Zap, ArrowRight, Lock, Delete, User, AlertTriangle, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const { clearAllData } = useStore();
  const [view, setView] = useState<'register_name' | 'register_pin' | 'set_lockout' | 'login'>('register_name');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [lockoutTime, setLockoutTime] = useState('15');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [storedUser, setStoredUser] = useState<{ name: string; pin: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('velox_user');
    if (userData) {
      setStoredUser(JSON.parse(userData));
      setView('login');
    }
  }, []);

  const handlePinInput = (digit: string) => {
    if (lockUntil && Date.now() < lockUntil) return;
    setError('');
    if (view === 'register_pin') {
      if (pin.length < 6) setPin(pin + digit);
      else if (confirmPin.length < 6) setConfirmPin(confirmPin + digit);
    } else {
      if (pin.length < 6) setPin(pin + digit);
    }
  };

  const handleDelete = () => {
    if (lockUntil && Date.now() < lockUntil) return;
    if (view === 'register_pin') {
      if (confirmPin.length > 0) setConfirmPin(confirmPin.slice(0, -1));
      else if (pin.length > 0) setPin(pin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (lockUntil && Date.now() < lockUntil) return;
    setPin('');
    setConfirmPin('');
    setError('');
  };

  const handleResetPin = async () => {
    // Clear all app data via store (state + storage + cloud)
    await clearAllData();

    // Reset local auth state
    setStoredUser(null);
    setShowResetConfirm(false);
    setPin('');
    setName('');
    setView('register_name');
    // Clear lockout state
    setFailedAttempts(0);
    setLockUntil(null);
    setError('');
  };

  useEffect(() => {
    if (view === 'register_pin' && pin.length === 6 && confirmPin.length === 6) {
      if (pin === confirmPin) {
        setView('set_lockout');
      } else {
        setError('PINs do not match');
        setConfirmPin('');
      }
    }
  }, [confirmPin, pin, view]);

  const handleCompleteRegistration = () => {
    const userData = {
      name,
      pin,
      lockoutTime,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('velox_user', JSON.stringify(userData));
    onAuthenticated();
  };

  useEffect(() => {
    if (view === 'login' && pin.length === 6 && storedUser) {
      if (pin === storedUser.pin) {
        setFailedAttempts(0);
        setLockUntil(null);
        onAuthenticated();
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 3) {
          const lockUntilTime = Date.now() + 30000;
          setLockUntil(lockUntilTime);
          setError('Too many attempts. Try again in 30 seconds.');
        } else {
          setError('Incorrect PIN');
        }
        setPin('');
      }
    }
  }, [pin, view, storedUser, onAuthenticated, failedAttempts]);

  useEffect(() => {
    if (!lockUntil) return;
    const interval = setInterval(() => {
      if (Date.now() >= lockUntil) {
        setLockUntil(null);
        setFailedAttempts(0);
        setError('');
      } else {
        const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
        setError(`Too many attempts. Try again in ${remaining} seconds.`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  const renderPinDots = (currentPin: string, total: number = 6) => (
    <div className="flex justify-center gap-3 my-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-all duration-200 ${i < currentPin.length
            ? 'bg-[#8b5cf6] shadow-[0_0_10px_#8b5cf6]'
            : 'bg-slate-700'
            }`}
        />
      ))}
    </div>
  );

  const renderNumpad = () => (
    <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
        <button
          key={num}
          onClick={() => handlePinInput(num.toString())}
          disabled={lockUntil !== null && Date.now() < lockUntil}
          className="w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-2xl font-semibold text-white hover:bg-[#8b5cf6]/10 hover:border-[#8b5cf6]/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {num}
        </button>
      ))}
      <button
        onClick={handleClear}
        disabled={lockUntil !== null && Date.now() < lockUntil}
        className="w-20 h-20 rounded-2xl bg-slate-800/30 border border-slate-700/30 text-xs font-medium text-slate-500 hover:text-[#f472b6] hover:border-[#f472b6]/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        CLR
      </button>
      <button
        onClick={() => handlePinInput('0')}
        disabled={lockUntil !== null && Date.now() < lockUntil}
        className="w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-2xl font-semibold text-white hover:bg-[#8b5cf6]/10 hover:border-[#8b5cf6]/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        0
      </button>
      <button
        onClick={handleDelete}
        disabled={lockUntil !== null && Date.now() < lockUntil}
        className="w-20 h-20 rounded-2xl bg-slate-800/30 border border-slate-700/30 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Delete size={24} />
      </button>
    </div>
  );

  return (
    <div
      className="min-h-screen w-full gradient-animated flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top, 20px)' }}
    >
      {/* Ambient Effects */}
      <div className="absolute top-[-30%] left-[-20%] w-[600px] h-[600px] bg-[#8b5cf6]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[600px] h-[600px] bg-[#ec4899]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="z-10 flex flex-col items-center w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-2xl flex items-center justify-center text-white shadow-2xl neon-glow mb-4">
            <Zap size={36} fill="currentColor" />
          </div>
          <h1 className="font-bold text-2xl text-white tracking-tight">
            Day Trading <span className="text-[#8b5cf6] neon-text">Journal</span>
          </h1>
        </div>

        {/* Register Name View */}
        {view === 'register_name' && (
          <div className="w-full">
            <div className="stat-card p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center">
                  <User size={20} className="text-[#8b5cf6]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Welcome</h2>
                  <p className="text-xs text-slate-500">Enter your name to get started</p>
                </div>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-[#8b5cf6]/50 focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            <button
              onClick={() => name.trim() && setView('register_pin')}
              disabled={!name.trim()}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed neon-glow"
              style={{
                background: name.trim() ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : '#1e293b',
                color: name.trim() ? 'white' : '#64748b'
              }}
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Register PIN View */}
        {view === 'register_pin' && (
          <div className="w-full text-center">
            <div className="flex items-center gap-3 justify-center mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center">
                <Lock size={20} className="text-[#8b5cf6]" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              {pin.length < 6 ? 'Create PIN' : 'Confirm PIN'}
            </h2>
            <p className="text-xs text-slate-500 mb-2">
              {pin.length < 6 ? 'Choose a 6-digit PIN' : 'Re-enter your PIN to confirm'}
            </p>

            {error && (
              <p className="text-[#f472b6] text-sm mb-2">{error}</p>
            )}

            {renderPinDots(pin.length < 6 ? pin : confirmPin)}
            {renderNumpad()}
          </div>
        )}

        {/* Set Lockout View */}
        {view === 'set_lockout' && (
          <div className="w-full">
            <div className="stat-card p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center">
                  <Lock size={20} className="text-[#8b5cf6]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Security Settings</h2>
                  <p className="text-xs text-slate-500">How long before the app locks?</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { value: '15', label: '15 Minutes (Default)' },
                  { value: '30', label: '30 Minutes' },
                  { value: '60', label: '1 Hour' },
                  { value: 'never', label: 'Never Lock' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLockoutTime(option.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${lockoutTime === option.value
                      ? 'border-[#8b5cf6] bg-[#8b5cf6]/10 text-white'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    <span className="font-medium">{option.label}</span>
                    {lockoutTime === option.value && <div className="w-4 h-4 rounded-full bg-[#8b5cf6] flex items-center justify-center"><Check size={10} className="text-white" /></div>}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCompleteRegistration}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all neon-glow"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white'
              }}
            >
              Finish Setup <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Login View */}
        {view === 'login' && storedUser && (
          <div className="w-full text-center">
            <h2 className="text-xl font-bold text-white mb-1">
              Welcome back, {storedUser.name}
            </h2>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-2 mb-2">
              <Lock size={12} /> Enter your PIN to unlock
            </p>

            {error && (
              <p className="text-[#f472b6] text-sm mb-2">{error}</p>
            )}

            {renderPinDots(pin)}
            {renderNumpad()}

            {/* Forgot PIN button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="mt-6 text-xs text-slate-500 hover:text-[#f472b6] transition-colors"
            >
              Forgot PIN?
            </button>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-700">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-[#f472b6]/10 flex items-center justify-center">
                  <AlertTriangle size={28} className="text-[#f472b6]" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-2">Reset PIN?</h3>
              <p className="text-sm text-slate-400 text-center mb-6">
                <span className="text-[#f472b6] font-semibold">Warning:</span> This will permanently delete <span className="text-white font-medium">ALL</span> your data including trades, accounts, and settings. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-medium text-sm bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPin}
                  className="flex-1 py-3 rounded-xl font-medium text-sm bg-[#f472b6] text-white hover:bg-[#ec4899] transition-colors"
                >
                  Reset Everything
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthScreen;
