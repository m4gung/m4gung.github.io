import { useRef, useEffect } from 'react'
import { cameraAdapter } from '../../../infrastructure/camera/cameraAdapter'

interface CameraPreviewProps {
  isStreaming: boolean
  onStreamReady?: (video: HTMLVideoElement) => void
}

export const CameraPreview = ({ isStreaming, onStreamReady }: CameraPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!isStreaming || !videoRef.current) return

    const video = videoRef.current
    const stream = cameraAdapter.getCurrentStream()
    if (stream) {
      video.srcObject = stream
      video.play().catch(() => {})
      onStreamReady?.(video)
    }

    return () => {
      video.srcObject = null
    }
  }, [isStreaming, onStreamReady])

  return (
    <div className="relative w-full aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden">
      {isStreaming ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.2A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="mt-2 text-center">Kamera tidak aktif</p>
        </div>
      )}
    </div>
  )
}