/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Theme Context & Provider (مستكشف)
 * Manages light / dark mode (deep teal palette) with local storage persistence,
 * system synchronization, and immediate DOM class application on app startup.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ThemeColors, lightPalette, darkPalette } from './tokens';
import { storage, ThemeMode } from '../data/storage';

export interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  tokens: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function safeGetStoredTheme(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('mustakshif_theme_mode_v1');
    }
  } catch {}
  return null;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return storage.getThemeMode();
  });

  const isDark = theme === 'dark' || (theme as string) === 'darkTeal';

  // Apply classes to document root on start and whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.classList.add('dark', 'dark-teal');
      body.classList.add('dark', 'dark-teal');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark', 'dark-teal');
      body.classList.remove('dark', 'dark-teal');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    storage.setThemeMode(theme);
  }, [theme, isDark]);

  // Listen to system preference changes when not explicitly set
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = safeGetStoredTheme();
      if (!stored) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' || (prev as string) === 'darkTeal' ? 'light' : 'dark'));
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const tokens = useMemo<ThemeColors>(() => {
    return isDark ? darkPalette : lightPalette;
  }, [isDark]);

  const value = useMemo(
    () => ({
      theme: (isDark ? 'dark' : 'light') as ThemeMode,
      isDark,
      tokens,
      toggleTheme,
      setTheme,
    }),
    [isDark, tokens]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback for components or tests running outside provider
    const isDarkFallback = false;
    return {
      theme: 'light',
      isDark: isDarkFallback,
      tokens: lightPalette,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
};

export default ThemeContext;
