import { documentRepository } from '../../infrastructure/database/documentRepository'
import type { ScanProDocument } from '../../infrastructure/database/database'

export interface DeleteDocumentUseCaseResult {
  success: boolean
  error?: string
}

export class DeleteDocumentUseCase {
  async execute(id: string, permanent = false): Promise<DeleteDocumentUseCaseResult> {
    try {
      const success = await documentRepository.deleteDocument(id, permanent)
      if (!success) {
        return { success: false, error: 'Document not found' }
      }
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete document'
      return { success: false, error: message }
    }
  }
}
