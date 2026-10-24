import { useState, useEffect } from 'react'
import { useScannerStore } from '../../../stores/scannerStore'
import { useTranslation } from '../../../lib/i18n'
import { CameraPreview } from './CameraPreview'
import { ScanPreview } from './ScanPreview'
import { Button } from '../../../components/ui/Button'
import { RotateCw, RotateCcw, Crop, Save, X, ChevronLeft, ChevronRight, Trash2, ImageIcon, Camera, Settings } from 'lucide-react'

export const ScannerWorkspace = () => {
  const { t } = useTranslation()
  const {
    session,
    isStreaming,
    isProcessing,
    error,
    availableDevices,
    currentDevice,
    initializeCamera,
    stopCamera,
    capturePage,
    processPage,
    reorderPage,
    removePage,
    saveSession,
    startSession,
    setError,
    clearError,
  } = useScannerStore()

  const [activeTab, setActiveTab] = useState<'capture' | 'review'>('capture')
  const [selectedPage, setSelectedPage] = useState<string | null>(null)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustTab, setAdjustTab] = useState<'perspective' | 'rotate' | 'enhance'>('perspective')
  const [enhancement, setEnhancement] = useState({ contrast: 1, brightness: 0, sharpen: false, grayscale: false })
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (activeTab === 'capture') {
      initializeCamera()
    } else {
      stopCamera()
    }
    return () => {
      stopCamera()
    }
  }, [activeTab])

  const handleCapture = async () => {
    await capturePage()
    if (session?.pages.length && session.pages.length > session.pages.length - 1) {
      const newPage = session.pages[session.pages.length - 1]
      setSelectedPage(newPage.id)
      setActiveTab('review')
    }
  }

  const handleSaveAdjustments = () => {
    if (!selectedPage) return
    processPage(selectedPage, {
      perspective: isAdjusting ? undefined : undefined,
      rotation,
      enhancement,
    })
    setIsAdjusting(false)
    setAdjustTab('perspective')
  }

  const handleRotate = (deg: number) => {
    setRotation((r) => (r + deg + 360) % 360)
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Mulai Sesi Scan Baru</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Masukkan nama sesi untuk memulai</p>
          <ScannerSessionStarter onStart={startSession} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => { setActiveTab('capture'); stopSession(); }}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Selesai
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{session.name}</h1>
            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              {session.pages.length} halaman
            </span>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <div className="text-red-600 text-sm mr-4">{error}</div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setActiveTab(activeTab === 'capture' ? 'review' : 'capture')}>
              {activeTab === 'capture' ? (
                <> <ImageIcon className="h-4 w-4 mr-1" /> {t('scanner.preview')} </>
              ) : (
                <> <Camera className="h-4 w-4 mr-1" /> {t('scanner.scan')} </>
              )}
            </Button>
            <Button isLoading={isProcessing} onClick={saveSession} disabled={session.pages.length === 0}>
              <Save className="h-4 w-4 mr-1" />
              Simpan
            </Button>
          </div>
        </div>
      </header>

      {activeTab === 'capture' ? (
        <div className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center">
          <CameraPreview
            isStreaming={isStreaming}
            onStreamReady={(video) => cameraAdapter.setVideoElement(video)}
          />
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              className="w-16 h-16 rounded-full flex items-center justify-center"
              onClick={() => setAdjustTab('perspective')}
            >
              <Settings className="h-6 w-6" />
            </Button>
            <Button
              size="xl"
              className="w-20 h-20 rounded-full bg-blue-600 text-white shadow-lg active:scale-95"
              onClick={handleCapture}
              disabled={isProcessing || !isStreaming}
            >
              <Camera className="h-8 w-8" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-16 h-16 rounded-full flex items-center justify-center"
              onClick={() => {}}
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
          </div>
          <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
            Posisikan dokumen dalam frame, lalu tekan tombol putih untuk memindai
          </p>
        </div>
      ) : (
        <div className="flex-1 container mx-auto px-4 py-6">
          <div className="mb-6">
            <div className="flex gap-2 mb-4" role="tablist">
              {session.pages.map((page, i) => (
                <button
                  key={page.id}
                  role="tab"
                  aria-selected={selectedPage === page.id}
                  onClick={() => { setSelectedPage(page.id); setIsAdjusting(false); }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPage === page.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Halaman {i + 1}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 p-0.5"
                    onClick={(e) => { e.stopPropagation(); removePage(page.id); if (selectedPage === page.id) setSelectedPage(null); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </button>
              ))}
            </div>
          </div>

          {selectedPage && session.pages.find((p) => p.id === selectedPage) && (
            <>
              <div className="mb-6">
                <ScanPreview
                  src={session.pages.find((p) => p.id === selectedPage)!.previewUrl}
                  onCornersChange={(c) => processPage(selectedPage!, { perspective: c as any })}
                  isAdjusting={isAdjusting && adjustTab === 'perspective'}
                />
              </div>

              {isAdjusting && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                  <div className="flex gap-2 mb-4" role="tablist">
                    {(['perspective', 'rotate', 'enhance'] as const).map((tab) => (
                      <button
                        key={tab}
                        role="tab"
                        aria-selected={adjustTab === tab}
                        onClick={() => setAdjustTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          adjustTab === tab
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {tab === 'perspective' ? 'Perspektif' : tab === 'rotate' ? 'Rotasi' : 'Perbaikan'}
                      </button>
                    ))}
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setIsAdjusting(false); setRotation(0); setEnhancement({ contrast: 1, brightness: 0, sharpen: false, grayscale: false }); }}>
                      Batal
                    </Button>
                    <Button size="sm" onClick={handleSaveAdjustments}>
                      Terapkan
                    </Button>
                  </div>

                  {adjustTab === 'perspective' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Seret 4 titik sudut untuk mengatur perspektif dokumen</p>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setIsAdjusting(true)} disabled={isAdjusting}>
                          {isAdjusting ? 'Selesai Menyesuaikan' : 'Mulai Menyesuaikan'}
                        </Button>
                        <Button variant="secondary" onClick={() => processPage(selectedPage!, { perspective: undefined })}>
                          Reset
                        </Button>
                      </div>
                    </div>
                  )}

                  {adjustTab === 'rotate' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Rotasi: {rotation}°</p>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => handleRotate(-90)}>
                          <RotateCcw className="h-4 w-4 mr-1" /> Kiri 90°
                        </Button>
                        <Button variant="secondary" onClick={() => handleRotate(90)}>
                          <RotateCw className="h-4 w-4 mr-1" /> Kanan 90°
                        </Button>
                        <Button variant="secondary" onClick={() => handleRotate(180)}>
                          <RotateCw className="h-4 w-4 mr-1" /> 180°
                        </Button>
                      </div>
                    </div>
                  )}

                  {adjustTab === 'enhance' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Kontras: {enhancement.contrast.toFixed(1)}x
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={enhancement.contrast}
                          onChange={(e) => setEnhancement((p) => ({ ...p, contrast: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Kecerahan: {enhancement.brightness > 0 ? '+' : ''}{enhancement.brightness.toFixed(1)}
                        </label>
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.1"
                          value={enhancement.brightness}
                          onChange={(e) => setEnhancement((p) => ({ ...p, brightness: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={enhancement.sharpen}
                            onChange={(e) => setEnhancement((p) => ({ ...p, sharpen: e.target.checked }))}
                            className="h-4 w-4 text-blue-600"
                          />
                          Tajamkan
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={enhancement.grayscale}
                            onChange={(e) => setEnhancement((p) => ({ ...p, grayscale: e.target.checked }))}
                            className="h-4 w-4 text-blue-600"
                          />
                          Grayscale
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isAdjusting && selectedPage && (
                <div className="flex gap-2 justify-center">
                  <Button variant="secondary" onClick={() => { setIsAdjusting(true); setAdjustTab('perspective'); }}>
                    <Crop className="h-4 w-4 mr-1" /> Crop & Perspektif
                  </Button>
                  <Button variant="secondary" onClick={() => { setIsAdjusting(true); setAdjustTab('rotate'); }}>
                    <RotateCw className="h-4 w-4 mr-1" /> Rotasi
                  </Button>
                  <Button variant="secondary" onClick={() => { setIsAdjusting(true); setAdjustTab('enhance'); }}>
                    <Settings className="h-4 w-4 mr-1" /> Perbaikan
                  </Button>
                </div>
              )}
            </>
          )}

          {session.pages.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Camera className="w-12 h-12 mx-auto mb-4" />
              <p>Belum ada halaman dipindai</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const ScannerSessionStarter = ({ onStart }: { onStart: (name: string) => Promise<void> }) => {
  const [name, setName] = useState('')

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onStart(name.trim()); }} className="max-w-md mx-auto">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Contoh: Surat Kontrak"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 text-lg"
        autoFocus
      />
      <Button type="submit" className="mt-4 w-full" size="lg">
        Mulai Scan
      </Button>
    </form>
  )
}

