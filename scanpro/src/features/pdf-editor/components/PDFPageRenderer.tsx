import { useRef, useEffect, useState } from 'react'
import { pdfRenderingAdapter } from '../../../infrastructure/pdf-rendering/pdfRenderingAdapter'

interface PDFPageRendererProps {
  pageNumber: number
  scale?: number
  rotation?: number
  onRendered?: (canvas: HTMLCanvasElement) => void
}

export const PDFPageRenderer = ({ pageNumber, scale = 1, rotation = 0, onRendered }: PDFPageRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const render = async () => {
      if (!canvasRef.current) return
      setIsLoading(true)
      setError(null)
      try {
        await pdfRenderingAdapter.renderPageToCanvas(pageNumber, canvasRef.current, scale, rotation)
        onRendered?.(canvasRef.current)
      } catch (err) {
        setError('Gagal merender halaman')
      } finally {
        setIsLoading(false)
      }
    }
    render()
  }, [pageNumber, scale, rotation, onRendered])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded text-red-500">
        {error}
      </div>
    )
  }

  return <canvas ref={canvasRef} className="max-w-full h-auto" />
}