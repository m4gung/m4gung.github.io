import { useRef, useEffect, useState, useCallback } from 'react'
import { CanvasRenderer, createCanvasRenderer } from '../../../infrastructure/canvas/canvasRenderer'
import { useCanvasStore } from '../../../stores/canvasStore'
import type { Point } from '../../../domain/canvas'

interface CanvasViewportProps {
  width: number
  height: number
}

export const CanvasViewport = ({ width, height }: CanvasViewportProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CanvasRenderer | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const {
    document,
    activePageIndex,
    activeTool,
    viewport,
    grid,
    selectedIds,
    getElement,
  } = useCanvasStore()

  const currentPage = document?.pages[activePageIndex]

  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = createCanvasRenderer(canvasRef.current)
      setIsMounted(true)
    }
    return () => {
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!rendererRef.current || !currentPage) return

    const renderer = rendererRef.current
    renderer.setViewport(viewport.scale, viewport.x, viewport.y)
    renderer.clear()

    if (grid.enabled) {
      renderer.renderGrid(grid.size)
    }

    if (currentPage.backgroundImage) {
      const img = new Image()
      img.src = currentPage.backgroundImage
      renderer.ctx.save()
      renderer.ctx.globalAlpha = 0.5
      renderer.ctx.drawImage(img, 0, 0, currentPage.width, currentPage.height)
      renderer.ctx.restore()
    }

    currentPage.elements.forEach((element) => {
      const isSelected = selectedIds.includes(element.id)
      const isHovered = false
      renderer.renderElement(element, isSelected, isHovered)
    })
  }, [document, activePageIndex, viewport, grid, selectedIds, currentPage])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || !rendererRef.current) return

    const point: Point = rendererRef.current.screenToCanvas(e.clientX - rect.left, e.clientY - rect.top)
    const { activeTool } = useCanvasStore.getState()

    if (activeTool === 'select') {
      const elements = currentPage?.elements.filter((el) => !el.locked && el.visible) ?? []
      const hit = elements
        .filter((el) => {
          const bounds = {
            x: el.transform.x,
            y: el.transform.y,
            width: el.transform.width * el.transform.scaleX,
            height: el.transform.height * el.transform.scaleY,
          }
          return point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
                 point.y >= bounds.y && point.y <= bounds.y + bounds.height
        })
        .sort((a, b) => b.zIndex - a.zIndex)[0]

      if (hit) {
        if (e.shiftKey) {
          useCanvasStore.getState().selectElement(hit.id, true)
        } else {
          useCanvasStore.getState().selectElement(hit.id, false)
        }
      } else {
        useCanvasStore.getState().deselectAll()
      }
    } else {
      useCanvasStore.getState().startDrawing(point)
    }
  }, [currentPage])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { isDrawing, activeTool } = useCanvasStore.getState()
    if (!isDrawing || !rendererRef.current || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const point: Point = rendererRef.current.screenToCanvas(e.clientX - rect.left, e.clientY - rect.top)
    useCanvasStore.getState().continueDrawing(point)
  }, [])

  const handleMouseUp = useCallback(() => {
    useCanvasStore.getState().endDrawing()
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const { viewport } = useCanvasStore.getState()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.1, Math.min(5, viewport.scale * delta))
    useCanvasStore.getState().setViewport({ scale: newScale })
  }, [])

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block"
        style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      {!isMounted && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <p>Canvas loading...</p>
        </div>
      )}
    </div>
  )
}