import { ImportImageUseCase } from './ImportImage'

export class ImportImageService {
  private useCase = new ImportImageUseCase()

  async importImage(file: File, documentName?: string) {
    return this.useCase.execute(file, documentName)
  }
}
