import { documentRepository } from '../../infrastructure/database/documentRepository'
import type { ScanProDocument } from '../../infrastructure/database/database'

export interface GetDocumentsUseCaseResult {
  documents: ScanProDocument[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  success: boolean
  error?: string
}

export class GetDocumentsUseCase {
  async execute(
    options: {
      page?: number
      pageSize?: number
      sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'accessedAt' | 'size'
      sortOrder?: 'asc' | 'desc'
      status?: 'active' | 'archived' | 'deleted'
      folderId?: string
    }
  ): Promise<GetDocumentsUseCaseResult> {
    try {
      const result = await documentRepository.getDocuments(options)
      return { ...result, success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get documents'
      return { documents: [], total: 0, page: 1, pageSize: 20, hasMore: false, success: false, error: message }
    }
  }
}
