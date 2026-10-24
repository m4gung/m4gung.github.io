import type {
  CanvasElement,
  TextElement,
  ShapeElement,
  FreehandElement,
  ImageElement,
  SignatureElement,
  StickyNoteElement,
  HighlightElement,
  Transform,
  Point,
  CanvasElementType,
} from '../../../domain/canvas'

export interface ElementFactoryOptions {
  type: CanvasElementType
  position: Point
  defaults?: Partial<CanvasElement>
}

export class CanvasElementFactory {
  private static idCounter = 0

  static generateId(): string {
    return `el_${Date.now()}_${++this.idCounter}`
  }

  static createDefaultTransform(position: Point, type: CanvasElementType): Transform {
    const defaults: Record<CanvasElementType, { width: number; height: number }> = {
      text: { width: 200, height: 50 },
      rectangle: { width: 100, height: 80 },
      ellipse: { width: 100, height: 80 },
      line: { width: 150, height: 2 },
      arrow: { width: 150, height: 2 },
      freehand: { width: 0, height: 0 },
      image: { width: 200, height: 150 },
      signature: { width: 0, height: 0 },
      'sticky-note': { width: 200, height: 200 },
      highlight: { width: 0, height: 0 },
    }

    const { width, height } = defaults[type] ?? { width: 100, height: 100 }

    return {
      x: position.x,
      y: position.y,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    }
  }

  static createElement(options: ElementFactoryOptions): CanvasElement {
    const id = this.generateId()
    const transform = this.createDefaultTransform(options.position, options.type)
    const now = new Date()

    const baseElement = {
      id,
      type: options.type,
      transform: { ...transform, ...options.defaults?.transform },
      zIndex: options.defaults?.zIndex ?? 0,
      visible: options.defaults?.visible ?? true,
      locked: options.defaults?.locked ?? false,
      opacity: options.defaults?.opacity ?? 1,
      createdAt: now,
      updatedAt: now,
    }

    switch (options.type) {
      case 'text':
        return {
          ...baseElement,
          type: 'text',
          content: options.defaults?.content ?? 'Teks baru',
          fontFamily: options.defaults?.fontFamily ?? 'system-ui',
          fontSize: options.defaults?.fontSize ?? 16,
          fontWeight: options.defaults?.fontWeight ?? 'normal',
          fontStyle: options.defaults?.fontStyle ?? 'normal',
          color: options.defaults?.color ?? '#000000',
          backgroundColor: options.defaults?.backgroundColor,
          textAlign: options.defaults?.textAlign ?? 'left',
          lineHeight: options.defaults?.lineHeight ?? 1.4,
          padding: options.defaults?.padding ?? 4,
        } as TextElement

      case 'rectangle':
      case 'ellipse':
      case 'line':
      case 'arrow':
        return {
          ...baseElement,
          type: options.type,
          strokeColor: options.defaults?.strokeColor ?? '#000000',
          strokeWidth: options.defaults?.strokeWidth ?? 2,
          strokeStyle: options.defaults?.strokeStyle ?? 'solid',
          fillColor: options.defaults?.fillColor,
          fillOpacity: options.defaults?.fillOpacity ?? 1,
        } as ShapeElement

      case 'freehand':
        return {
          ...baseElement,
          type: 'freehand',
          points: options.defaults?.points ?? [],
          strokeColor: options.defaults?.strokeColor ?? '#000000',
          strokeWidth: options.defaults?.strokeWidth ?? 2,
          strokeStyle: options.defaults?.strokeStyle ?? 'solid',
        } as FreehandElement

      case 'image':
        return {
          ...baseElement,
          type: 'image',
          src: options.defaults?.src ?? '',
          originalWidth: options.defaults?.originalWidth ?? 0,
          originalHeight: options.defaults?.originalHeight ?? 0,
          crop: options.defaults?.crop,
        } as ImageElement

      case 'signature':
        return {
          ...baseElement,
          type: 'signature',
          points: options.defaults?.points ?? [],
          strokeColor: options.defaults?.strokeColor ?? '#000000',
          strokeWidth: options.defaults?.strokeWidth ?? 2,
        } as SignatureElement

      case 'sticky-note':
        return {
          ...baseElement,
          type: 'sticky-note',
          content: options.defaults?.content ?? '',
          color: options.defaults?.color ?? '#fef08a',
          fontSize: options.defaults?.fontSize ?? 14,
        } as StickyNoteElement

      case 'highlight':
        return {
          ...baseElement,
          type: 'highlight',
          color: options.defaults?.color ?? '#fef08a',
          points: options.defaults?.points ?? [],
        } as HighlightElement

      default:
        throw new Error(`Unknown element type: ${options.type}`)
    }
  }

  static cloneElement(element: CanvasElement, offset: Point = { x: 20, y: 20 }): CanvasElement {
    const cloned = { ...element, id: this.generateId(), updatedAt: new Date() }
    cloned.transform = {
      ...cloned.transform,
      x: cloned.transform.x + offset.x,
      y: cloned.transform.y + offset.y,
    }
    return cloned
  }

  static serializeElement(element: CanvasElement): string {
    return JSON.stringify(element)
  }

  static deserializeElement(json: string): CanvasElement {
    return JSON.parse(json)
  }
}

export function getElementBounds(element: CanvasElement): { x: number; y: number; width: number; height: number } {
  const { transform } = element
  return {
    x: transform.x,
    y: transform.y,
    width: transform.width * transform.scaleX,
    height: transform.height * transform.scaleY,
  }
}

export function pointInElement(point: Point, element: CanvasElement): boolean {
  const bounds = getElementBounds(element)
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  )
}

export function getElementsAtPoint(point: Point, elements: CanvasElement[]): CanvasElement[] {
  return elements
    .filter((el) => el.visible && !el.locked && pointInElement(point, el))
    .sort((a, b) => a.zIndex - b.zIndex)
}