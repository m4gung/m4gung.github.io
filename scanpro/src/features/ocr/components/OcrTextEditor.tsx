import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Search, Download, Copy, Edit2, Save, X } from 'lucide-react'

interface OcrTextEditorProps {
  text: string
  confidence: number
  onSave?: (text: string) => void
  onClose?: () => void
  readOnly?: boolean
}

export const OcrTextEditor = ({ text, confidence, onSave, onClose, readOnly = false }: OcrTextEditorProps) => {
  const [editedText, setEditedText] = useState(text)
  const [isEditing, setIsEditing] = useState(!readOnly)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [currentMatch, setCurrentMatch] = useState(0)

  const handleSearch = () => {
    if (!searchQuery) {
      setSearchResults([])
      setCurrentMatch(0)
      return
    }
    const results: number[] = []
    let index = editedText.toLowerCase().indexOf(searchQuery.toLowerCase())
    while (index !== -1) {
      results.push(index)
      index = editedText.toLowerCase().indexOf(searchQuery.toLowerCase(), index + 1)
    }
    setSearchResults(results)
    setCurrentMatch(0)
  }

  const goToMatch = (matchIndex: number) => {
    if (searchResults.length === 0) return
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (textarea) {
      const pos = searchResults[matchIndex]
      textarea.setSelectionRange(pos, pos + searchQuery.length)
      textarea.focus()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">Hasil OCR</span>
          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
            Kepercayaan: {Math.round(confidence * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); handleSearch(); }}
              placeholder="Cari teks..."
              className="pl-8 pr-8 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm w-64"
            />
            {searchResults.length > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {currentMatch + 1} / {searchResults.length}
              </span>
            )}
          </div>
          {!readOnly && isEditing && (
            <Button variant="secondary" size="sm" onClick={() => { if (onSave) onSave(editedText); setIsEditing(false); }}>
              <Save className="mr-1 h-3 w-3" />
              Simpan
            </Button>
          )}
          {!readOnly && !isEditing && (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-1 h-3 w-3" />
              Edit
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(editedText)} title="Salin">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            const blob = new Blob([editedText], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'ocr-result.txt'
            a.click()
            URL.revokeObjectURL(url)
          }}>
            <Download className="h-4 w-4" />
          </Button>
          {onClose && <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>}
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full h-96 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
            spellCheck={false}
          />
        ) : (
          <pre className="w-full h-96 p-4 overflow-auto text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono bg-white dark:bg-gray-900">
            {editedText || '(kosong)'}
          </pre>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <button onClick={() => { setCurrentMatch((c) => (c - 1 + searchResults.length) % searchResults.length); goToMatch(currentMatch); }} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Sebelumnya</button>
          <button onClick={() => { setCurrentMatch((c) => (c + 1) % searchResults.length); goToMatch(currentMatch); }} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Berikutnya</button>
        </div>
      )}
    </div>
  )
}