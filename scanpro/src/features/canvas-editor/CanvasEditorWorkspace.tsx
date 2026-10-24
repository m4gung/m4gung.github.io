import { useState, useEffect, useCallback } from 'react'
import { useCanvasStore } from '../../../stores/canvasStore'
import { CanvasViewport } from './components/CanvasViewport'
import { Toolbar } from './components/Toolbar'
import { PropertiesPanel } from './components/PropertiesPanel'
import { LayersPanel } from './components/LayersPanel'
import { Button } from '../../../components/ui/Button'
import { Save, Download, Upload, FilePlus, RotateCcw, RotateCw, Image, Printer, ChevronLeft, Plus, Minus, Undo2, Redo2 } from 'lucide-react'

export const CanvasEditorWorkspace = () => {
  const {
    document,
    activePageIndex,
    activeTool,
    history: { past, future },
    viewport,
    grid,
    canUndo,
    canRedo,
    undo,
    redo,
    createDocument,
    addPage,
    removePage,
    duplicatePage,
    setActivePage,
    setViewport,
    resetViewport,
    setGrid,
    setActiveTool,
    getSelectedElements,
    exportToBlob,
  } = useCanvasStore()

  const [showProperties, setShowProperties] = useState(true)
  const [showLayers, setShowLayers] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(280)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault()
      redo()
    } else if (e.key === 'Escape') {
      useCanvasStore.getState().deselectAll()
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      useCanvasStore.getState().deleteSelectedElements()
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault()
      useCanvasStore.getState().duplicateSelectedElements()
    } else if (e.key === 'g') {
      setGrid({ enabled: !grid.enabled })
    } else if (e.key === '0') {
      resetViewport()
    } else if (e.key === '=' || e.key === '+') {
      setViewport({ scale: viewport.scale * 1.1 })
    } else if (e.key === '-') {
      setViewport({ scale: viewport.scale * 0.9 })
    }
  }, [undo, redo, setViewport, resetViewport, setGrid, grid.enabled, viewport.scale])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <Image className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Canvas Editor</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Buat dokumen canvas baru untuk mulai menggambar dan mengedit</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => createDocument('Dokumen Baru', 1)} size="lg" className="w-full">
              <FilePlus className="mr-2 h-4 w-4" />
              Buat Dokumen Baru
            </Button>
            <Button variant="secondary" onClick={() => createDocument('Dari Template', 1)} size="lg" className="w-full">
              <FilePlus className="mr-2 h-4 w-4" />
              Dari Template
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentPage = document.pages[activePageIndex]
  const selectedCount = getSelectedElements().length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="container mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-xs">{document.name}</h1>
            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              {activePageIndex + 1} / {document.pages.length}
            </span>
          </div>

          <Toolbar />

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              Zoom: {Math.round(viewport.scale * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo()} title="Undo (Ctrl+Z)">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo()} title="Redo (Ctrl+Shift+Z)">
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => addPage()} title="Tambah Halaman">
              <Plus className="mr-1 h-4 w-4" />
              Halaman
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportToBlob().then(blob => {
              if (blob) {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${document.name}.json`
                a.click()
                URL.revokeObjectURL(url)
              }
            })} title="Export Canvas">
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`w-${leftSidebarWidth / 4} flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 ${!showLayers ? 'w-10' : ''}`}
          style={{ width: showLayers ? leftSidebarWidth : 40 }}
        >
          <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 hidden sm:block">Pages</h3>
            <button
              onClick={() => setShowLayers(!showLayers)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showLayers ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {document.pages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => setActivePage(index)}
                className={`w-full flex items-center gap-2 p-2 rounded text-left transition-colors ${
                  index === activePageIndex
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex-1 truncate text-sm">Halaman {index + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicatePage(index); }}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title="Duplikat"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {document.pages.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removePage(index); }}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Hapus"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </button>
            ))}
            <button
              onClick={() => addPage()}
              className="w-full flex items-center justify-center gap-2 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Tambah Halaman</span>
            </button>
          </div>
          <div className="resize-x w-full h-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize" 
            onMouseDown={(e) => {
              const startX = e.clientX
              const startWidth = leftSidebarWidth
              const onMouseMove = (e: MouseEvent) => {
                setLeftSidebarWidth(Math.max(200, Math.min(500, startWidth + (e.clientX - startX))))
              }
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove)
                document.removeEventListener('mouseup', onMouseUp)
              }
              document.addEventListener('mousemove', onMouseMove)
              document.addEventListener('mouseup', onMouseUp)
            }} />
        </aside>

        <main className="flex-1 relative overflow-hidden">
          <CanvasViewport width={currentPage.width} height={currentPage.height} />
        </main>

        <aside
          className={`w-${sidebarWidth / 4} flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transition-all duration-200 ${!showProperties ? 'w-10' : ''}`}
          style={{ width: showProperties ? sidebarWidth : 40 }}
        >
          <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 hidden sm:block">Properties</h3>
            <button
              onClick={() => setShowProperties(!showProperties)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showProperties ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PropertiesPanel />
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <LayersPanel />
            </div>
          </div>
          <div className="resize-x w-full h-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize"
            onMouseDown={(e) => {
              const startX = e.clientX
              const startWidth = sidebarWidth
              const onMouseMove = (e: MouseEvent) => {
                setSidebarWidth(Math.max(200, Math.min(500, startWidth - (e.clientX - startX))))
              }
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove)
                document.removeEventListener('mouseup', onMouseUp)
              }
              document.addEventListener('mousemove', onMouseMove)
              document.addEventListener('mouseup', onMouseUp)
            }} />
</aside>
      </main>
    </div>
  </div>
  )
}

const Copy = () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>

const Minus = () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>

const ChevronRight = () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>

const ChevronLeft = () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>