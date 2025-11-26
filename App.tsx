import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Menu, Zap } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TrackingView from './components/TrackingView';
import TradeLog from './components/TradeLog';
import StrategyView from './components/StrategyView';
import AuthScreen from './components/AuthScreen';
import AccountSettingsModal from './components/AccountSettingsModal';
import { StoreProvider } from './context/StoreContext';

// Capacitor Status Bar (only runs on native)
const initStatusBar = async () => {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
  } catch (e) {
    // Not running on native platform
  }
};

const App = () => {
  useEffect(() => {
    initStatusBar();
  }, []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <StoreProvider>
      <HashRouter>
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans antialiased overflow-hidden selection:bg-brand-500/30 selection:text-brand-200">
          <AccountSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
          
          <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
            {/* Mobile Header */}
            <div className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center text-slate-900 shadow-lg shadow-brand-500/20">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    <span className="font-bold text-white tracking-tight">Pips&<span className="text-brand-500">Profit</span></span>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="text-slate-400 hover:text-white p-2 rounded-lg active:bg-slate-800 transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tracking" element={<TrackingView />} />
                <Route path="/trades" element={<TradeLog />} />
                <Route path="/strategies" element={<StrategyView />} />
                {/* Redirects */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </HashRouter>
    </StoreProvider>
  );
};

export default App;