import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useTheme } from '../../providers/ThemeProvider'
import { FolderManager } from '../folders/FolderManager'
import { useTranslation } from '../../lib/i18n'

export const Settings = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { t, setLocale, getAvailableLocales, getLocaleName } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('settings.title')}</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('settings.theme.title')}</h3>
        <div className="flex gap-4">
          {(['light', 'dark', 'system'] as const).map((t_) => (
            <label key={t_} className="flex items-center gap-2">
              <input
                type="radio"
                name="theme"
                value={t_}
                checked={theme === t_}
                onChange={() => setTheme(t_)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="capitalize text-gray-700 dark:text-gray-300">
                {t_ === 'system' ? t('settings.theme.system') : t_ === 'light' ? t('settings.theme.light') : t('settings.theme.dark')}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t('settings.theme.current')}: <strong>{resolvedTheme === 'dark' ? t('settings.theme.dark') : t('settings.theme.light')}</strong>
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('settings.language')}</h3>
        <select
          value={getAvailableLocales().find(l => l === 'id') ? 'id' : 'en'}
          onChange={(e) => setLocale(e.target.value as 'id' | 'en')}
          className="mt-2 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700"
        >
          {['id', 'en'].map((locale) => (
            <option key={locale} value={locale}>
              {locale === 'id' ? 'Bahasa Indonesia' : 'English'}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('settings.folders.title')}</h3>
        <FolderManager />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('settings.system.title')}</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <li>- {t('settings.system.pwaInstallable')}</li>
          <li>- {t('settings.system.offlineFirst')}</li>
          <li>- {t('settings.system.localStorage')}</li>
          <li>- {t('settings.system.localOcr')}</li>
        </ul>
      </div>
    </div>
  )
}