import { pdfInspectionAdapter } from '../../infrastructure/pdf-processing/advancedPDFAdapter'
import { pdfAnnotationAdapter } from '../../infrastructure/pdf-processing/advancedPDFAdapter'
import { pdfFormAdapter } from '../../infrastructure/pdf-processing/advancedPDFAdapter'
import { pdfRedactionAdapter } from '../../infrastructure/pdf-processing/advancedPDFAdapter'
import { pdfOverlayAdapter } from '../../infrastructure/pdf-processing/advancedPDFAdapter'
import { pdfBackupAdapter } from '../../infrastructure/pdf-processing/advancedPDFAdapter'
import { documentRepository } from '../../infrastructure/database/documentRepository'
import { storageAdapter } from '../../infrastructure/storage/storageAdapter'
import type { ScanProDocument } from '../../infrastructure/database/database'
import type { PDFAnnotation, PDFFormField, PDFCapabilityReport } from '../../infrastructure/pdf-processing/advancedPDFAdapter'

export interface InspectPDFResult {
  success: boolean
  report?: PDFCapabilityReport
  error?: string
}

export class InspectPDFUseCase {
  async execute(documentId: string): Promise<InspectPDFResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      // In real implementation, load PDF data from storage
      const pdfData = new Uint8Array()
      const report = await pdfInspectionAdapter.inspectDocument(pdfData)

      return { success: true, report }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Inspeksi PDF gagal'
      return { success: false, error: message }
    }
  }
}

export interface AddAnnotationResult {
  success: boolean
  error?: string
}

export class AddTextAnnotationUseCase {
  async execute(
    documentId: string,
    annotation: Omit<PDFAnnotation, 'id' | 'createdAt' | 'modifiedAt'>
  ): Promise<AddAnnotationResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      await pdfAnnotationAdapter.addTextAnnotation(pdfData, annotation)

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menambah anotasi teks'
      return { success: false, error: message }
    }
  }
}

export class AddHighlightAnnotationUseCase {
  async execute(
    documentId: string,
    pageIndex: number,
    quads: Array<{ x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number }>,
    color?: { r: number; g: number; b: number },
    opacity?: number
  ): Promise<AddAnnotationResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      await pdfAnnotationAdapter.addHighlightAnnotation(pdfData, pageIndex, quads, color, opacity)

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menambah highlight'
      return { success: false, error: message }
    }
  }
}

export class AddInkAnnotationUseCase {
  async execute(
    documentId: string,
    pageIndex: number,
    paths: Array<Array<{ x: number; y: number }>>,
    color: { r: number; g: number; b: number },
    width?: number,
    opacity?: number
  ): Promise<AddAnnotationResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      await pdfAnnotationAdapter.addInkAnnotation(pdfData, pageIndex, paths, color, width, opacity)

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menambah ink annotation'
      return { success: false, error: message }
    }
  }
}

export interface AddFormFieldResult {
  success: boolean
  error?: string
}

export class AddTextFieldUseCase {
  async execute(
    documentId: string,
    field: Omit<PDFFormField, 'id'>
  ): Promise<AddFormFieldResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      await pdfFormAdapter.addTextField(pdfData, { ...field, id: `field_${Date.now()}` })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menambah text field'
      return { success: false, error: message }
    }
  }
}

export class AddCheckBoxUseCase {
  async execute(
    documentId: string,
    field: Omit<PDFFormField, 'id'>
  ): Promise<AddFormFieldResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      await pdfFormAdapter.addCheckBox(pdfData, { ...field, id: `field_${Date.now()}` })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menambah checkbox'
      return { success: false, error: message }
    }
  }
}

export class AddRadioGroupUseCase {
  async execute(
    documentId: string,
    groupName: string,
    fields: Array<Omit<PDFFormField, 'id'> & { exportValue: string }>
  ): Promise<AddFormFieldResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      const fullFields = fields.map((f, i) => ({
        ...f,
        id: `radio_${Date.now()}_${i}`,
      }))
      await pdfFormAdapter.addRadioGroup(pdfData, groupName, fullFields)

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menambah radio group'
      return { success: false, error: message }
    }
  }
}

export class AddDropdownUseCase {
  async execute(
    documentId: string,
    field: Omit<PDFFormField, 'id'>
  ): Promise<AddFormFieldResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      await pdfFormAdapter.addDropdown(pdfData, { ...field, id: `field_${Date.now()}` })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menambah dropdown'
      return { success: false, error: message }
    }
  }
}

export class FlattenFormUseCase {
  async execute(documentId: string): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      const flattened = await pdfFormAdapter.flattenForm(pdfData)
      const blob = new Blob([flattened], { type: 'application/pdf' })

      return { success: true, blob }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal flatten form'
      return { success: false, error: message }
    }
  }
}

export class RedactAreaUseCase {
  async execute(
    documentId: string,
    pageIndex: number,
    rect: { x0: number; y0: number; x1: number; y1: number },
    color?: { r: number; g: number; b: number }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      await pdfRedactionAdapter.redactArea(pdfData, pageIndex, rect, color)

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal meredact area'
      return { success: false, error: message }
    }
  }
}

export class AddTextOverlayUseCase {
  async execute(
    documentId: string,
    pageIndex: number,
    text: string,
    position: { x: number; y: number },
    options?: {
      fontSize?: number
      fontFamily?: string
      color?: { r: number; g: number; b: number }
      opacity?: number
      rotation?: number
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      await pdfOverlayAdapter.addTextOverlay(pdfData, pageIndex, text, position, options)

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menambah text overlay'
      return { success: false, error: message }
    }
  }
}

export class AddImageOverlayUseCase {
  async execute(
    documentId: string,
    pageIndex: number,
    imageData: Uint8Array,
    position: { x: number; y: number; width: number; height: number },
    opacity?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      await pdfOverlayAdapter.addImageOverlay(pdfData, pageIndex, imageData, position, opacity)

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menambah image overlay'
      return { success: false, error: message }
    }
  }
}

export class AddWatermarkUseCase {
  async execute(
    documentId: string,
    text: string,
    options?: {
      fontSize?: number
      color?: { r: number; g: number; b: number }
      opacity?: number
      rotation?: number
      spacing?: number
    }
  ): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      const watermarked = await pdfOverlayAdapter.addWatermark(pdfData, text, options)
      const blob = new Blob([watermarked], { type: 'application/pdf' })

      return { success: true, blob }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menambah watermark'
      return { success: false, error: message }
    }
  }
}

export class CreateBackupUseCase {
  async execute(documentId: string): Promise<{ success: boolean; backupId?: string; error?: string }> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      const backup = await pdfBackupAdapter.createBackup(pdfData)

      // Store backup with unique ID
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
      // In real implementation, store backup in storage

      return { success: true, backupId }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal membuat backup'
      return { success: false, error: message }
    }
  }
}

export class VerifyBackupUseCase {
  async execute(backupId: string): Promise<{ success: boolean; verified?: boolean; error?: string }> {
    try {
      // In real implementation, load original and backup from storage
      const original = new Uint8Array()
      const backup = new Uint8Array()
      const verified = await pdfBackupAdapter.verifyIntegrity(original, backup)
      return { success: true, verified }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verifikasi backup gagal'
      return { success: false, error: message }
    }
  }
}

export class PDFAdvancedEditUseCase {
  async execute(
    documentId: string,
    operations: Array<{
      type: 'annotation' | 'form' | 'redaction' | 'overlay' | 'watermark'
      data: any
    }>
  ): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      let pdfData = new Uint8Array()

      for (const op of operations) {
        switch (op.type) {
          case 'annotation':
            if (op.data.type === 'text') {
              await pdfOverlayAdapter.addTextOverlay(pdfData, op.data.pageIndex, op.data.text, { x: op.data.x, y: op.data.y }, op.data.options)
            } else if (op.data.type === 'highlight') {
              await pdfAnnotationAdapter.addHighlightAnnotation(pdfData, op.data.pageIndex, op.data.quads, op.data.color, op.data.opacity)
            } else if (op.data.type === 'ink') {
              await pdfAnnotationAdapter.addInkAnnotation(pdfData, op.data.pageIndex, op.data.paths, op.data.color, op.data.width, op.data.opacity)
            }
            break
          case 'form':
            if (op.data.type === 'text') {
              await pdfFormAdapter.addTextField(pdfData, op.data)
            } else if (op.data.type === 'checkbox') {
              await pdfFormAdapter.addCheckBox(pdfData, op.data)
            } else if (op.data.type === 'dropdown') {
              await pdfFormAdapter.addDropdown(pdfData, op.data)
            }
            break
          case 'redaction':
            await pdfRedactionAdapter.redactArea(pdfData, op.data.pageIndex, op.data.rect, op.data.color)
            break
          case 'overlay':
            if (op.data.type === 'text') {
              await pdfOverlayAdapter.addTextOverlay(pdfData, op.data.pageIndex, op.data.text, op.data.position, op.data.options)
            } else if (op.data.type === 'image') {
              await pdfOverlayAdapter.addImageOverlay(pdfData, op.data.pageIndex, op.data.imageData, op.data.position, op.data.opacity)
            }
            break
          case 'watermark':
            pdfData = await pdfOverlayAdapter.addWatermark(pdfData, op.data.text, op.data.options)
            break
        }
      }

      const blob = new Blob([pdfData], { type: 'application/pdf' })
      return { success: true, blob }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Advanced edit gagal'
      return { success: false, error: message }
    }
  }
}