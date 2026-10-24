import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CanvasElementFactory } from '../../infrastructure/canvas/canvasElementFactory'
import type { TextElement, ShapeElement, FreehandElement, StickyNoteElement } from '../../domain/canvas'

describe('CanvasElementFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create text element with defaults', () => {
    const element = CanvasElementFactory.createElement({
      type: 'text',
      position: { x: 100, y: 100 },
    }) as TextElement

    expect(element.id).toMatch(/^el_\d+_\d+$/)
    expect(element.type).toBe('text')
    expect(element.content).toBe('Teks baru')
    expect(element.transform.x).toBe(100)
    expect(element.transform.y).toBe(100)
    expect(element.transform.width).toBe(200)
    expect(element.transform.height).toBe(50)
  })

  it('should create rectangle element with defaults', () => {
    const element = CanvasElementFactory.createElement({
      type: 'rectangle',
      position: { x: 50, y: 50 },
    }) as ShapeElement

    expect(element.type).toBe('rectangle')
    expect(element.strokeColor).toBe('#000000')
    expect(element.strokeWidth).toBe(2)
    expect(element.fillColor).toBeUndefined()
  })

  it('should create freehand element', () => {
    const element = CanvasElementFactory.createElement({
      type: 'freehand',
      position: { x: 0, y: 0 },
    }) as FreehandElement

    expect(element.type).toBe('freehand')
    expect(element.points).toEqual([])
    expect(element.strokeWidth).toBe(2)
  })

  it('should create sticky-note element', () => {
    const element = CanvasElementFactory.createElement({
      type: 'sticky-note',
      position: { x: 100, y: 100 },
    }) as StickyNoteElement

    expect(element.type).toBe('sticky-note')
    expect(element.color).toBe('#fef08a')
    expect(element.fontSize).toBe(14)
  })

  it('should clone element with offset', () => {
    const original = CanvasElementFactory.createElement({
      type: 'text',
      position: { x: 100, y: 100 },
    }) as TextElement

    const cloned = CanvasElementFactory.cloneElement(original, { x: 20, y: 20 }) as TextElement

    expect(cloned.id).not.toBe(original.id)
    expect(cloned.transform.x).toBe(120)
    expect(cloned.transform.y).toBe(120)
    expect(cloned.content).toBe(original.content)
  })

  it('should apply custom defaults', () => {
    const element = CanvasElementFactory.createElement({
      type: 'text',
      position: { x: 0, y: 0 },
      defaults: {
        content: 'Custom Text',
        fontSize: 24,
        color: '#ff0000',
      },
    }) as TextElement

    expect(element.content).toBe('Custom Text')
    expect(element.fontSize).toBe(24)
    expect(element.color).toBe('#ff0000')
  })
})