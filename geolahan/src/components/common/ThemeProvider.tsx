import { useEffect, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { THEME_STORAGE_KEY, ThemeContext, isThemeMode, type ThemeContextValue } from '../../hooks/useTheme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useLocalStorage(THEME_STORAGE_KEY, 'system', isThemeMode);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'dark' ? '#0b1220' : '#047857');
  }, [resolved]);

  const value = useMemo<ThemeContextValue>(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
