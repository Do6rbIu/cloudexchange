import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { darkTheme, lightTheme, type Theme } from '../components/shared/theme';

interface ThemeContextValue {
  dark: boolean;
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'cx-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    document.body.style.background = dark ? darkTheme.bg : lightTheme.bg;
    document.body.style.color = dark ? darkTheme.text : lightTheme.text;
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);

  const value = useMemo<ThemeContextValue>(
    () => ({ dark, theme: dark ? darkTheme : lightTheme, toggle }),
    [dark, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
