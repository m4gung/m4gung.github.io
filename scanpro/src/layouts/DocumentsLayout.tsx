import { Outlet, Link } from 'react-router-dom'
import { ArrowLeft, FolderOpen } from 'lucide-react'
import { Button } from '../components/ui/Button'

export const DocumentsLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dokumen</h1>
          </div>
          <Link to="/documents/new">
            <Button size="sm">
              <FolderOpen className="mr-2 h-4 w-4" />
              Dokument Baru
            </Button>
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
