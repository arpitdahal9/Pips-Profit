import React, { useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TradeLog from './components/TradeLog';
import CalendarPage from './components/CalendarPage';
import SettingsPage from './components/SettingsPage';
import BottomNav from './components/BottomNav';
import TradeSetup from './components/TradeSetup';
import { StoreProvider } from './context/StoreContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthModalProvider } from './context/AuthModalContext';
import AuthScreen from './components/AuthScreen';

// Capacitor Status Bar (only runs on native)
const initStatusBar = async (color: string) => {
  // Check if Capacitor is available and we're on native platform
  const isNative = typeof (window as any).Capacitor !== 'undefined' &&
    (window as any).Capacitor.isNativePlatform &&
    (window as any).Capacitor.isNativePlatform();

  if (!isNative) {
    return; // Skip on web
  }

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color });
  } catch (e) {
    // Not running on native platform or StatusBar not available
    console.debug('StatusBar not available on this platform');
  }
};

const AppContent = () => {
  const { theme, isLightTheme } = useTheme();

  useEffect(() => {
    initStatusBar(theme.bgSolid);
  }, [theme]);

  return (
    <div
      className={`flex flex-col w-full h-full min-h-screen font-sans antialiased overflow-hidden ${isLightTheme ? 'text-slate-800' : 'text-slate-200'}`}
      style={{
        background: theme.bgGradient,
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite'
      }}
    >
      {/* Header */}
      <header
        className="relative flex items-center justify-center px-4 shrink-0 z-30"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          paddingBottom: '12px',
        }}
      >
        {/* Gradient line under header */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}40, transparent)` }}
        />

        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
              boxShadow: `0 0 20px ${theme.primary}40`
            }}
          >
            <Zap size={20} fill="currentColor" />
          </div>
          <span className={`font-bold text-lg tracking-tight ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>
            Day Trading <span style={{ color: theme.primary }}>Journal</span>
          </span>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trades" element={<TradeLog />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/accounts" element={<SettingsPage />} />
          <Route path="/trade-setup" element={<TradeSetup />} />
          {/* Redirects */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

const App = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const hasShownRef = useRef(false);

  useEffect(() => {
    const handleVisibility = () => {
      const userData = localStorage.getItem('velox_user');
      if (!userData) return;

      const user = JSON.parse(userData);
      // Default to 15 minutes if not set
      const lockoutMinutes = user.lockoutTime === 'never' ? -1 : parseInt(user.lockoutTime || '15');

      if (document.visibilityState === 'hidden') {
        localStorage.setItem('velox_last_active', Date.now().toString());
      } else if (document.visibilityState === 'visible') {
        if (!hasShownRef.current) {
          hasShownRef.current = true;
          return;
        }

        if (lockoutMinutes === -1) return; // Never lock

        const lastActive = localStorage.getItem('velox_last_active');
        if (lastActive) {
          const elapsedMinutes = (Date.now() - parseInt(lastActive)) / (1000 * 60);
          if (elapsedMinutes > lockoutMinutes) {
            setIsUnlocked(false);
          }
        } else {
          // If no last active time (first launch/cleared), lock for safety
          setIsUnlocked(false);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return (
    <ThemeProvider>
      <StoreProvider>
        <AuthModalProvider>
          <HashRouter>
            {!isUnlocked ? (
              <AuthScreen onAuthenticated={() => setIsUnlocked(true)} />
            ) : (
              <AppContent />
            )}
          </HashRouter>
        </AuthModalProvider>
      </StoreProvider>
    </ThemeProvider>
  );
};

export default App;