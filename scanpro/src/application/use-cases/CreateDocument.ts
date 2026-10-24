import { documentRepository } from '../../infrastructure/database/documentRepository'
import type { ScanProDocument } from '../../infrastructure/database/database'

export interface CreateDocumentUseCaseResult {
  document: ScanProDocument
  success: boolean
  error?: string
}

export class CreateDocumentUseCase {
  async execute(
    data: Omit<ScanProDocument, 'id' | 'version' | 'metadata'>
  ): Promise<CreateDocumentUseCaseResult> {
    try {
      const document = await documentRepository.createDocument(data)
      return { document, success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create document'
      return { document: null as unknown as ScanProDocument, success: false, error: message }
    }
  }
}
