import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { loginEmail, registerEmail, resetPassword } from '../src/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { theme, isLightTheme } = useTheme();
  const textPrimary = isLightTheme ? 'text-slate-800' : 'text-white';
  const textSecondary = isLightTheme ? 'text-slate-600' : 'text-slate-400';
  const inputBg = isLightTheme ? '#f8fafc' : 'rgba(51,65,85,0.3)';

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirm, setAuthConfirm] = useState('');
  const [authStatus, setAuthStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAuthStatus(null);
      setAuthPassword('');
      setAuthConfirm('');
    }
  }, [isOpen]);

  const handleAuthSubmit = async () => {
    setAuthStatus(null);
    if (!authEmail.trim() || !authPassword) {
      setAuthStatus({ type: 'error', message: 'Email and password are required.' });
      return;
    }
    if (authMode === 'signup' && authPassword !== authConfirm) {
      setAuthStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    try {
      setIsAuthSubmitting(true);
      if (authMode === 'signup') {
        await registerEmail(authEmail.trim(), authPassword);
      } else {
        await loginEmail(authEmail.trim(), authPassword);
      }
      setAuthStatus({ type: 'success', message: 'Signed in successfully.' });
      setAuthPassword('');
      setAuthConfirm('');
      setTimeout(() => {
        onClose();
        setAuthStatus(null);
      }, 800);
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String((error as any).code) : '';
      const messageMap: Record<string, string> = {
        'auth/email-already-in-use': 'Email already in use. Try signing in.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
        'auth/wrong-password': 'Incorrect password. Try again.',
        'auth/user-not-found': 'No account found with that email.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.'
      };
      setAuthStatus({ type: 'error', message: messageMap[code] || 'Authentication failed. Please try again.' });
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!authEmail.trim()) {
      setAuthStatus({ type: 'error', message: 'Enter your email first.' });
      return;
    }
    try {
      await resetPassword(authEmail.trim());
      setAuthStatus({ type: 'success', message: 'Password reset email sent.' });
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String((error as any).code) : '';
      const messageMap: Record<string, string> = {
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-not-found': 'No account found with that email.'
      };
      setAuthStatus({ type: 'error', message: messageMap[code] || 'Reset failed. Please try again.' });
    }
  };

  if (!isOpen) return null;

  return (
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
            <h3 className={`text-lg font-bold ${textPrimary}`}>
              {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </h3>
            <button
              onClick={onClose}
              className={`p-1 hover:bg-slate-800 rounded-lg transition-colors ${textSecondary}`}
            >
              <X size={20} />
            </button>
          </div>
          <p className={`text-sm ${textSecondary}`}>
            {authMode === 'signin' ? 'Access cloud backup and sync.' : 'Create an account to sync across devices.'}
          </p>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className={`text-xs font-semibold ${textSecondary} mb-1 block`}>Email</label>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="you@email.com"
              className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${textPrimary}`}
              style={{ backgroundColor: inputBg, border: `1px solid ${theme.primary}30` }}
            />
          </div>
          <div>
            <label className={`text-xs font-semibold ${textSecondary} mb-1 block`}>Password</label>
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Min 6 characters"
              className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${textPrimary}`}
              style={{ backgroundColor: inputBg, border: `1px solid ${theme.primary}30` }}
            />
          </div>
          {authMode === 'signup' && (
            <div>
              <label className={`text-xs font-semibold ${textSecondary} mb-1 block`}>Confirm Password</label>
              <input
                type="password"
                value={authConfirm}
                onChange={(e) => setAuthConfirm(e.target.value)}
                placeholder="Repeat password"
                className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${textPrimary}`}
                style={{ backgroundColor: inputBg, border: `1px solid ${theme.primary}30` }}
              />
            </div>
          )}

          {authStatus && (
            <p className="text-xs" style={{ color: authStatus.type === 'success' ? theme.primary : theme.secondary }}>
              {authStatus.message}
            </p>
          )}

          <button
            onClick={handleAuthSubmit}
            disabled={isAuthSubmitting}
            className="w-full py-3 rounded-xl font-medium text-white transition-colors"
            style={{ backgroundColor: theme.primary, opacity: isAuthSubmitting ? 0.7 : 1 }}
          >
            {isAuthSubmitting ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              className={`${textSecondary} hover:text-brand-400`}
            >
              {authMode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
            {authMode === 'signin' && (
              <button onClick={handleResetPassword} className={`${textSecondary} hover:text-brand-400`}>
                Forgot password?
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className={`w-full py-2 rounded-xl font-medium text-sm ${textSecondary}`}
            style={{ backgroundColor: isLightTheme ? '#e2e8f0' : 'rgba(51,65,85,0.5)' }}
          >
            Continue Offline
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
