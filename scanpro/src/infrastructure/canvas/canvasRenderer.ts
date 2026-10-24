import type {
  CanvasElement,
  TextElement,
  ShapeElement,
  FreehandElement,
  ImageElement,
  SignatureElement,
  StickyNoteElement,
  HighlightElement,
  Point,
  Transform,
} from '../../domain/canvas'

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private scale: number = 1
  private offsetX: number = 0
  private offsetY: number = 0

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not available')
    this.ctx = ctx
  }

  setViewport(scale: number, offsetX: number, offsetY: number): void {
    this.scale = scale
    this.offsetX = offsetX
    this.offsetY = offsetY
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }

  renderElement(element: CanvasElement, isSelected = false, isHovered = false): void {
    this.ctx.save()
    this.applyTransform(element.transform)
    this.ctx.globalAlpha = element.opacity

    switch (element.type) {
      case 'text':
        this.renderText(element as TextElement, isSelected)
        break
      case 'rectangle':
      case 'ellipse':
      case 'line':
      case 'arrow':
        this.renderShape(element as ShapeElement, isSelected)
        break
      case 'freehand':
        this.renderFreehand(element as FreehandElement, isSelected)
        break
      case 'image':
        this.renderImage(element as ImageElement, isSelected)
        break
      case 'signature':
        this.renderSignature(element as SignatureElement, isSelected)
        break
      case 'sticky-note':
        this.renderStickyNote(element as StickyNoteElement, isSelected)
        break
      case 'highlight':
        this.renderHighlight(element as HighlightElement, isSelected)
        break
    }

    if (isSelected || isHovered) {
      this.renderSelectionBounds(element.transform, isHovered)
    }

    this.ctx.restore()
  }

  private applyTransform(transform: Transform): void {
    this.ctx.translate(
      transform.x * this.scale + this.offsetX,
      transform.y * this.scale + this.offsetY
    )
    this.ctx.scale(transform.scaleX * this.scale, transform.scaleY * this.scale)
    this.ctx.rotate((transform.rotation * Math.PI) / 180)
  }

  private renderText(element: TextElement, isSelected: boolean): void {
    const { transform, content, fontFamily, fontSize, fontWeight, fontStyle, color, backgroundColor, textAlign, lineHeight, padding } = element

    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
    this.ctx.fillStyle = color
    this.ctx.textAlign = textAlign
    this.ctx.textBaseline = 'top'

    const lines = content.split('\n')
    const lineHeightPx = fontSize * lineHeight

    if (backgroundColor) {
      const maxWidth = Math.max(...lines.map(l => this.ctx.measureText(l).width))
      const totalHeight = lines.length * lineHeightPx
      this.ctx.fillStyle = backgroundColor
      this.ctx.fillRect(
        -padding,
        -padding,
        maxWidth + padding * 2,
        totalHeight + padding * 2
      )
      this.ctx.fillStyle = color
    }

    lines.forEach((line, i) => {
      const x = textAlign === 'center' ? 0 : textAlign === 'right' ? 0 : 0
      this.ctx.fillText(line, x, i * lineHeightPx)
    })
  }

  private renderShape(element: ShapeElement, isSelected: boolean): void {
    const { transform, strokeColor, strokeWidth, strokeStyle, fillColor, fillOpacity } = element
    const w = transform.width
    const h = transform.height

    this.ctx.strokeStyle = strokeColor
    this.ctx.lineWidth = strokeWidth / this.scale
    this.ctx.setLineDash(strokeStyle === 'dashed' ? [8, 4] : strokeStyle === 'dotted' ? [2, 4] : [])

    if (fillColor) {
      this.ctx.fillStyle = fillColor
      this.ctx.globalAlpha = fillOpacity
    }

    switch (element.type) {
      case 'rectangle':
        if (fillColor) this.ctx.fillRect(0, 0, w, h)
        this.ctx.strokeRect(0, 0, w, h)
        break
      case 'ellipse':
        this.ctx.beginPath()
        this.ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
        if (fillColor) this.ctx.fill()
        this.ctx.stroke()
        break
      case 'line':
        this.ctx.beginPath()
        this.ctx.moveTo(0, 0)
        this.ctx.lineTo(w, h)
        this.ctx.stroke()
        break
      case 'arrow':
        this.renderArrow(0, 0, w, h, strokeWidth / this.scale)
        break
    }
  }

  private renderArrow(x1: number, y1: number, x2: number, y2: number, lineWidth: number): void {
    const headLength = Math.max(10, lineWidth * 3)
    const angle = Math.atan2(y2 - y1, x2 - x1)

    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.moveTo(x2, y2)
    this.ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    )
    this.ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    )
    this.ctx.closePath()
    this.ctx.fillStyle = this.ctx.strokeStyle
    this.ctx.fill()
  }

  private renderFreehand(element: FreehandElement, isSelected: boolean): void {
    const { points, strokeColor, strokeWidth, strokeStyle } = element
    if (points.length < 2) return

    this.ctx.strokeStyle = strokeColor
    this.ctx.lineWidth = strokeWidth / this.scale
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.setLineDash(strokeStyle === 'dashed' ? [8, 4] : [])

    this.ctx.beginPath()
    this.ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y)
    }
    this.ctx.stroke()
  }

  private renderImage(element: ImageElement, isSelected: boolean): void {
    const { src, transform, crop } = element
    const img = new Image()
    img.src = src

    if (crop) {
      this.ctx.drawImage(
        img,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, transform.width, transform.height
      )
    } else {
      this.ctx.drawImage(img, 0, 0, transform.width, transform.height)
    }
  }

  private renderSignature(element: SignatureElement, isSelected: boolean): void {
    const { points, strokeColor, strokeWidth } = element
    if (points.length < 2) return

    this.ctx.strokeStyle = strokeColor
    this.ctx.lineWidth = strokeWidth / this.scale
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'

    this.ctx.beginPath()
    this.ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y)
    }
    this.ctx.stroke()
  }

  private renderStickyNote(element: StickyNoteElement, isSelected: boolean): void {
    const { transform, content, color, fontSize } = element
    const padding = 10

    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, transform.width, transform.height)

    this.ctx.font = `${fontSize}px system-ui`
    this.ctx.fillStyle = '#000'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'

    const lines = content.split('\n')
    const lineHeight = fontSize * 1.4

    lines.forEach((line, i) => {
      this.ctx.fillText(line, padding, padding + i * lineHeight)
    })
  }

  private renderHighlight(element: HighlightElement, isSelected: boolean): void {
    const { points, color } = element
    if (points.length < 3) return

    this.ctx.fillStyle = color
    this.ctx.globalAlpha = 0.3

    this.ctx.beginPath()
    this.ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y)
    }
    this.ctx.closePath()
    this.ctx.fill()
  }

  private renderSelectionBounds(transform: Transform, isHovered: boolean): void {
    const handleSize = 8 / this.scale
    const corners = [
      { x: 0, y: 0 },
      { x: transform.width, y: 0 },
      { x: transform.width, y: transform.height },
      { x: 0, y: transform.height },
    ]

    this.ctx.strokeStyle = isHovered ? '#3b82f6' : '#6366f1'
    this.ctx.lineWidth = 1 / this.scale
    this.ctx.setLineDash([4, 4])

    this.ctx.strokeRect(0, 0, transform.width, transform.height)
    this.ctx.setLineDash([])

    this.ctx.fillStyle = '#3b82f6'
    corners.forEach((corner) => {
      this.ctx.fillRect(
        corner.x - handleSize / 2,
        corner.y - handleSize / 2,
        handleSize,
        handleSize
      )
    })

    // Rotation handle
    const rotX = transform.width / 2
    const rotY = -20 / this.scale
    this.ctx.beginPath()
    this.ctx.arc(rotX, rotY, handleSize, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.stroke()
  }

  renderGrid(gridSize: number, color = '#e5e7eb'): void {
    const width = this.ctx.canvas.width
    const height = this.ctx.canvas.height
    const scaledGrid = gridSize * this.scale

    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 0.5 / this.scale

    for (let x = -this.offsetX % scaledGrid; x < width; x += scaledGrid) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, height)
      this.ctx.stroke()
    }

    for (let y = -this.offsetY % scaledGrid; y < height; y += scaledGrid) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(width, y)
      this.ctx.stroke()
    }
  }

  screenToCanvas(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale,
    }
  }

  canvasToScreen(canvasX: number, canvasY: number): Point {
    return {
      x: canvasX * this.scale + this.offsetX,
      y: canvasY * this.scale + this.offsetY,
    }
  }
}

export function createCanvasRenderer(canvas: HTMLCanvasElement): CanvasRenderer {
  return new CanvasRenderer(canvas)
}