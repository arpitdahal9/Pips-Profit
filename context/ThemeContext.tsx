import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme definitions
export const THEMES = {
  purple: {
    id: 'purple',
    name: 'Electric Violet',
    description: 'Bold & creative',
    primary: '#8b5cf6',
    primaryLight: '#a78bfa',
    primaryDark: '#7c3aed',
    secondary: '#f472b6',
    accent: '#fbbf24',
    bgGradient: 'linear-gradient(-45deg, #0a0612, #120a1e, #0f0a1a, #120a1e)',
    bgSolid: '#0a0612',
    cardBg: 'rgba(15, 10, 30, 0.9)',
  },
  green: {
    id: 'green',
    name: 'Neon Mint',
    description: 'Fresh & energetic',
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryDark: '#059669',
    secondary: '#f43f5e',
    accent: '#fbbf24',
    bgGradient: 'linear-gradient(-45deg, #0a1612, #0a1e18, #0a1a14, #0a1e18)',
    bgSolid: '#0a1612',
    cardBg: 'rgba(10, 22, 18, 0.9)',
  },
  blue: {
    id: 'blue',
    name: 'Ocean Blue',
    description: 'Calm & professional',
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',
    secondary: '#f97316',
    accent: '#fbbf24',
    bgGradient: 'linear-gradient(-45deg, #0a0f1a, #0a1420, #0a1218, #0a1420)',
    bgSolid: '#0a0f1a',
    cardBg: 'rgba(10, 15, 26, 0.9)',
  },
  gold: {
    id: 'gold',
    name: 'Golden Hour',
    description: 'Luxurious & warm',
    primary: '#f59e0b',
    primaryLight: '#fbbf24',
    primaryDark: '#d97706',
    secondary: '#ef4444',
    accent: '#8b5cf6',
    bgGradient: 'linear-gradient(-45deg, #1a1408, #201a0a, #1a160a, #201a0a)',
    bgSolid: '#1a1408',
    cardBg: 'rgba(26, 20, 8, 0.9)',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimalist',
    description: 'Clean & simple',
    primary: '#64748b',
    primaryLight: '#94a3b8',
    primaryDark: '#475569',
    secondary: '#ef4444',
    accent: '#22c55e',
    bgGradient: 'linear-gradient(-45deg, #0f0f0f, #171717, #141414, #171717)',
    bgSolid: '#0f0f0f',
    cardBg: 'rgba(23, 23, 23, 0.9)',
  },
  ledger: {
    id: 'ledger',
    name: 'Classic Ledger',
    description: 'Traditional register style',
    primary: '#166534',
    primaryLight: '#22c55e',
    primaryDark: '#14532d',
    secondary: '#dc2626',
    accent: '#0369a1',
    bgGradient: 'linear-gradient(-45deg, #fefce8, #fef9c3, #fefce8, #fef9c3)',
    bgSolid: '#fefce8',
    cardBg: 'rgba(255, 255, 255, 0.95)',
  },
};

export type ThemeId = keyof typeof THEMES;
export type Theme = typeof THEMES[ThemeId];

interface ThemeContextType {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  isLightTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('pips_theme');
    return (saved as ThemeId) || 'purple';
  });

  const theme = THEMES[themeId];
  const isLightTheme = themeId === 'ledger';

  useEffect(() => {
    localStorage.setItem('pips_theme', themeId);

    // Update CSS variables
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-primary-light', theme.primaryLight);
    root.style.setProperty('--theme-primary-dark', theme.primaryDark);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-bg-gradient', theme.bgGradient);
    root.style.setProperty('--theme-bg-solid', theme.bgSolid);
    root.style.setProperty('--theme-card-bg', theme.cardBg);
  }, [themeId, theme]);

  const setTheme = (id: ThemeId) => {
    setThemeId(id);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme, isLightTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
