export interface EdgeDetectionResult {
  corners: {
    topLeft: { x: number; y: number }
    topRight: { x: number; y: number }
    bottomRight: { x: number; y: number }
    bottomLeft: { x: number; y: number }
  } | null
  confidence: number
}

export interface IEdgeDetector {
  detectEdges(imageData: ImageData): Promise<EdgeDetectionResult>
  dispose(): void
}

export class OpenCVEdgeDetector implements IEdgeDetector {
  private cv: any = null
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Try to load OpenCV.js from CDN
      if (typeof window !== 'undefined' && (window as any).cv) {
        this.cv = (window as any).cv
        this.initialized = true
        return
      }

      // Dynamically load OpenCV.js
      await this.loadOpenCV()
      this.initialized = true
    } catch (error) {
      console.warn('OpenCV.js not available, edge detection disabled:', error)
      this.initialized = false
    }
  }

  private loadOpenCV(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://docs.opencv.org/4.8.0/opencv.js'
      script.async = true
      script.onload = () => {
        // Wait for cv to be ready
        const checkCV = setInterval(() => {
          if ((window as any).cv) {
            clearInterval(checkCV)
            this.cv = (window as any).cv
            resolve()
          }
        }, 100)
      }
      script.onerror = () => reject(new Error('Failed to load OpenCV.js'))
      document.head.appendChild(script)
    })
  }

  async detectEdges(imageData: ImageData): Promise<EdgeDetectionResult> {
    if (!this.initialized || !this.cv) {
      await this.initialize()
    }

    if (!this.initialized || !this.cv) {
      return { corners: null, confidence: 0 }
    }

    try {
      const cv = this.cv
      const src = cv.matFromImageData(imageData)
      const gray = new cv.Mat()
      const blurred = new cv.Mat()
      const edges = new cv.Mat()
      const contours = new cv.MatVector()
      const hierarchy = new cv.Mat()
      let bestContour: any = null

      try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0)
        cv.Canny(blurred, edges, 50, 150)

        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

        let maxArea = 0

        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i)
          const area = cv.contourArea(contour)
          if (area > maxArea && area > 1000) {
            const peri = cv.arcLength(contour, true)
            const approx = new cv.Mat()
            cv.approxPolyDP(contour, approx, 0.02 * peri, true)
            if (approx.rows === 4) {
              maxArea = area
              bestContour = approx
            }
            approx.delete()
          }
          contour.delete()
        }

        if (bestContour) {
          const points: any[] = []
          for (let i = 0; i < 4; i++) {
            points.push({
              x: bestContour.data32S[i * 2],
              y: bestContour.data32S[i * 2 + 1],
            })
          }

          // Sort points: top-left, top-right, bottom-right, bottom-left
          points.sort((a, b) => a.y - b.y)
          const top = points.slice(0, 2).sort((a, b) => a.x - b.x)
          const bottom = points.slice(2, 4).sort((a, b) => b.x - a.x)
          const ordered = [top[0], top[1], bottom[0], bottom[1]]

          return {
            corners: {
              topLeft: { x: ordered[0].x / imageData.width, y: ordered[0].y / imageData.height },
              topRight: { x: ordered[1].x / imageData.width, y: ordered[1].y / imageData.height },
              bottomRight: { x: ordered[2].x / imageData.width, y: ordered[2].y / imageData.height },
              bottomLeft: { x: ordered[3].x / imageData.width, y: ordered[3].y / imageData.height },
            },
            confidence: Math.min(maxArea / (imageData.width * imageData.height), 1),
          }
        }

        return { corners: null, confidence: 0 }
      } finally {
        src.delete()
        gray.delete()
        blurred.delete()
        edges.delete()
        contours.delete()
        hierarchy.delete()
        if (bestContour) bestContour.delete()
      }
    } catch (error) {
      console.error('Edge detection failed:', error)
      return { corners: null, confidence: 0 }
    }
  }

  dispose(): void {
    this.cv = null
    this.initialized = false
  }
}

export class SimpleEdgeDetector implements IEdgeDetector {
  async detectEdges(imageData: ImageData): Promise<EdgeDetectionResult> {
    // Simple heuristic: assume document fills most of frame
    const margin = 0.05
    return {
      corners: {
        topLeft: { x: margin, y: margin },
        topRight: { x: 1 - margin, y: margin },
        bottomRight: { x: 1 - margin, y: 1 - margin },
        bottomLeft: { x: margin, y: 1 - margin },
      },
      confidence: 0.5,
    }
  }

  dispose(): void {}
}

export const edgeDetector = new SimpleEdgeDetector()