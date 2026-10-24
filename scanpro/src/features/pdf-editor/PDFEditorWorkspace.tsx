import { useState, useEffect } from 'react'
import { PDFPageRenderer } from './components/PDFPageRenderer'
import { Button } from '../../../components/ui/Button'
import { usePDFStore } from '../../../stores/pdfStore'
import {
  RotateCw, RotateCcw, Trash2, GripVertical, Download, FilePlus, Save, Printer, ChevronLeft, ChevronRight,
  FileText, LayoutGrid, Minus, Plus,
} from 'lucide-react'

export const PDFEditorWorkspace = () => {
  const {
    pdfPages,
    isLoading,
    isProcessing,
    error,
    currentDocument,
    rotatePage,
    deletePage,
    reorderPages,
    exportPDF,
    printPDF,
    generateThumbnails,
    clearCurrentDocument,
    setError,
    clearError,
  } = usePDFStore()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  useEffect(() => {
    if (currentDocument) {
      generateThumbnails()
    }
  }, [currentDocument])

  const togglePageSelection = (pageNumber: number) => {
    const newSelection = new Set(selectedPages)
    if (newSelection.has(pageNumber)) {
      newSelection.delete(pageNumber)
    } else {
      newSelection.add(pageNumber)
    }
    setSelectedPages(newSelection)
  }

  const selectAll = () => {
    if (selectedPages.size === pdfPages.length) {
      setSelectedPages(new Set())
    } else {
      setSelectedPages(new Set(pdfPages.map((p) => p.pageNumber)))
    }
  }

  const handleRotate = async (pageNumber: number, direction: 'cw' | 'ccw') => {
    await rotatePage(String(pageNumber), direction === 'cw' ? 90 : -90)
  }

  const handleDelete = async (pageNumber: number) => {
    if (confirm(`Hapus halaman ${pageNumber}?`)) {
      await deletePage(String(pageNumber))
    }
  }

  const handleDragStart = (index: number) => {
    setDraggingIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggingIndex !== null && draggingIndex !== index) {
      const pages = [...pdfPages]
      const [removed] = pages.splice(draggingIndex, 1)
      pages.splice(index, 0, removed)
      const newOrder = pages.map((p) => String(p.pageNumber))
      reorderPages(newOrder)
      setDraggingIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggingIndex(null)
  }

  const handleExport = async () => {
    const blob = await exportPDF()
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentDocument?.name || 'document'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (!currentDocument) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Belum Ada Dokumen PDF</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Import file PDF untuk mulai mengedit</p>
          <PDFImportStarter />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={clearCurrentDocument}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-xs">{currentDocument.name}</h1>
            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              {pdfPages.length} halaman
            </span>
          </div>

          <div className="flex items-center gap-2">
            {error && <div className="text-red-600 text-sm mr-4">{error}</div>}

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                aria-label="List view"
              >
                <FileText className="h-4 w-4" />
              </button>
            </div>

            <Button variant="secondary" size="sm" onClick={handleExport} disabled={isProcessing}>
              <Download className="h-4 w-4 mr-1" />
              Ekspor PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={printPDF} disabled={isProcessing}>
              <Printer className="h-4 w-4 mr-1" />
              Cetak
            </Button>
          </div>
        </div>
      </header>

      {selectedPages.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
          <div className="container mx-auto flex items-center justify-between">
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {selectedPages.size} halaman dipilih
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { selectedPages.forEach(p => rotatePage(p, 90)); setSelectedPages(new Set()); }}>
                <RotateCw className="h-3 w-3 mr-1" /> Putar 90°
              </Button>
              <Button variant="danger" size="sm" onClick={() => { selectedPages.forEach(p => deletePage(p)); setSelectedPages(new Set()); }}>
                <Trash2 className="h-3 w-3 mr-1" /> Hapus
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Halaman ({pdfPages.length})
              </h2>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPages.size === pdfPages.length}
                  onChange={selectAll}
                  className="h-4 w-4 text-blue-600"
                />
                Pilih Semua
              </label>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pdfPages.map((page, index) => (
                  <div
                    key={page.pageNumber}
                    className={`relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-shadow ${
                      selectedPages.has(page.pageNumber) ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                    }`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="absolute top-2 right-2 flex gap-1 p-1 bg-white/90 dark:bg-gray-800/90 rounded opacity-0 hover:opacity-100 transition-opacity">
                      <input
                        type="checkbox"
                        checked={selectedPages.has(page.pageNumber)}
                        onChange={() => togglePageSelection(page.pageNumber)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <Button variant="ghost" size="sm" className="p-1" onClick={(e) => { e.stopPropagation(); handleRotate(page.pageNumber, 'cw'); }}>
                        <RotateCw className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1" onClick={(e) => { e.stopPropagation(); handleRotate(page.pageNumber, 'ccw'); }}>
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1 text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(page.pageNumber); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <PDFPageRenderer pageNumber={page.pageNumber} scale={1.2} />
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Halaman {page.pageNumber}</span>
                        <span className="text-gray-500 dark:text-gray-400">{Math.round(page.width)}×{Math.round(page.height)}</span>
                      </div>
                      {page.rotation !== 0 && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">Rotasi: {page.rotation}°</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {pdfPages.map((page, index) => (
                  <div
                    key={page.pageNumber}
                    className={`flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow ${
                      selectedPages.has(page.pageNumber) ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                    }`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPages.has(page.pageNumber)}
                      onChange={() => togglePageSelection(page.pageNumber)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <PDFPageRenderer pageNumber={page.pageNumber} scale={0.5} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">Halaman {page.pageNumber}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round(page.width)}×{Math.round(page.height)} {page.rotation !== 0 && `• Rotasi: ${page.rotation}°`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleRotate(page.pageNumber, 'cw')}>
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRotate(page.pageNumber, 'ccw')}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(page.pageNumber)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pdfPages.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p>Tidak ada halaman dalam dokumen ini</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

const PDFImportStarter = () => {
  const [file, setFile] = useState<File | null>(null)
  const { importPDF } = usePDFStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (file) await importPDF(file)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
        <FilePlus className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">Seret file PDF ke sini atau klik untuk memilih</p>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
          id="pdf-import"
        />
        <label htmlFor="pdf-import" className="mt-4 inline-block">
          <Button variant="secondary" type="button">Pilih File</Button>
        </label>
      </div>
      {file && (
        <Button type="submit" className="w-full" size="lg">
          Import {file.name}
        </Button>
      )}
    </form>
  )
}