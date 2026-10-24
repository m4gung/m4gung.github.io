import { useRef, useEffect, useState } from 'react'
import { imageProcessingAdapter } from '../../../infrastructure/image-processing/imageProcessingAdapter'

interface ScanPreviewProps {
  src: string
  onCornersChange?: (corners: Array<{ x: number; y: number }>) => void
  isAdjusting?: boolean
}

export const ScanPreview = ({ src, onCornersChange, isAdjusting = false }: ScanPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [corners, setCorners] = useState<Array<{ x: number; y: number }>>([
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.9, y: 0.9 },
    { x: 0.1, y: 0.9 },
  ])
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 })
  const [dragCorner, setDragCorner] = useState<number | null>(null)

  useEffect(() => {
    if (!src) return
    const img = new Image()
    img.onload = () => {
      setImgSize({ width: img.width, height: img.height })
    }
    img.src = src
    imgRef.current = img
  }, [src])

  useEffect(() => {
    if (!canvasRef.current || !imgRef.current) return
    drawCanvas()
  }, [src, corners, imgSize])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || imgSize.width === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width: canvasWidth, height: canvasHeight } = canvas.getBoundingClientRect()
    const scaleX = imgSize.width / canvasWidth
    const scaleY = imgSize.height / canvasHeight

    canvas.width = imgSize.width
    canvas.height = imgSize.height

    ctx.drawImage(img, 0, 0)

    if (isAdjusting) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3 / Math.max(scaleX, scaleY)
      ctx.beginPath()
      corners.forEach((corner, i) => {
        const x = corner.x * imgSize.width
        const y = corner.y * imgSize.height
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      ctx.stroke()

      corners.forEach((corner) => {
        const x = corner.x * imgSize.width
        const y = corner.y * imgSize.height
        ctx.fillStyle = '#3b82f6'
        ctx.beginPath()
        ctx.arc(x, y, 12 / Math.max(scaleX, scaleY), 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 2 / Math.max(scaleX, scaleY)
        ctx.stroke()
      })
    }
  }

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    if (!isAdjusting) return
    e.preventDefault()
    setDragCorner(index)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragCorner === null || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    setCorners((prev) => prev.map((c, i) => (i === dragCorner ? { x, y } : c)))
  }

  const handleMouseUp = () => {
    setDragCorner(null)
    if (onCornersChange) onCornersChange(corners)
  }

  useEffect(() => {
    if (dragCorner !== null) {
      window.addEventListener('mousemove', handleMouseMove as any)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragCorner])

  return (
    <div className="relative" onMouseLeave={handleMouseUp}>
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto cursor-crosshair"
        style={{ touchAction: 'none' }}
      />
    </div>
  )
}