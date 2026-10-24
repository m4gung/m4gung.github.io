import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useDocumentStore } from '../../stores/documentStore'
import { RenameDocumentUseCase } from '../../application/use-cases/RenameDocument'

const renameDocumentUseCase = new RenameDocumentUseCase()

export const DocumentList = () => {
  const { documents, isLoading, error, loadDocuments, setSelectedDocument, deleteDocument } = useDocumentStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus dokumen ini?')) {
      await deleteDocument(id)
    }
  }

  const startEdit = (doc: { id: string; name: string }) => {
    setEditingId(doc.id)
    setEditName(doc.name)
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    const result = await renameDocumentUseCase.execute(id, editName.trim())
    if (result.success) {
      setEditingId(null)
      loadDocuments()
    } else {
      alert(result.error || 'Gagal mengganti nama')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') saveEdit(id)
    if (e.key === 'Escape') cancelEdit()
  }

  if (isLoading) {
    return <div className="p-4">Loading dokumen...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>
  }

  if (documents.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Belum ada dokumen.</p>
        <Button onClick={() => loadDocuments()}>Muat Ulang</Button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dokumen Anda</h2>
      </div>
      <div className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            {editingId === doc.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, doc.id)}
                  onBlur={() => saveEdit(doc.id)}
                  autoFocus
                  className="flex-1 px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <Button size="sm" onClick={() => saveEdit(doc.id)}>Simpan</Button>
                <Button variant="ghost" size="sm" onClick={cancelEdit}>Batal</Button>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0" onClick={() => setSelectedDocument(doc.id)}>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{doc.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {doc.pages.length} halaman
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); startEdit(doc); }}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(doc.id)
                    }}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}