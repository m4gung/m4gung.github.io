import { Link, useLocation } from 'react-router-dom'
import {
  Scan, FileText, Palette, FileSearch, Layers, Folder, Settings, Sun, Moon,
  Sparkles, Globe
} from 'lucide-react'
import { useTheme } from '../../providers/ThemeProvider'
import { useTranslation, useI18n } from '../../lib/i18n'

export const Header = () => {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const { locale, setLocale } = useI18n()

  const navItems = [
    { to: '/', label: 'Dashboard', icon: Sparkles },
    { to: '/scan', label: 'Scan', icon: Scan },
    { to: '/pdf', label: 'PDF Editor', icon: FileText },
    { to: '/canvas', label: 'Canvas', icon: Palette },
    { to: '/ocr', label: 'OCR', icon: FileSearch },
    { to: '/advanced-pdf', label: 'Advanced PDF', icon: Layers },
    { to: '/documents', label: 'Documents', icon: Folder },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const toggleLocale = () => {
    const nextLocale = locale === 'id' ? 'en' : 'id'
    setLocale(nextLocale)
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-300 bg-clip-text text-transparent">
              ScanPro
            </span>
            <span className="text-[10px] tracking-widest font-semibold uppercase px-1.5 py-0.5 ml-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Studio
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Quick Utility Actions */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition"
            title="Toggle Language"
            aria-label="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>{locale}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
          </button>
        </div>
      </div>
    </header>
  )
}
