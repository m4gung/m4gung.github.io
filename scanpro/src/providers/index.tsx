import type { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'

export { useTheme, ThemeProvider } from './ThemeProvider'

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}