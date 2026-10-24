import { useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { ImportImageService } from '../../../application/services/ImportImageService'
import { useDocumentStore } from '../../stores/documentStore'

export const ImageImport = () => {
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importService = new ImportImageService()

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    setIsImporting(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await importService.importImage(file)

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Gagal mengimpor gambar')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengimpor gambar')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    await handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Import Dokumen</h2>

      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={false}
          className="hidden"
          onChange={(e) => {
            handleFileSelect(e.target.files)
            e.target.value = ''
          }}
        />
        <Button
          isFullWidth
          isLoading={isImporting}
          onClick={() => fileInputRef.current?.click()}
        >
          Pilih Gambar
        </Button>
        <p className="mt-2 text-sm text-gray-500">Atau seret dan lepaskan gambar di sini</p>
      </div>

      {error && <div className="mt-4 bg-red-50 text-red-700 p-4 rounded">{error}</div>}
      {success && <div className="mt-4 bg-green-50 text-green-700 p-4 rounded">Gambar berhasil diimpor!</div>}
    </div>
  )
}
