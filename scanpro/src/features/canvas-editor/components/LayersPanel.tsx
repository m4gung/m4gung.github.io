import { useCanvasStore } from '../../../../stores/canvasStore'
import { Button } from '../../../../components/ui/Button'
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy, GripVertical, ChevronUp, ChevronDown, Layers } from 'lucide-react'

export const LayersPanel = () => {
  const { document, activePageIndex, updateElement, deleteSelectedElements, lockElement, bringToFront, sendToBack, duplicateSelectedElements } = useCanvasStore()
  const page = document?.pages[activePageIndex]
  const elements = page?.elements ?? []

  return (
    <div className="h-full overflow-y-auto p-4 space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Layer ({elements.length})
        </h3>
      </div>

      {elements.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          Tidak ada layer. Tambahkan elemen dari toolbar.
        </p>
      ) : (
        <div className="space-y-1">
          {elements
            .slice()
            .sort((a, b) => b.zIndex - a.zIndex)
            .map((el, index) => (
              <div
                key={el.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-xs text-gray-500 dark:text-gray-400 w-6 text-right">{elements.length - index}</span>
                
                <button
                  onClick={() => updateElement(el.id, { visible: !el.visible })}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title={el.visible ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {el.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                
                <button
                  onClick={() => lockElement(el.id, !el.locked)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title={el.locked ? 'Buka Kunci' : 'Kunci'}
                >
                  {el.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </button>
                
                <div className="flex-1 min-w-0 p-1">
                  <div className="flex items-center gap-1 text-sm truncate">
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{getElementLabel(el)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{el.type}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Z: {el.zIndex} • {Math.round(el.transform.width)}×{Math.round(el.transform.height)}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button onClick={() => bringToFront(el.id)} title="Ke Depan" className="p-1 text-gray-500 hover:text-gray-700"><ChevronUp className="h-3 w-3" /></button>
                  <button onClick={() => sendToBack(el.id)} title="Ke Belakang" className="p-1 text-gray-500 hover:text-gray:700"><ChevronDown className="h-3 w-3" /></button>
                  <button onClick={() => duplicateSelectedElements()} title="Duplikat" className="p-1 text-gray-500 hover:text-gray-700"><Copy className="h-3 w-3" /></button>
                  <button onClick={() => { /* select then delete */ }} title="Hapus" className="p-1 text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function getElementLabel(el: any): string {
  switch (el.type) {
    case 'text':
      return el.content.slice(0, 20) || 'Text'
    case 'sticky-note':
      return el.content.slice(0, 20) || 'Sticky Note'
    case 'image':
      return `Image ${el.originalWidth}×${el.originalHeight}`
    default:
      return el.type.charAt(0).toUpperCase() + el.type.slice(1)
  }
}