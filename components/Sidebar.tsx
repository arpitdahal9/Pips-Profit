import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Activity, 
  Settings, 
  Zap,
  ListChecks,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSettings?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse, onOpenSettings }) => {
  const location = useLocation();
  const { user } = useStore();

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => {
          if (window.innerWidth < 768) {
            onClose();
          }
        }}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-brand-500/10 text-brand-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-brand-500/20' 
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
        } ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? label : undefined}
      >
        <Icon size={18} className={`transition-colors flex-shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-500 group-hover:text-slate-300'}`} />
        {!isCollapsed && <span>{label}</span>}
        {!isCollapsed && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`
        fixed md:relative top-0 left-0 h-full
        ${isCollapsed ? 'w-16' : 'w-64'} bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-40 shadow-2xl
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand */}
        <div className={`p-6 ${isCollapsed ? 'pb-6' : 'pb-8'} flex justify-between items-center ${isCollapsed ? 'flex-col gap-2' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-3'}`}>
              <div className="relative w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center text-slate-900 font-black shadow-lg shadow-brand-500/20">
                  <Zap size={24} fill="currentColor" />
              </div>
              {!isCollapsed && (
                <div>
                    <h1 className="font-bold text-xl text-white tracking-tight leading-none">Pips&<span className="text-brand-500">Profit</span></h1>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Pro Terminal</span>
                </div>
              )}
          </div>
          <div className="flex items-center gap-2">
            {/* Desktop Collapse Toggle */}
            {onToggleCollapse && (
              <button 
                onClick={onToggleCollapse} 
                className="hidden md:flex text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            )}
            {/* Mobile Close Button */}
            <button onClick={onClose} className="md:hidden text-slate-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'} space-y-8`}>
          <div>
              {!isCollapsed && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">Main</div>}
              <div className="space-y-1">
                  <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                  <NavItem to="/trades" icon={BookOpen} label="Trade Journal" />
                  <NavItem to="/tracking" icon={Activity} label="Live Terminal" />
              </div>
          </div>

          <div>
              {!isCollapsed && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">Configuration</div>}
              <div className="space-y-1">
                  <NavItem to="/strategies" icon={ListChecks} label="Strategies" />
              </div>
          </div>
        </div>

        {/* User Section */}
        {!isCollapsed && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <button 
              onClick={onOpenSettings}
              className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-800 transition-colors group"
            >
              <div className="relative">
                <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Trader'}&background=10b981&color=0f172a&bold=true`} alt="User" className="w-10 h-10 rounded-full border-2 border-slate-700 group-hover:border-brand-500 transition-colors" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-500 border-2 border-slate-900 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Trader'}</p>
                <p className="text-xs text-slate-400 truncate">Free Account</p>
              </div>
              <Settings size={16} className="text-slate-500 group-hover:text-white transition-colors" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;