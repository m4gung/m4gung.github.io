export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Transform {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
}

export type CanvasElementType = 
  | 'text'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'freehand'
  | 'image'
  | 'signature'
  | 'sticky-note'
  | 'highlight'

export interface BaseCanvasElement {
  id: string
  type: CanvasElementType
  transform: Transform
  zIndex: number
  visible: boolean
  locked: boolean
  opacity: number
  selected?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TextElement extends BaseCanvasElement {
  type: 'text'
  content: string
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  color: string
  backgroundColor?: string
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  padding: number
}

export interface ShapeElement extends BaseCanvasElement {
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow'
  strokeColor: string
  strokeWidth: number
  strokeStyle: 'solid' | 'dashed' | 'dotted'
  fillColor?: string
  fillOpacity: number
}

export interface FreehandElement extends BaseCanvasElement {
  type: 'freehand'
  points: Point[]
  strokeColor: string
  strokeWidth: number
  strokeStyle: 'solid' | 'dashed'
}

export interface ImageElement extends BaseCanvasElement {
  type: 'image'
  src: string
  originalWidth: number
  originalHeight: number
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface SignatureElement extends BaseCanvasElement {
  type: 'signature'
  points: Point[]
  strokeColor: string
  strokeWidth: number
}

export interface StickyNoteElement extends BaseCanvasElement {
  type: 'sticky-note'
  content: string
  color: string
  fontSize: number
}

export interface HighlightElement extends BaseCanvasElement {
  type: 'highlight'
  color: string
  points: Point[]
}

export type CanvasElement = 
  | TextElement
  | ShapeElement
  | FreehandElement
  | ImageElement
  | SignatureElement
  | StickyNoteElement
  | HighlightElement

export interface CanvasState {
  elements: CanvasElement[]
  selectedIds: string[]
  viewport: {
    x: number
    y: number
    scale: number
  }
  activeTool: CanvasTool
  history: {
    past: CanvasElement[][]
    future: CanvasElement[][]
  }
  grid: {
    enabled: boolean
    size: number
    snap: boolean
  }
}

export type CanvasTool = 
  | 'select'
  | 'text'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'freehand'
  | 'image'
  | 'signature'
  | 'sticky-note'
  | 'highlight'
  | 'eraser'

export interface CanvasPage {
  id: string
  documentId: string
  pageIndex: number
  backgroundImage?: string
  backgroundColor: string
  elements: CanvasElement[]
  width: number
  height: number
  viewport: {
    x: number
    y: number
    scale: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface CanvasDocument {
  id: string
  name: string
  pages: CanvasPage[]
  activePageIndex: number
  settings: {
    defaultFontFamily: string
    defaultFontSize: number
    defaultStrokeColor: string
    defaultFillColor: string
    defaultStrokeWidth: number
  }
  createdAt: Date
  updatedAt: Date
}