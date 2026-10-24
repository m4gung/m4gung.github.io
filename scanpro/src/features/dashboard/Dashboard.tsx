import { Button } from '../../components/ui/Button'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../lib/i18n'

export const Dashboard = () => {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('dashboard.welcome')}</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('dashboard.welcome')}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('dashboard.subtitle')}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/scan"><Button>{t('dashboard.startScanning')}</Button></Link>
          <Link to="/pdf"><Button>{t('dashboard.features.scan.title')}</Button></Link>
          <Link to="/canvas"><Button>{t('dashboard.features.edit.title')}</Button></Link>
          <Link to="/ocr"><Button>{t('dashboard.features.ocr.title')}</Button></Link>
          <Link to="/advanced-pdf"><Button>{t('dashboard.features.pdf.title')}</Button></Link>
          <Link to="/documents/import"><Button>{t('dashboard.features.scan.title')}</Button></Link>
          <Link to="/documents/new"><Button variant="secondary">{t('dashboard.features.canvas.title')}</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('dashboard.features.scan.title')}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.features.scan.description')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('dashboard.features.edit.title')}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.features.edit.description')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('dashboard.features.ocr.title')}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.features.ocr.description')}</p>
        </div>
      </div>
    </div>
  )
}