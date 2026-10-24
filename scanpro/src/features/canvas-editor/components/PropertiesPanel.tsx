import { useCanvasStore } from '../../../stores/canvasStore'
import { useTranslation } from '../../../lib/i18n'

export const PropertiesPanel = () => {
  const { t } = useTranslation()
  const { getSelectedElements, updateElement, updateElementTransform, setElementOpacity, lockElement } = useCanvasStore()
  const selected = useCanvasStore.getState().getSelectedElements()

  if (selected.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p>{t('propertiesPanel.noElementSelected')}</p>
        <p className="text-sm mt-1">{t('propertiesPanel.clickToEdit')}</p>
      </div>
    )
  }

  if (selected.length > 1) {
    return (
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{t('propertiesPanel.multipleSelected', { count: selected.length })}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('propertiesPanel.opacity')}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selected[0].opacity}
              onChange={(e) => selected.forEach(el => setElementOpacity(el.id, parseFloat(e.target.value)))}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => selected.forEach(el => lockElement(el.id, true))}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('propertiesPanel.lockAll')}
            </button>
            <button
              onClick={() => selected.forEach(el => lockElement(el.id, false))}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('propertiesPanel.unlockAll')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const el = selected[0]

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-medium text-gray-900 dark:text-gray-100 capitalize">{t(`canvasEditor.tools.${el.type}`)} {t('propertiesPanel.properties')}</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('propertiesPanel.positionSize')}</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            step="0.1"
            value={el.transform.x}
            onChange={(e) => updateElementTransform(el.id, { x: parseFloat(e.target.value) })}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
            placeholder="X"
          />
          <input
            type="number"
            step="0.1"
            value={el.transform.y}
            onChange={(e) => updateElementTransform(el.id, { y: parseFloat(e.target.value) })}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
            placeholder="Y"
          />
          <input
            type="number"
            step="0.1"
            min="1"
            value={el.transform.width}
            onChange={(e) => updateElementTransform(el.id, { width: parseFloat(e.target.value) })}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
            placeholder={t('propertiesPanel.width')}
          />
          <input
            type="number"
            step="0.1"
            min="1"
            value={el.transform.height}
            onChange={(e) => updateElementTransform(el.id, { height: parseFloat(e.target.value) })}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
            placeholder={t('propertiesPanel.height')}
          />
          <input
            type="number"
            step="1"
            value={el.transform.rotation}
            onChange={(e) => updateElementTransform(el.id, { rotation: parseFloat(e.target.value) })}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
            placeholder={t('propertiesPanel.rotation')}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('propertiesPanel.opacity')}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={el.opacity}
          onChange={(e) => setElementOpacity(el.id, parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('propertiesPanel.zIndex')}</label>
        <input
          type="number"
          value={el.zIndex}
          onChange={(e) => updateElement(el.id, { zIndex: parseInt(e.target.value) })}
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => useCanvasStore.getState().lockElement(el.id, true)}
          disabled={el.locked}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          {t('propertiesPanel.lock')}
        </button>
        <button
          onClick={() => useCanvasStore.getState().lockElement(el.id, false)}
          disabled={!el.locked}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          {t('propertiesPanel.unlock')}
        </button>
      </div>

      {el.type === 'text' && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('propertiesPanel.textProperties')}</h4>
          <textarea
            value={el.content}
            onChange={(e) => updateElement(el.id, { content: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm min-h-[80px]"
            rows={4}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={el.fontSize}
              onChange={(e) => updateElement(el.id, { fontSize: parseInt(e.target.value) })}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
              placeholder={t('propertiesPanel.fontSize')}
            />
            <select
              value={el.fontFamily}
              onChange={(e) => updateElement(el.id, { fontFamily: e.target.value })}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
            >
              <option value="system-ui">System UI</option>
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
            </select>
            <select
              value={el.color}
              onChange={(e) => updateElement(el.id, { color: e.target.value })}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
            >
              <option value="#000000">{t('propertiesPanel.black')}</option>
              <option value="#ffffff">{t('propertiesPanel.white')}</option>
              <option value="#ef4444">{t('propertiesPanel.red')}</option>
              <option value="#3b82f6">{t('propertiesPanel.blue')}</option>
              <option value="#22c55e">{t('propertiesPanel.green')}</option>
              <option value="#f59e0b">{t('propertiesPanel.yellow')}</option>
              <option value="#a855f7">{t('propertiesPanel.purple')}</option>
            </select>
            <select
              value={el.textAlign}
              onChange={(e) => updateElement(el.id, { textAlign: e.target.value as any })}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
            >
              <option value="left">{t('propertiesPanel.left')}</option>
              <option value="center">{t('propertiesPanel.center')}</option>
              <option value="right">{t('propertiesPanel.right')}</option>
            </select>
          </div>
        </div>
      )}

      {(el.type === 'rectangle' || el.type === 'ellipse' || el.type === 'line' || el.type === 'arrow') && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('propertiesPanel.shapeProperties')}</h4>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="color"
              value={el.strokeColor}
              onChange={(e) => updateElement(el.id, { strokeColor: e.target.value })}
              className="h-10 w-full cursor-pointer"
            />
            <input
              type="color"
              value={el.fillColor ?? '#ffffff'}
              onChange={(e) => updateElement(el.id, { fillColor: e.target.value })}
              className="h-10 w-full cursor-pointer"
            />
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={el.strokeWidth}
              onChange={(e) => updateElement(el.id, { strokeWidth: parseFloat(e.target.value) })}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
              placeholder={t('propertiesPanel.strokeWidth')}
            />
            <select
              value={el.strokeStyle}
              onChange={(e) => updateElement(el.id, { strokeStyle: e.target.value as any })}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
            >
              <option value="solid">{t('propertiesPanel.solid')}</option>
              <option value="dashed">{t('propertiesPanel.dashed')}</option>
              <option value="dotted">{t('propertiesPanel.dotted')}</option>
            </select>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={el.fillOpacity}
              onChange={(e) => updateElement(el.id, { fillOpacity: parseFloat(e.target.value) })}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
              placeholder={t('propertiesPanel.fillOpacity')}
            />
          </div>
        </div>
      )}

      {(el.type === 'freehand' || el.type === 'signature') && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('propertiesPanel.strokeProperties')}</h4>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="color"
              value={el.strokeColor}
              onChange={(e) => updateElement(el.id, { strokeColor: e.target.value })}
              className="h-10 w-full cursor-pointer"
            />
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={el.strokeWidth}
              onChange={(e) => updateElement(el.id, { strokeWidth: parseFloat(e.target.value) })}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
              placeholder={t('propertiesPanel.strokeWidth')}
            />
            <select
              value={el.strokeStyle}
              onChange={(e) => updateElement(el.id, { strokeStyle: e.target.value as any })}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
            >
              <option value="solid">{t('propertiesPanel.solid')}</option>
              <option value="dashed">{t('propertiesPanel.dashed')}</option>
            </select>
          </div>
        </div>
      )}

      {(el.type === 'sticky-note') && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('propertiesPanel.stickyNoteProperties')}</h4>
          <textarea
            value={el.content}
            onChange={(e) => updateElement(el.id, { content: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm min-h-[80px]"
            rows={4}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="color"
              value={el.color}
              onChange={(e) => updateElement(el.id, { color: e.target.value })}
              className="h-10 w-full cursor-pointer"
            />
            <input
              type="number"
              value={el.fontSize}
              onChange={(e) => updateElement(el.id, { fontSize: parseInt(e.target.value) })}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
              placeholder={t('propertiesPanel.fontSize')}
            />
          </div>
        </div>
      )}

      {(el.type === 'highlight') && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('propertiesPanel.highlightProperties')}</h4>
          <input
            type="color"
            value={el.color}
            onChange={(e) => updateElement(el.id, { color: e.target.value })}
            className="h-10 w-full cursor-pointer"
          />
        </div>
      )}

      {(el.type === 'image') && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('propertiesPanel.imageProperties')}</h4>
          <p className="text-sm text-gray-500">{t('propertiesPanel.originalSize', { width: el.originalWidth, height: el.originalHeight })}</p>
        </div>
      )}
    </div>
  )
}