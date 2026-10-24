import { documentRepository } from '../../infrastructure/database/documentRepository'
import type { Folder } from '../../domain/documents'

export interface CreateFolderResult {
  success: boolean
  folder?: Folder
  error?: string
}

export class CreateFolderUseCase {
  async execute(
    data: Omit<Folder, 'id' | 'documentCount' | 'metadata'>
  ): Promise<CreateFolderResult> {
    try {
      const folder = await documentRepository.createFolder(data)
      return { success: true, folder }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal membuat folder'
      return { success: false, error: message }
    }
  }
}

export class GetFoldersUseCase {
  async execute(): Promise<Folder[]> {
    try {
      return await documentRepository.getFolders()
    } catch {
      return []
    }
  }
}

export class UpdateFolderUseCase {
  async execute(
    id: string,
    updates: Partial<Omit<Folder, 'id' | 'documentCount' | 'metadata'>>
  ): Promise<{ success: boolean; folder?: Folder; error?: string }> {
    try {
      const folder = await documentRepository.updateFolder(id, updates)
      if (!folder) {
        return { success: false, error: 'Folder tidak ditemukan' }
      }
      return { success: true, folder }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memperbarui folder'
      return { success: false, error: message }
    }
  }
}

export class DeleteFolderUseCase {
  async execute(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const success = await documentRepository.deleteFolder(id)
      if (!success) {
        return { success: false, error: 'Folder tidak ditemukan' }
      }
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus folder'
      return { success: false, error: message }
    }
  }
}