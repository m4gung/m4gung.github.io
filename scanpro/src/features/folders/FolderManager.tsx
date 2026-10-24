import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/Button'
import { CreateFolderUseCase, GetFoldersUseCase, UpdateFolderUseCase, DeleteFolderUseCase } from '../../application/use-cases/FolderUseCases'

const createFolderUseCase = new CreateFolderUseCase()
const getFoldersUseCase = new GetFoldersUseCase()
const updateFolderUseCase = new UpdateFolderUseCase()
const deleteFolderUseCase = new DeleteFolderUseCase()

export const FolderManager = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folders, setFolders] = useState<Array<{ id: string; name: string; documentCount: number }>>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    const fs = await getFoldersUseCase.execute()
    setFolders(fs.map(f => ({ id: f.id, name: f.name, documentCount: f.documentCount })))
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    setIsLoading(true)
    const result = await createFolderUseCase.execute({ name: newFolderName.trim() })
    setIsLoading(false)

    if (result.success) {
      setNewFolderName('')
      setIsOpen(false)
      loadFolders()
    } else {
      alert(result.error || 'Gagal membuat folder')
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Folder</h2>
        <Button variant="secondary" size="sm" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Tutup' : 'Tambah Folder'}
        </Button>
      </div>

      {isOpen && (
        <form onSubmit={handleCreateFolder} className="mb-4 flex gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nama folder baru"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500"
            required
          />
          <Button type="submit" isLoading={isLoading} size="sm">
            Buat
          </Button>
        </form>
      )}

      <div className="space-y-2">
        {folders.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Belum ada folder</p>
        ) : (
          folders.map((folder) => (
            <div key={folder.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-gray-100">{folder.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{folder.documentCount} dokumen</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}