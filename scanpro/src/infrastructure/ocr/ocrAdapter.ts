import { createWorker, PSM, OEM } from 'tesseract.js'

export interface OcrOptions {
  language?: string | string[]
  psm?: PSM
  oem?: OEM
  logger?: (m: { status: string; progress: number }) => void
}

export interface OcrResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
    bbox: { x0: number; y0: number; x1: number; y1: number }
  }>
  lines: Array<{
    text: string
    confidence: number
    bbox: { x0: number; y0: number; x1: number; y1: number }
  }>
  blocks: Array<{
    text: string
    confidence: number
    bbox: { x0: number; y0: number; x1: number; y1: number }
    lines: any[]
  }>
}

export interface OcrPageResult {
  pageNumber: number
  text: string
  confidence: number
  words: OcrResult['words']
  lines: OcrResult['lines']
  blocks: OcrResult['blocks']
  processingTime: number
  language: string
}

export class TesseractOcrAdapter {
  private worker: any = null
  private initialized = false
  private currentLanguages: string[] = ['eng', 'ind']

  async initialize(languages: string[] = ['eng', 'ind']): Promise<void> {
    if (this.initialized && this.currentLanguages.join(',') === languages.join(',')) {
      return
    }

    if (this.worker) {
      await this.worker.terminate()
    }

    this.currentLanguages = languages
    this.worker = await createWorker(languages)

    this.initialized = true
  }

  async recognize(
    image: HTMLImageElement | HTMLCanvasElement | Blob | string,
    options: OcrOptions = {}
  ): Promise<OcrResult> {
    if (!this.initialized) {
      await this.initialize(options.language as string[] ?? this.currentLanguages)
    }

    if (options.logger) {
      this.worker.setLogger(options.logger)
    }

    const { data } = await this.worker.recognize(image)

    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words.map((w: any) => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox,
      })),
      lines: data.lines.map((l: any) => ({
        text: l.text,
        confidence: l.confidence,
        bbox: l.bbox,
      })),
      blocks: data.blocks.map((b: any) => ({
        text: b.text,
        confidence: b.confidence,
        bbox: b.bbox,
        lines: b.lines,
      })),
    }
  }

  async recognizePage(
    image: HTMLImageElement | HTMLCanvasElement | Blob | string,
    pageNumber: number,
    options: OcrOptions = {}
  ): Promise<OcrPageResult> {
    const startTime = Date.now()
    const result = await this.recognize(image, options)
    const processingTime = Date.now() - startTime

    return {
      pageNumber,
      text: result.text,
      confidence: result.confidence,
      words: result.words,
      lines: result.lines,
      blocks: result.blocks,
      processingTime,
      language: options.language?.toString() ?? this.currentLanguages.join('+'),
    }
  }

  async recognizeMultiple(
    images: Array<HTMLImageElement | HTMLCanvasElement | Blob | string>,
    options: OcrOptions = {}
  ): Promise<OcrPageResult[]> {
    const results: OcrPageResult[] = []
    for (let i = 0; i < images.length; i++) {
      const result = await this.recognizePage(images[i], i + 1, options)
      results.push(result)
    }
    return results
  }

  setLogger(logger: (m: { status: string; progress: number }) => void): void {
    if (this.worker) {
      this.worker.setLogger(logger)
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.initialized = false
    }
  }

  getSupportedLanguages(): string[] {
    return ['eng', 'ind', 'ind+eng', 'ara', 'chi_sim', 'chi_tra', 'fra', 'deu', 'jpn', 'kor', 'spa', 'rus']
  }

  isInitialized(): boolean {
    return this.initialized
  }
}

export const ocrAdapter = new TesseractOcrAdapter()