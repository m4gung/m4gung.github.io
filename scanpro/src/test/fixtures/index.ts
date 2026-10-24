export const testFixtures = {
  validImageFile: new File(['fake image data'], 'test-scan.jpg', { type: 'image/jpeg' }),
  validPdfFile: new File(['fake pdf data'], 'document.pdf', { type: 'application/pdf' }),
  invalidFile: new File(['text content'], 'invalid.txt', { type: 'text/plain' }),
  oversizedFile: new File(['a'.repeat(60 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' }),
}