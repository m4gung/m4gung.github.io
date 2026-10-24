import { documentRepository } from '../../../infrastructure/database/documentRepository'
import type { Document } from '../../../domain/documents'

export class RenameDocumentUseCase {
  async execute(
    id: string,
    newName: string
  ): Promise<{ success: boolean; document?: Document; error?: string }> {
    try {
      if (!newName.trim()) {
        return { success: false, error: 'Nama tidak boleh kosong' }
      }

      const document = await documentRepository.updateDocument(id, { name: newName.trim() })
      if (!document) {
        return { success: false, error: 'Dokumen tidak ditemukan' }
      }
      return { success: true, document }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengganti nama dokumen'
      return { success: false, error: message }
    }
  }
}