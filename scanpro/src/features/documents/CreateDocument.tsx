import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useDocumentStore } from '../../stores/documentStore'

export const CreateDocument = () => {
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { createDocument, isLoading, error } = useDocumentStore()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsCreating(true)
    try {
      const result = await createDocument({
        name: name.trim(),
        type: 'document',
        status: 'active',
        pages: [],
        version: 1,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          accessCount: 0,
        },
      })
      if (result) {
        // Navigate to dashboard or document list
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dokumen Baru</h2>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-6">{error}</div>}

      <form onSubmit={handleCreate} className="max-w-md">
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nama Dokumen
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
            placeholder="Contoh: Kontrak Kerja"
            required
          />
        </div>

        <div className="flex space-x-4">
          <Button type="submit" isLoading={isCreating} isFullWidth>
            Buat Dokumen
          </Button>
        </div>
      </form>
    </div>
  )
}
