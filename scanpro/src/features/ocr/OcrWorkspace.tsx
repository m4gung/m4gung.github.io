import { useState, useEffect } from 'react'
import { useOcrStore } from '../../../stores/ocrStore'
import { useTranslation } from '../../../lib/i18n'
import { OcrProgress } from './components/OcrProgress'
import { OcrTextEditor } from './components/OcrTextEditor'
import { Button } from '../../../components/ui/Button'
import { FileText, Image, Search, Globe, Loader2, CheckCircle, AlertCircle, Download, Copy } from 'lucide-react'

export const OcrWorkspace = () => {
  const { t } = useTranslation()
  const { isInitialized, isProcessing, progress, status, currentPage, totalPages, results, lastError, initialize, runOcrOnDocument, runOcrOnImage, runOcrBatch, searchText, clearError, clearResults } = useOcrStore()
  const [selectedLanguage, setSelectedLanguage] = useState('eng+ind')
  const [activeTab, setActiveTab] = useState<'document' | 'image' | 'batch' | 'search'>('document')
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedResult, setSelectedResult] = useState<string | null>(null)

  const languages = [
    { value: 'eng', label: 'English' },
    { value: 'ind', label: 'Indonesia' },
    { value: 'eng+ind', label: 'English + Indonesia' },
    { value: 'ara', label: 'Arabic' },
    { value: 'chi_sim', label: 'Chinese (Simplified)' },
    { value: 'fra', label: 'French' },
    { value: 'deu', label: 'German' },
    { value: 'jpn', label: 'Japanese' },
    { value: 'kor', label: 'Korean' },
    { value: 'spa', label: 'Spanish' },
    { value: 'rus', label: 'Russian' },
  ]

  const handleInitialize = async () => {
    await initialize(selectedLanguage.split('+'))
  }

  const handleRunOcr = async () => {
    if (activeTab === 'document' && selectedDocumentId) {
      await runOcrOnDocument(selectedDocumentId)
    } else if (activeTab === 'batch') {
      // Run on all documents
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    const matches = await searchText(searchQuery)
    setSearchResults(matches)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">OCR</h1>
            <span className={`px-2 py-1 text-xs rounded ${isInitialized ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'}`}>
              {isInitialized ? 'Siap' : 'Belum Diinisialisasi'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <Button
              variant={isInitialized ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleInitialize}
              disabled={isProcessing}
            >
              {isInitialized ? (
                <>
                  <Globe className="mr-1 h-4 w-4" /> {t('ocr.initialize')}
                </>
              ) : (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> {t('ocr.initializing')}
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-1" role="tablist">
            {(['document', 'image', 'batch', 'search'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {tab === 'document' && <FileText className="mr-1 h-4 w-4 inline" />}
                {tab === 'image' && <Image className="mr-1 h-4 w-4 inline" />}
                {tab === 'batch' && <FileText className="mr-1 h-4 w-4 inline" />}
                {tab === 'search' && <Search className="mr-1 h-4 w-4 inline" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'document' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Pilih Dokumen</h3>
                <select
                  value={selectedDocumentId}
                  onChange={(e) => setSelectedDocumentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500"
                >
                  <option value="">-- Pilih Dokumen --</option>
                  <option value="doc1">Surat Kontrak.pdf</option>
                  <option value="doc2">Laporan Bulanan.pdf</option>
                  <option value="doc3">Scan KTP.jpg</option>
                </select>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Pilih dokumen dari library untuk OCR
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Opsi OCR</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Pratinjau sebelum simpan</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Simpan sebagai layer teks di PDF</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Buat indeks pencarian teks</span>
                  </label>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleRunOcr}
                disabled={!selectedDocumentId || !isInitialized || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('ocr.progress.processing')}
                  </>
                ) : (
                  t('ocr.documentTab.runOcr')
                )}
              </Button>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {selectedResult && (
                <OcrTextEditor
                  text={results.get(selectedDocumentId)?.[0]?.text || 'Teks hasil OCR akan muncul di sini...'}
                  confidence={results.get(selectedDocumentId)?.[0]?.confidence || 0}
                  onSave={(text) => console.log('Save:', text)}
                />
              )}

              {!selectedResult && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Belum Ada Hasil OCR</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Pilih dokumen dan klik "Mulai OCR" untuk memulai
                  </p>
                </div>
              )}

              {results.size > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 p-4 border-b border-gray-200 dark:border-gray-700">Riwayat OCR</h3>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.from(results.entries()).map(([docId, pageResults]) => (
                      <div key={docId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => setSelectedResult(docId)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{docId}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {pageResults.length} halaman • Rata-rata: {Math.round(pageResults.reduce((a, b) => a + b.confidence, 0) / pageResults.length * 100)}%
                            </p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Image className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">OCR dari Gambar</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Upload gambar untuk langsung diekstrak teksnya</p>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
                <input type="file" accept="image/*" className="hidden" id="ocr-image-upload" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) runOcrOnImage(file)
                }} />
                <label htmlFor="ocr-image-upload" className="cursor-pointer">
                  <Image className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">Seret gambar ke sini atau klik untuk memilih</p>
                </label>
              </div>
            </div>

            {selectedResult && (
              <OcrTextEditor
                text={results.get('image')?.[0]?.text || 'Teks hasil OCR dari gambar...'}
                confidence={results.get('image')?.[0]?.confidence || 0}
              />
            )}
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Batch OCR</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Jalankan OCR pada banyak dokumen sekaligus</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Semua dokumen di library</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Hanya dokumen tanpa OCR</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Hanya dokumen PDF</span>
                </label>
              </div>
              <Button className="mt-4 w-full" size="lg" onClick={handleRunOcr} disabled={!isInitialized || isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses Batch... : 'Mulai Batch OCR'}
              </Button>
            </div>

            {isProcessing && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{status}</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Halaman {currentPage} dari {totalPages}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Cari Teks dalam Dokumen</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Kata kunci pencarian..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
                  <Search className="mr-1 h-4 w-4" /> Cari
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ditemukan {searchResults.length} hasil untuk "<strong>{searchQuery}</strong>"
                  </p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((match, i) => (
                    <div key={i} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{match.documentName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Halaman {match.pageIndex + 1}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        ...{match.context}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isProcessing && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Tidak ditemukan hasil untuk "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

      </div>

      <OcrProgress />
    </div>
  )
}