import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Scan, FileText, Palette, Folder } from 'lucide-react'

export const MobileNavBar = () => {
  const location = useLocation()

  const tabs = [
    { to: '/', label: 'Home', icon: Sparkles },
    { to: '/scan', label: 'Scan', icon: Scan, isPrimary: true },
    { to: '/pdf', label: 'PDF', icon: FileText },
    { to: '/canvas', label: 'Canvas', icon: Palette },
    { to: '/documents', label: 'Files', icon: Folder },
  ]

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 pb-safe shadow-lg">
      <nav className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.to || (tab.to !== '/' && location.pathname.startsWith(tab.to))

          if (tab.isPrimary) {
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className="relative -top-5 flex flex-col items-center group"
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 ring-4 ring-white dark:ring-gray-900 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                  {tab.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
