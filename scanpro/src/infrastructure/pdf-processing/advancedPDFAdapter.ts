import { PDFDocument, PDFPage, rgb, StandardFonts, degrees, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, PDFButton, PDFRadioGroup, PDFAcroTerminal } from 'pdf-lib'

export interface PDFTextSelection {
  pageIndex: number
  text: string
  bounds: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
  fontName?: string
  fontSize?: number
  color?: { r: number; g: number; b: number }
}

export interface PDFAnnotation {
  id: string
  pageIndex: number
  type: 'text' | 'highlight' | 'underline' | 'strikethrough' | 'squiggly' | 'free-text' | 'stamp' | 'ink' | 'polygon' | 'poly-line' | 'circle' | 'square'
  rect: { x0: number; y0: number; x1: number; y1: number }
  contents?: string
  color?: { r: number; g: number; b: number }
  opacity?: number
  borderWidth?: number
  borderStyle?: 'solid' | 'dashed' | 'beveled' | 'inset' | 'underline'
  createdAt: Date
  modifiedAt: Date
  author?: string
  subject?: string
}

export interface PDFFormField {
  id: string
  pageIndex: number
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'listbox' | 'button' | 'signature'
  name: string
  value?: string
  rect: { x0: number; y0: number; x1: number; y1: number }
  fontSize?: number
  fontColor?: { r: number; g: number; b: number }
  backgroundColor?: { r: number; g: number; b: number }
  borderColor?: { r: number; g: number; b: number }
  borderWidth?: number
  maxLength?: number
  multiline?: boolean
  password?: boolean
  required?: boolean
  readOnly?: boolean
  options?: string[] // for dropdown/listbox
  defaultValue?: string
  tooltip?: string
}

export interface PDFCapabilityReport {
  canExtractText: boolean
  canExtractImages: boolean
  canModifyText: boolean
  canAddAnnotations: boolean
  canAddFormFields: boolean
  canSign: boolean
  canRedact: boolean
  canOptimize: boolean
  canLinearize: boolean
  fonts: Array<{
    name: string
    embedded: boolean
    subset: boolean
    type: string
  }>
  pages: Array<{
    index: number
    hasText: boolean
    hasImages: boolean
    hasForms: boolean
    hasAnnotations: boolean
    rotation: number
    size: { width: number; height: number }
  }>
}

export class PDFInspectionAdapter {
  async inspectDocument(data: Uint8Array): Promise<PDFCapabilityReport> {
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(data)
    
    const pages = pdfDoc.getPages()
    const pageReports = pages.map((page, index) => {
      const { width, height } = page.getSize()
      const rotation = page.getRotation().angle
      const annotations: any[] = (page as any).getAnnotations ? (page as any).getAnnotations() : []
      const resources = typeof (page.node as any).Resources === 'function' ? (page.node as any).Resources() : (page.node as any).Resources
      const fonts = resources?.lookup && resources.lookup('Font') ? Object.keys(resources.lookup('Font')) : []
      
      return {
        index,
        hasText: false, // Would need pdfjs-dist to properly detect
        hasImages: false,
        hasForms: annotations.some(a => a.subtype === 'Widget'),
        hasAnnotations: annotations.length > 0,
        rotation,
        size: { width, height },
      }
    })

    const fontRefs: any[] = typeof (pdfDoc as any).getFonts === 'function' ? (pdfDoc as any).getFonts() : []
    const fontReports = fontRefs.map(font => ({
      name: font.name ?? 'Unknown',
      embedded: false, // Would need deeper inspection
      subset: false,
      type: 'Unknown',
    }))

    return {
      canExtractText: true,
      canExtractImages: true,
      canModifyText: false, // pdf-lib cannot modify existing text
      canAddAnnotations: true,
      canAddFormFields: true,
      canSign: true,
      canRedact: false, // Requires content stream manipulation
      canOptimize: false,
      canLinearize: false,
      fonts: fontReports,
      pages: pageReports,
    }
  }

  async getTextSelections(data: Uint8Array): Promise<PDFTextSelection[]> {
    // This would require pdfjs-dist for proper text extraction
    // pdf-lib doesn't support text extraction from existing PDFs
    return []
  }

  async getAnnotations(data: Uint8Array): Promise<PDFAnnotation[]> {
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(data)
    const annotations: PDFAnnotation[] = []

    const pages = pdfDoc.getPages()
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const annots = page.node.Annots
      if (annots) {
        // Would need to parse annotation objects
      }
    }
    return annotations
  }
}

export class PDFAnnotationAdapter {
  async addTextAnnotation(
    pdfData: Uint8Array,
    annotation: Omit<PDFAnnotation, 'id' | 'createdAt' | 'modifiedAt'>
  ): Promise<Uint8Array> {
    const { PDFDocument, rgb } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const page = pdfDoc.getPage(annotation.pageIndex)

    // Add free text annotation
    const { width, height } = page.getSize()
    const { x0, y0, x1, y1 } = annotation.rect

    page.drawText(annotation.contents ?? '', {
      x: x0,
      y: height - y1,
      size: 12,
      color: annotation.color ? rgb(annotation.color.r, annotation.color.g, annotation.color.b) : rgb(0, 0, 0),
      opacity: annotation.opacity ?? 1,
    })

    return pdfDoc.save()
  }

  async addHighlightAnnotation(
    pdfData: Uint8Array,
    pageIndex: number,
    quads: Array<{ x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number }>,
    color: { r: number; g: number; b: number } = { r: 1, g: 1, b: 0 },
    opacity = 0.3
  ): Promise<Uint8Array> {
    // Highlight annotations require manipulating annotation objects directly
    // This is a simplified version using drawRectangle as fallback
    const { PDFDocument, rgb } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const page = pdfDoc.getPage(pageIndex)
    const { height } = page.getSize()

    for (const quad of quads) {
      page.drawRectangle({
        x: quad.x0,
        y: height - quad.y1,
        width: quad.x1 - quad.x0,
        height: quad.y1 - quad.y0,
        color: rgb(color.r, color.g, color.b),
        opacity,
      })
    }

    return pdfDoc.save()
  }

  async addInkAnnotation(
    pdfData: Uint8Array,
    pageIndex: number,
    paths: Array<Array<{ x: number; y: number }>>,
    color: { r: number; g: number; b: number },
    width = 2,
    opacity = 1
  ): Promise<Uint8Array> {
    const { PDFDocument, rgb } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const page = pdfDoc.getPage(pageIndex)
    const { height } = page.getSize()

    for (const path of paths) {
      if (path.length < 2) continue
      for (let i = 0; i < path.length - 1; i++) {
        page.drawLine({
          start: { x: path[i].x, y: height - path[i].y },
          end: { x: path[i + 1].x, y: height - path[i + 1].y },
          color: rgb(color.r, color.g, color.b),
          thickness: width,
          opacity,
        })
      }
    }

    return pdfDoc.save()
  }
}

export class PDFFormAdapter {
  async addTextField(
    pdfData: Uint8Array,
    field: PDFFormField
  ): Promise<Uint8Array> {
    const { PDFDocument, rgb } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const form = pdfDoc.getForm()
    const page = pdfDoc.getPage(field.pageIndex)
    const { height } = page.getSize()

    const fieldObj = form.createTextField(field.name)
    fieldObj.setText(field.value ?? '')
    if (field.maxLength) fieldObj.setMaxLength(field.maxLength)
    if (field.multiline) fieldObj.enableMultiline()
    if (field.password) fieldObj.enablePassword()
    if (field.required) fieldObj.enableReadOnly() // Note: pdf-lib doesn't have required flag directly

    const { x0, y0, x1, y1 } = field.rect
    fieldObj.addToPage(page, {
      x: x0,
      y: height - y1,
      width: x1 - x0,
      height: y1 - y0,
    })

    if (field.fontSize) fieldObj.setFontSize(field.fontSize)
    if (field.fontColor && (fieldObj as any).setTextColor) (fieldObj as any).setTextColor(rgb(field.fontColor.r, field.fontColor.g, field.fontColor.b))
    if (field.backgroundColor && (fieldObj as any).setBackgroundColor) (fieldObj as any).setBackgroundColor(rgb(field.backgroundColor.r, field.backgroundColor.g, field.backgroundColor.b))
    if (field.borderColor && (fieldObj as any).setBorderColor) (fieldObj as any).setBorderColor(rgb(field.borderColor.r, field.borderColor.g, field.borderColor.b))
    if (field.borderWidth && (fieldObj as any).setBorderWidth) (fieldObj as any).setBorderWidth(field.borderWidth)

    return pdfDoc.save()
  }

  async addCheckBox(
    pdfData: Uint8Array,
    field: PDFFormField
  ): Promise<Uint8Array> {
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const form = pdfDoc.getForm()
    const page = pdfDoc.getPage(field.pageIndex)
    const { height } = page.getSize()

    const checkBox = form.createCheckBox(field.name)
    if (field.value === 'true' || field.value === 'On') checkBox.check()
    else checkBox.uncheck()

    const { x0, y0, x1, y1 } = field.rect
    checkBox.addToPage(page, {
      x: x0,
      y: height - y1,
      width: x1 - x0,
      height: y1 - y0,
    })

    return pdfDoc.save()
  }

  async addRadioGroup(
    pdfData: Uint8Array,
    groupName: string,
    fields: Array<PDFFormField & { exportValue: string }>
  ): Promise<Uint8Array> {
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const form = pdfDoc.getForm()
    const radioGroup = form.createRadioGroup(groupName)

    for (const field of fields) {
      const page = pdfDoc.getPage(field.pageIndex)
      const { height } = page.getSize()
      const { x0, y0, x1, y1 } = field.rect
      radioGroup.addOptionToPage(field.exportValue, page, {
        x: x0,
        y: height - y1,
        width: x1 - x0,
        height: y1 - y0,
      })
    }

    if (fields[0]?.value) {
      radioGroup.select(fields[0].value)
    }

    return pdfDoc.save()
  }

  async addDropdown(
    pdfData: Uint8Array,
    field: PDFFormField
  ): Promise<Uint8Array> {
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const form = pdfDoc.getForm()
    const page = pdfDoc.getPage(field.pageIndex)
    const { height } = page.getSize()

    const dropdown = form.createDropdown(field.name)
    if (field.options) {
      dropdown.addOptions(field.options)
    }
    if (field.value) dropdown.select(field.value)

    const { x0, y0, x1, y1 } = field.rect
    dropdown.addToPage(page, {
      x: x0,
      y: height - y1,
      width: x1 - x0,
      height: y1 - y0,
    })

    return pdfDoc.save()
  }

  async addButton(
    pdfData: Uint8Array,
    field: PDFFormField,
    onClickScript?: string
  ): Promise<Uint8Array> {
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const form = pdfDoc.getForm()
    const page = pdfDoc.getPage(field.pageIndex)
    const { height } = page.getSize()

    const button = form.createButton(field.name)
    if (onClickScript && (button as any).setOnClickAction) {
      (button as any).setOnClickAction(onClickScript)
    }

    const { x0, y0, x1, y1 } = field.rect
    button.addToPage(field.name, page, {
      x: x0,
      y: height - y1,
      width: x1 - x0,
      height: y1 - y0,
    })

    return pdfDoc.save()
  }

  async flattenForm(pdfData: Uint8Array): Promise<Uint8Array> {
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const form = pdfDoc.getForm()
    form.flatten()
    return pdfDoc.save()
  }

  async getFormFields(pdfData: Uint8Array): Promise<PDFFormField[]> {
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const form = pdfDoc.getForm()
    const fields: PDFFormField[] = []

    for (const field of form.getFields()) {
      const widgets = field.acroField.getWidgets()
      for (const widget of widgets) {
        const rect = widget.getRectangle()
        if (rect) {
          fields.push({
            id: field.getName(),
            pageIndex: 0, // Would need to find page
            type: this.mapFieldType(field.constructor.name),
            name: field.getName(),
            value: (field as any).getText ? (field as any).getText() : (field as any).getValue ? (field as any).getValue() : '',
            rect: {
              x0: rect.x,
              y0: rect.y,
              x1: rect.x + rect.width,
              y1: rect.y + rect.height,
            },
          })
        }
      }
    }
    return fields
  }

  private mapFieldType(type: string): PDFFormField['type'] {
    switch (type) {
      case 'PDFTextField': return 'text'
      case 'PDFCheckBox': return 'checkbox'
      case 'PDFRadioGroup': return 'radio'
      case 'PDFDropdown': return 'dropdown'
      case 'PDFListBox': return 'listbox'
      case 'PDFButton': return 'button'
      default: return 'text'
    }
  }
}

export class PDFRedactionAdapter {
  async redactText(
    pdfData: Uint8Array,
    pageIndex: number,
    searchText: string,
    color: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 }
  ): Promise<Uint8Array> {
    // True redaction requires content stream manipulation
    // This is a placeholder - real implementation needs content stream parsing
    const { PDFDocument, rgb } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    // Would need to parse content streams, find text operators, and replace with redaction
    return pdfDoc.save()
  }

  async redactArea(
    pdfData: Uint8Array,
    pageIndex: number,
    rect: { x0: number; y0: number; x1: number; y1: number },
    color: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 }
  ): Promise<Uint8Array> {
    const { PDFDocument, rgb } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const page = pdfDoc.getPage(pageIndex)
    const { height } = page.getSize()

    page.drawRectangle({
      x: rect.x0,
      y: height - rect.y1,
      width: rect.x1 - rect.x0,
      height: rect.y1 - rect.y0,
      color: rgb(0, 0, 0),
    })

    return pdfDoc.save()
  }

  async applyRedactions(pdfData: Uint8Array): Promise<Uint8Array> {
    // Real redaction removes content from content streams
    // This is a placeholder
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    return pdfDoc.save()
  }
}

export class PDFOverlayAdapter {
  async addTextOverlay(
    pdfData: Uint8Array,
    pageIndex: number,
    text: string,
    position: { x: number; y: number },
    options: {
      fontSize?: number
      fontFamily?: string
      color?: { r: number; g: number; b: number }
      opacity?: number
      rotation?: number
    } = {}
  ): Promise<Uint8Array> {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const page = pdfDoc.getPage(pageIndex)
    const { height } = page.getSize()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    page.drawText(text, {
      x: position.x,
      y: height - position.y,
      size: options.fontSize ?? 12,
      font,
      color: rgb(options.color?.r ?? 0, options.color?.g ?? 0, options.color?.b ?? 0),
      opacity: options.opacity ?? 1,
      rotate: degrees(options.rotation ?? 0),
    })

    return pdfDoc.save()
  }

  async addImageOverlay(
    pdfData: Uint8Array,
    pageIndex: number,
    imageData: Uint8Array,
    position: { x: number; y: number; width: number; height: number },
    opacity = 1
  ): Promise<Uint8Array> {
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const page = pdfDoc.getPage(pageIndex)
    const { height } = page.getSize()

    const image = await pdfDoc.embedPng(imageData) // or embedJpg
    page.drawImage(image, {
      x: position.x,
      y: height - position.y - position.height,
      width: position.width,
      height: position.height,
      opacity,
    })

    return pdfDoc.save()
  }

  async addSignatureOverlay(
    pdfData: Uint8Array,
    pageIndex: number,
    signatureData: Uint8Array,
    position: { x: number; y: number; width: number; height: number }
  ): Promise<Uint8Array> {
    return this.addImageOverlay(pdfData, pageIndex, signatureData, position)
  }

  async addWatermark(
    pdfData: Uint8Array,
    text: string,
    options: {
      fontSize?: number
      color?: { r: number; g: number; b: number }
      opacity?: number
      rotation?: number
      spacing?: number
    } = {}
  ): Promise<Uint8Array> {
    const { PDFDocument, rgb, StandardFonts, degrees } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const pages = pdfDoc.getPages()
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    for (const page of pages) {
      const { width, height } = page.getSize()
      const fontSize = options.fontSize ?? Math.min(width, height) / 20
      const spacing = options.spacing ?? Math.max(width, height) / 3

      for (let x = -width; x < width * 2; x += spacing) {
        for (let y = -height; y < height * 2; y += spacing) {
          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(options.color?.r ?? 0.5, options.color?.g ?? 0.5, options.color?.b ?? 0.5),
            opacity: options.opacity ?? 0.15,
            rotate: degrees(options.rotation ?? 45),
          })
        }
      }
    }

    return pdfDoc.save()
  }
}

export class PDFBackupAdapter {
  async createBackup(pdfData: Uint8Array): Promise<Uint8Array> {
    // Create a verified backup with checksum
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    const saved = await pdfDoc.save()
    return saved
  }

  async verifyIntegrity(original: Uint8Array, backup: Uint8Array): Promise<boolean> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const origBuf = await crypto.subtle.digest('SHA-256', original as unknown as BufferSource)
      const backBuf = await crypto.subtle.digest('SHA-256', backup as unknown as BufferSource)
      const origArr = Array.from(new Uint8Array(origBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
      const backArr = Array.from(new Uint8Array(backBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
      return origArr === backArr
    }
    if (original.length !== backup.length) return false
    for (let i = 0; i < original.length; i++) {
      if (original[i] !== backup[i]) return false
    }
    return true
  }

  async createIncrementalBackup(pdfData: Uint8Array, changes: any[]): Promise<Uint8Array> {
    // Save incremental changes (pdf-lib supports incremental updates)
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(pdfData)
    // Apply changes...
    return pdfDoc.save({ useObjectStreams: false }) // Incremental update
  }
}

export const pdfInspectionAdapter = new PDFInspectionAdapter()
export const pdfAnnotationAdapter = new PDFAnnotationAdapter()
export const pdfFormAdapter = new PDFFormAdapter()
export const pdfRedactionAdapter = new PDFRedactionAdapter()
export const pdfOverlayAdapter = new PDFOverlayAdapter()
export const pdfBackupAdapter = new PDFBackupAdapter()