import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useI18n } from '../lib/i18n'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  resolvedTheme: 'light',
})

export const useTheme = () => useContext(ThemeContext)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
}

export const ThemeProvider = ({ children, defaultTheme = 'light' }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const { locale, setLocale } = useI18n()

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  useEffect(() => {
    const root = document.documentElement
    const stored = localStorage.getItem('theme') as Theme | null
    const activeTheme = stored || defaultTheme

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const getResolvedTheme = () => {
      if (activeTheme === 'system') {
        return mediaQuery.matches ? 'dark' : 'light'
      }
      return activeTheme
    }

    setResolvedTheme(getResolvedTheme())

    const handleChange = (e: MediaQueryListEvent) => {
      if (activeTheme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [defaultTheme, theme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
  }, [resolvedTheme])

  // Sync locale with document lang
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}