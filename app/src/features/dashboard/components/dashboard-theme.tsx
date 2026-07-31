'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { cn } from '@/utils/cn';

import {
  DASHBOARD_THEME_COOKIE,
  type DashboardThemeMode,
} from './dashboard-theme-cookie';

export type { DashboardThemeMode };

const DashboardThemeContext = createContext<{
  theme: DashboardThemeMode;
  setTheme: (theme: DashboardThemeMode) => void;
} | null>(null);

export function useDashboardTheme() {
  const context = useContext(DashboardThemeContext);
  if (!context) {
    throw new Error('useDashboardTheme must be used within DashboardTheme');
  }
  return context;
}

const subscribeToSystemTheme = (onChange: () => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
};

const getSystemPrefersDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches;

// ponytail: server assumes dark for "system" mode; light-OS users get a
// one-frame correction after hydration. Blocking script if it ever matters.
const getServerPrefersDark = () => true;

type DashboardThemeProps = {
  initialTheme: DashboardThemeMode;
  children: ReactNode;
};

export function DashboardTheme({
  initialTheme,
  children,
}: DashboardThemeProps) {
  const [theme, setThemeState] = useState<DashboardThemeMode>(initialTheme);

  // The server's initialTheme can be stale when this mounts from a cached RSC
  // payload (client router cache) or a bfcache restore — the cookie is the
  // source of truth once we're in the browser.
  useEffect(() => {
    const syncFromCookie = () => {
      const value = document.cookie.match(
        new RegExp(`(?:^|; )${DASHBOARD_THEME_COOKIE}=(light|dark|system)`),
      )?.[1];
      if (value) setThemeState(value as DashboardThemeMode);
    };
    syncFromCookie();
    window.addEventListener('pageshow', syncFromCookie);
    return () => window.removeEventListener('pageshow', syncFromCookie);
  }, []);

  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemPrefersDark,
    getServerPrefersDark,
  );

  const setTheme = (next: DashboardThemeMode) => {
    document.cookie = `${DASHBOARD_THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setThemeState(next);
  };

  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  return (
    <DashboardThemeContext.Provider value={{ theme, setTheme }}>
      <div className={cn('dashboard-theme contents', isDark && 'dark')}>
        {children}
      </div>
    </DashboardThemeContext.Provider>
  );
}
