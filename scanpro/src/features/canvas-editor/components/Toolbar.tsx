import { useCanvasStore } from '../../../stores/canvasStore'
import { Button } from '../../../components/ui/Button'
import { useTranslation } from '../../../lib/i18n'
import {
  MousePointer, Type, Square, Circle, Minus, ArrowRight, Pencil, Image, PenTool, StickyNote, Highlighter,
  RotateCcw, RotateCw, Copy, Trash2, Layers, Lock, Unlock, Maximize, Minimize, Grid,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react'

const tools = [
  { id: 'select', icon: MousePointer, label: 'canvasEditor.tools.select', shortcut: 'V' },
  { id: 'text', icon: Type, label: 'canvasEditor.tools.text', shortcut: 'T' },
  { id: 'rectangle', icon: Square, label: 'canvasEditor.tools.rectangle', shortcut: 'R' },
  { id: 'ellipse', icon: Circle, label: 'canvasEditor.tools.ellipse', shortcut: 'E' },
  { id: 'line', icon: Minus, label: 'canvasEditor.tools.line', shortcut: 'L' },
  { id: 'arrow', icon: ArrowRight, label: 'canvasEditor.tools.arrow', shortcut: 'A' },
  { id: 'freehand', icon: Pencil, label: 'canvasEditor.tools.freehand', shortcut: 'F' },
  { id: 'image', icon: Image, label: 'canvasEditor.tools.image', shortcut: 'I' },
  { id: 'signature', icon: PenTool, label: 'canvasEditor.tools.signature', shortcut: 'S' },
  { id: 'sticky-note', icon: StickyNote, label: 'canvasEditor.tools.stickyNote', shortcut: 'N' },
  { id: 'highlight', icon: Highlighter, label: 'canvasEditor.tools.highlight', shortcut: 'H' },
] as const

export const Toolbar = () => {
  const { t } = useTranslation()
  const { activeTool, setActiveTool, undo, redo, canUndo, canRedo, grid, setGrid, viewport, resetViewport, viewport: { scale } } = useCanvasStore()

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo()}
          title={t('canvasEditor.shortcuts.undo')}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo()}
          title={t('canvasEditor.shortcuts.redo')}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
        {tools.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant={activeTool === id ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTool(id)}
            title={t(label)}
            className="p-1.5"
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
        <Button variant="ghost" size="sm" onClick={() => useCanvasStore.getState().deselectAll()} title={t('canvasEditor.shortcuts.deselect')}>
          <MousePointer className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => useCanvasStore.getState().deleteSelectedElements()} title={t('canvasEditor.shortcuts.delete')}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => useCanvasStore.getState().duplicateSelectedElements()} title={t('canvasEditor.shortcuts.duplicate')}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => {
          const selected = useCanvasStore.getState().getSelectedElements()
          if (selected.length > 0) useCanvasStore.getState().bringToFront(selected[0].id)
        }} title="Bring to Front">
          <Layers className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => {
          const selected = useCanvasStore.getState().getSelectedElements()
          if (selected.length > 0) useCanvasStore.getState().sendToBack(selected[0].id)
        }} title="Send to Back">
          <Layers className="h-4 w-4" style={{ transform: 'rotate(180deg)' }} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => {
          const selected = useCanvasStore.getState().getSelectedElements()
          selected.forEach(el => useCanvasStore.getState().lockElement(el.id, true))
        }} title="Lock">
          <Lock className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => {
          const selected = useCanvasStore.getState().getSelectedElements()
          selected.forEach(el => useCanvasStore.getState().lockElement(el.id, false))
        }} title="Unlock">
          <Unlock className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
        <Button variant="ghost" size="sm" onClick={() => setGrid({ enabled: !grid.enabled })} title={`${t('canvasEditor.grid.show')} ${grid.enabled ? 'Off' : 'On'} (G)`} className={grid.enabled ? 'bg-blue-100 dark:bg-blue-900' : ''}>
          <Grid className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setGrid({ snap: !grid.snap })} title={`${t('canvasEditor.grid.snap')} ${grid.snap ? 'Off' : 'On'}`} className={grid.snap ? 'bg-blue-100 dark:bg-blue-900' : ''}>
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
        <Button variant="ghost" size="sm" onClick={() => useCanvasStore.getState().setViewport({ scale: viewport.scale * 0.9 })} title="Zoom Out (-)">
          <Minimize className="h-4 w-4" />
        </Button>
        <span className="px-2 text-sm text-gray-600 dark:text-gray-400">{Math.round(scale * 100)}%</span>
        <Button variant="ghost" size="sm" onClick={() => useCanvasStore.getState().setViewport({ scale: viewport.scale * 1.1 })} title="Zoom In (+)">
          <Maximize className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={resetViewport} title={t('canvasEditor.shortcuts.resetZoom')}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <span className="text-xs text-gray-500 dark:text-gray-400">Zoom: {Math.round(scale * 100)}%</span>
      </div>
    </div>
  )
}