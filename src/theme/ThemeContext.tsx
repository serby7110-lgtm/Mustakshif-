/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Theme Context & Provider (مستكشف)
 * Manages light / dark mode (deep teal palette) with local storage persistence,
 * system synchronization, and immediate DOM class application on app startup.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { ThemeColors, lightPalette, darkPalette } from './tokens';
import { storage, ThemeMode } from '../data/storage';
import {
  evaluateAutoDarkMode,
  subscribeAmbientLight,
  AutoDarkDecision,
} from '../utils/autoDarkMode';

export interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  tokens: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isAutoDark: boolean;
  toggleAutoDark: () => void;
  setAutoDark: (enabled: boolean) => void;
  autoDarkDescription: string;
  autoDarkReason: 'sensor' | 'sunset' | null;
  currentLux: number | null;
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

  const [isAutoDark, setIsAutoDarkState] = useState<boolean>(() => {
    return storage.getAutoDarkMode();
  });

  const [currentLux, setCurrentLux] = useState<number | null>(null);
  const [autoDecision, setAutoDecision] = useState<AutoDarkDecision>(() =>
    evaluateAutoDarkMode(null)
  );

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

  // Auto Dark Mode effect: ambient light sensor + sunset/sunrise timer
  useEffect(() => {
    if (!isAutoDark) return;

    // Immediate calculation
    const dec = evaluateAutoDarkMode(currentLux);
    setAutoDecision(dec);
    setThemeState(dec.isDark ? 'dark' : 'light');

    // Subscribe to ambient light sensor if available
    const unsubSensor = subscribeAmbientLight((lux) => {
      setCurrentLux(lux);
      const sensorDec = evaluateAutoDarkMode(lux);
      setAutoDecision(sensorDec);
      setThemeState(sensorDec.isDark ? 'dark' : 'light');
    });

    // Periodic check every 30s for sunset / sunrise transition
    const interval = setInterval(() => {
      const timerDec = evaluateAutoDarkMode(currentLux);
      setAutoDecision(timerDec);
      setThemeState(timerDec.isDark ? 'dark' : 'light');
    }, 30000);

    return () => {
      clearInterval(interval);
      if (unsubSensor) unsubSensor();
    };
  }, [isAutoDark, currentLux]);

  // Listen to system preference changes when not explicitly set and auto mode is off
  useEffect(() => {
    if (isAutoDark) return;
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
  }, [isAutoDark]);

  const toggleTheme = useCallback(() => {
    // If auto dark was active, turning manual switches it off to respect explicit user action
    if (isAutoDark) {
      setIsAutoDarkState(false);
      storage.setAutoDarkMode(false);
    }
    setThemeState((prev) => (prev === 'dark' || (prev as string) === 'darkTeal' ? 'light' : 'dark'));
  }, [isAutoDark]);

  const setTheme = useCallback((mode: ThemeMode) => {
    if (isAutoDark) {
      setIsAutoDarkState(false);
      storage.setAutoDarkMode(false);
    }
    setThemeState(mode);
  }, [isAutoDark]);

  const toggleAutoDark = useCallback(() => {
    setIsAutoDarkState((prev) => {
      const next = !prev;
      storage.setAutoDarkMode(next);
      if (next) {
        const dec = evaluateAutoDarkMode(currentLux);
        setAutoDecision(dec);
        setThemeState(dec.isDark ? 'dark' : 'light');
      }
      return next;
    });
  }, [currentLux]);

  const setAutoDark = useCallback((enabled: boolean) => {
    setIsAutoDarkState(enabled);
    storage.setAutoDarkMode(enabled);
    if (enabled) {
      const dec = evaluateAutoDarkMode(currentLux);
      setAutoDecision(dec);
      setThemeState(dec.isDark ? 'dark' : 'light');
    }
  }, [currentLux]);

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
      isAutoDark,
      toggleAutoDark,
      setAutoDark,
      autoDarkDescription: autoDecision.description,
      autoDarkReason: isAutoDark ? autoDecision.reason : null,
      currentLux,
    }),
    [isDark, tokens, toggleTheme, setTheme, isAutoDark, toggleAutoDark, setAutoDark, autoDecision, currentLux]
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
      isAutoDark: false,
      toggleAutoDark: () => {},
      setAutoDark: () => {},
      autoDarkDescription: 'توقيت الغروب والشروق',
      autoDarkReason: null,
      currentLux: null,
    };
  }
  return context;
};

export default ThemeContext;
