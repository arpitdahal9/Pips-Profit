import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, ListChecks, Wallet } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, isLightTheme } = useTheme();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/trades', icon: BookOpen, label: 'Journal' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/trade-setup', icon: ListChecks, label: 'Trade Setup' },
    { path: '/settings', icon: Wallet, label: 'Accounts' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Blur background */}
      <div
        className="absolute inset-0 backdrop-blur-xl"
        style={{
          backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.9)' : `${theme.bgSolid}ee`,
          borderTop: `1px solid ${theme.primary}20`
        }}
      />

      <div className="relative flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300`}
              style={{
                color: isActive ? theme.primary : (isLightTheme ? '#64748b' : '#64748b')
              }}
            >
              {isActive && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{
                    backgroundColor: theme.primary,
                    boxShadow: `0 0 10px ${theme.primary}`
                  }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                style={isActive ? { filter: `drop-shadow(0 0 8px ${theme.primary}80)` } : {}}
              />
              <span
                className={`text-[10px] mt-1 font-medium`}
                style={isActive ? { textShadow: `0 0 10px ${theme.primary}80` } : {}}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
