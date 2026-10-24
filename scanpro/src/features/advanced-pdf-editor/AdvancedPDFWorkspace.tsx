import { useState, useEffect } from 'react'
import { useAdvancedPDFStore } from '../../stores/advancedPDFStore'
import { Button } from '../../components/ui/Button'
import {
  FileText, Search, Highlighter, PenTool, Type, CheckSquare, Layers, 
  Redo2, Undo2, Download, Upload, Shield, Eye, EyeOff, Trash2,
  Image, FilePlus, Save, RotateCcw, RotateCw, Scissors, Stamp,
  MoreHorizontal, ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react'

const advancedTools = [
  { id: 'inspect', icon: Search, label: 'Inspeksi PDF' },
  { id: 'text-annotation', icon: Type, label: 'Anotasi Teks' },
  { id: 'highlight', icon: Highlighter, label: 'Highlight' },
  { id: 'ink', icon: PenTool, label: 'Ink/Garis' },
  { id: 'text-field', icon: Type, label: 'Text Field' },
  { id: 'checkbox', icon: CheckSquare, label: 'Checkbox' },
  { id: 'radio', icon: Layers, label: 'Radio Group' },
  { id: 'dropdown', icon: ChevronRight, label: 'Dropdown' },
  { id: 'redact', icon: Scissors, label: 'Redaksi' },
  { id: 'text-overlay', icon: Type, label: 'Text Overlay' },
  { id: 'image-overlay', icon: Image, label: 'Image Overlay' },
  { id: 'watermark', icon: Stamp, label: 'Watermark' },
  { id: 'backup', icon: Shield, label: 'Backup' },
] as const

export const AdvancedPDFWorkspace = () => {
  const {
    currentDocumentId,
    inspectionReport,
    isLoading,
    isProcessing,
    error,
    inspectPDF,
    addTextAnnotation,
    addHighlightAnnotation,
    addInkAnnotation,
    addTextField,
    addCheckBox,
    addRadioGroup,
    addDropdown,
    flattenForm,
    redactArea,
    addTextOverlay,
    addImageOverlay,
    addWatermark,
    createBackup,
    verifyBackup,
    advancedEdit,
    setError,
    clearError,
  } = useAdvancedPDFStore()

  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [activeTool, setActiveTool] = useState<'none' | string>('none')
  const [activeTab, setActiveTab] = useState<'inspect' | 'annotate' | 'forms' | 'redact' | 'overlay' | 'backup'>('inspect')
  const [annotationText, setAnnotationText] = useState('')
  const [highlightColor, setHighlightColor] = useState({ r: 1, g: 1, b: 0 })
  const [inkColor, setInkColor] = useState({ r: 0, g: 0, b: 0 })
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL')
  const [showToolOptions, setShowToolOptions] = useState(false)

  const documents = [
    { id: 'doc1', name: 'Kontrak Kerja.pdf' },
    { id: 'doc2', name: 'Laporan Bulanan.pdf' },
    { id: 'doc3', name: 'Surat Perjanjian.pdf' },
  ]

  if (!useAdvancedPDFStore.getState().currentDocumentId && !selectedDocumentId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Advanced PDF Editor</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Pilih dokumen PDF untuk memulai editing lanjutan</p>
          <div className="space-y-3">
            {documents.map(doc => (
              <button
                key={doc.id}
                onClick={() => { setSelectedDocumentId(doc.id); inspectPDF(doc.id); }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-5 h-5 inline mr-2 text-gray-400" />
                {doc.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      // Save would be implemented
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Advanced PDF Editor</h1>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDocumentId}
              onChange={(e) => { setSelectedDocumentId(e.target.value); inspectPDF(e.target.value); }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
            >
              <option value="">-- Pilih Dokumen --</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
              {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                  <Button variant="ghost" size="sm" onClick={clearError}>
                    <EyeOff className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {isProcessing && (
                <Loader className="h-4 w-4 animate-spin text-blue-600" />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 flex-1">
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-1" role="tablist">
            {(['inspect', 'annotate', 'forms', 'redact', 'overlay', 'backup'] as const).map((tab) => (
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
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'inspect' && (
          <InspectTab report={useAdvancedPDFStore.getState().inspectionReport} isLoading={isLoading} />
        )}

        {activeTab === 'annotate' && (
          <AnnotateTab 
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            annotationText={annotationText}
            setAnnotationText={setAnnotationText}
            highlightColor={highlightColor}
            setHighlightColor={setHighlightColor}
            inkColor={inkColor}
            setInkColor={setInkColor}
            isProcessing={isProcessing}
            addTextAnnotation={addTextAnnotation}
            addHighlightAnnotation={addHighlightAnnotation}
            addInkAnnotation={addInkAnnotation}
          />
        )}

        {activeTab === 'forms' && (
          <FormsTab
            isProcessing={isProcessing}
            addTextField={addTextField}
            addCheckBox={addCheckBox}
            addRadioGroup={addRadioGroup}
            addDropdown={addDropdown}
            flattenForm={flattenForm}
          />
        )}

        {activeTab === 'redact' && (
          <RedactTab
            isProcessing={isProcessing}
            redactArea={redactArea}
          />
        )}

        {activeTab === 'overlay' && (
          <OverlayTab
            isProcessing={isProcessing}
            watermarkText={watermarkText}
            setWatermarkText={setWatermarkText}
            addTextOverlay={addTextOverlay}
            addImageOverlay={addImageOverlay}
            addWatermark={addWatermark}
          />
        )}

        {activeTab === 'backup' && (
          <BackupTab
            isProcessing={isProcessing}
            createBackup={createBackup}
            verifyBackup={verifyBackup}
          />
        )}
      </div>
    </div>
  )
}

const Loader = () => <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>

const InspectTab = ({ report, isLoading }: { report: any; isLoading: boolean }) => {
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>
  
  if (!report) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Belum Ada Inspeksi</h3>
        <p className="text-gray-600 dark:text-gray-400">Pilih dokumen dan tab Inspeksi akan menampilkan laporan kemampuan PDF</p>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Kemampuan PDF</h3>
        <div className="space-y-3">
          <CapabilityRow label="Ekstrak Teks" value={report.canExtractText} />
          <CapabilityRow label="Ekstrak Gambar" value={report.canExtractImages} />
          <CapabilityRow label="Modifikasi Teks" value={report.canModifyText} />
          <CapabilityRow label="Tambah Anotasi" value={report.canAddAnnotations} />
          <CapabilityRow label="Tambah Form Field" value={report.canAddFormFields} />
          <CapabilityRow label="Tanda Tangan Digital" value={report.canSign} />
          <CapabilityRow label="Redaksi" value={report.canRedact} />
          <CapabilityRow label="Optimasi" value={report.canOptimize} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Font</h3>
        {report.fonts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Tidak ada info font</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {report.fonts.map((font: any, i: number) => (
              <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">{font.name}</p>
                <p className="text-gray-500 dark:text-gray-400">Embedded: {font.embedded ? 'Ya' : 'Tidak'} • Subset: {font.subset ? 'Ya' : 'Tidak'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Halaman ({report.pages.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 px-4">Halaman</th>
                <th className="pb-2 px-4">Ukuran</th>
                <th className="pb-2 px-4">Rotasi</th>
                <th className="pb-2 px-4">Teks</th>
                <th className="pb-2 px-4">Gambar</th>
                <th className="pb-2 px-4">Form</th>
                <th className="pb-2 px-4">Anotasi</th>
              </tr>
            </thead>
            <tbody>
              {report.pages.map((page: any) => (
                <tr key={page.index} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 px-4">{page.index + 1}</td>
                  <td className="py-2 px-4">{Math.round(page.size.width)} × {Math.round(page.size.height)}</td>
                  <td className="py-2 px-4">{page.rotation}°</td>
                  <td className="py-2 px-4">{page.hasText ? '✓' : '✗'}</td>
                  <td className="py-2 px-4">{page.hasImages ? '✓' : '✗'}</td>
                  <td className="py-2 px-4">{page.hasForms ? '✓' : '✗'}</td>
                  <td className="py-2 px-4">{page.hasAnnotations ? '✓' : '✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const CapabilityRow = ({ label, value }: { label: string; value: boolean }) => (
  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    <span className={`px-2 py-1 text-xs rounded ${value ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
      {value ? 'Ya' : 'Tidak'}
    </span>
  </div>
)

const AnnotateTab = ({ 
  activeTool, setActiveTool, 
  annotationText, setAnnotationText,
  highlightColor, setHighlightColor,
  inkColor, setInkColor,
  isProcessing,
  addTextAnnotation, addHighlightAnnotation, addInkAnnotation
}: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="mb-6">
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Alat Anotasi</h3>
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'text-annotation', icon: <Type className="h-5 w-5" />, label: 'Teks' },
          { id: 'highlight', icon: <Highlighter className="h-5 w-5" />, label: 'Highlight' },
          { id: 'ink', icon: <PenTool className="h-5 w-5" />, label: 'Ink' },
        ].map(tool => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTool(activeTool === tool.id ? 'none' : tool.id)}
            className="flex items-center gap-2 px-3 py-2"
          >
            {tool.icon}
            <span className="hidden sm:inline">{tool.label}</span>
          </Button>
        ))}
      </div>
    </div>

    {activeTool === 'text-annotation' && (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Anotasi Teks</h4>
        <textarea
          value={annotationText}
          onChange={(e) => setAnnotationText(e.target.value)}
          placeholder="Masukkan teks anotasi..."
          className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded text-sm mb-2"
          rows={3}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => addTextAnnotation({ 
            pageIndex: 0, 
            type: 'text', 
            rect: { x0: 100, y0: 100, x1: 300, y1: 150 },
            contents: annotationText,
            color: { r: 0, g: 0, b: 1 },
            opacity: 1
          })} disabled={!annotationText || isProcessing}>
            Tambah Anotasi Teks
          </Button>
        </div>
      </div>
    )}

    {activeTool === 'highlight' && (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-4 border border-yellow-200 dark:border-yellow-800">
        <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Highlight Area</h4>
        <div className="flex items-center gap-4 mb-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Warna:</label>
          <input type="color" value={rgbToHex(highlightColor)} onChange={(e) => setHighlightColor(hexToRgb(e.target.value))} className="h-8 w-12 cursor-pointer" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Klik dan seret di PDF untuk membuat highlight (memerlukan integrasi PDF viewer)</p>
        <Button variant="secondary" size="sm" onClick={() => addHighlightAnnotation(0, [{
          x0: 100, y0: 100, x1: 300, y1: 100, x2: 300, y2: 150, x3: 100, y3: 150
        }], highlightColor, 0.3)} disabled={isProcessing}>
          Tambah Highlight (Contoh)
        </Button>
      </div>
    )}

    {activeTool === 'ink' && (
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4 border border-purple-200 dark:border-purple-800">
        <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Ink / Garis Tangan</h4>
        <div className="flex items-center gap-4 mb-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Warna:</label>
          <input type="color" value={rgbToHex(inkColor)} onChange={(e) => setInkColor(hexToRgb(e.target.value))} className="h-8 w-12 cursor-pointer" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Gambar di canvas PDF untuk membuat ink annotation</p>
        <Button variant="secondary" size="sm" onClick={() => addInkAnnotation(0, [[{x:100,y:100},{x:200,y:150},{x:300,y:100}]], inkColor, 2, 1)} disabled={isProcessing}>
          Tambah Ink (Contoh)
        </Button>
      </div>
    )}

    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Catatan</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Integrasi penuh dengan PDF viewer (pdf.js) diperlukan untuk interaksi klik/seret di halaman PDF.
        Tombol di atas menjalankan contoh dengan koordinat tetap.
      </p>
    </div>
  </div>
)

const FormsTab = ({ 
  isProcessing,
  addTextField, addCheckBox, addRadioGroup, addDropdown, flattenForm
}: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
    <h3 className="font-medium text-gray-900 dark:text-gray-100">Form Field Tools</h3>

    <div className="grid md:grid-cols-2 gap-4">
      <FormToolCard 
        title="Text Field" 
        icon={<Type className="h-6 w-6" />}
        description="Tambah input teks (single/multi-line, password)"
        action={() => addTextField({ 
          pageIndex: 0, 
          type: 'text', 
          name: `field_${Date.now()}`, 
          rect: { x0: 100, y0: 100, x1: 300, y1: 130 },
          fontSize: 12,
        })}
        disabled={isProcessing}
      />
      
      <FormToolCard 
        title="Checkbox" 
        icon={<CheckSquare className="h-6 w-6" />}
        description="Tambah kotak centang"
        action={() => addCheckBox({ 
          pageIndex: 0, 
          type: 'checkbox', 
          name: `check_${Date.now()}`, 
          rect: { x0: 100, y0: 100, x1: 120, y1: 120 },
          value: 'Off',
        })}
        disabled={isProcessing}
      />

      <FormToolCard 
        title="Radio Group" 
        icon={<Layers className="h-6 w-6" />}
        description="Tambah grup radio button"
        action={() => addRadioGroup('group1', [
          { pageIndex: 0, type: 'radio', name: 'group1', rect: { x0: 100, y0: 100, x1: 120, y1: 120 }, exportValue: 'option1', value: 'option1' },
          { pageIndex: 0, type: 'radio', name: 'group1', rect: { x0: 100, y0: 140, x1: 120, y1: 160 }, exportValue: 'option2', value: 'option2' },
        ])}
        disabled={isProcessing}
      />

      <FormToolCard 
        title="Dropdown" 
        icon={<ChevronRight className="h-6 w-6" />}
        description="Tambah dropdown/list"
        action={() => addDropdown({ 
          pageIndex: 0, 
          type: 'dropdown', 
          name: `dropdown_${Date.now()}`, 
          rect: { x0: 100, y0: 100, x1: 300, y1: 130 },
          options: ['Opsi 1', 'Opsi 2', 'Opsi 3'],
        })}
        disabled={isProcessing}
      />
    </div>

    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <Button 
        variant="secondary" 
        size="lg" 
        onClick={async () => { const blob = await flattenForm(); if (blob) downloadBlob(blob, 'flattened-form.pdf'); }} 
        disabled={isProcessing}
        className="w-full"
      >
        Flatten Form (Jadikan Read-Only)
      </Button>
    </div>
  </div>
)

const FormToolCard = ({ title, icon, description, action, disabled }: any) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">{icon}</div>
      <h4 className="font-medium text-gray-900 dark:text-gray-100">{title}</h4>
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
    <Button 
      variant="primary" 
      size="sm" 
      className="w-full" 
      onClick={action} 
      disabled={disabled}
    >
      Tambah
    </Button>
  </div>
)

const RedactTab = ({ isProcessing, redactArea }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Redaksi Area</h3>
    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4 border border-red-200 dark:border-red-800">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-600 dark:text-red-400">⚠</span>
        <span className="font-medium text-red-900 dark:text-red-100">Peringatan: Redaksi permanen menghapus konten</span>
      </div>
      <p className="text-sm text-red-700 dark:text-red-300">Area yang diredaksi tidak dapat dipulihkan. Buat backup terlebih dahulu.</p>
    </div>

    <div className="grid md:grid-cols-3 gap-4 mb-4">
      <input type="number" placeholder="Halaman (0-based)" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm" id="redact-page" />
      <input type="number" placeholder="X" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm" id="redact-x" />
      <input type="number" placeholder="Y" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm" id="redact-y" />
      <input type="number" placeholder="Width" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm" id="redact-w" />
      <input type="number" placeholder="Height" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm" id="redact-h" />
      <input type="color" value="#000000" className="h-10 w-full cursor-pointer" id="redact-color" />
    </div>

    <Button 
      variant="danger" 
      size="lg" 
      onClick={() => {
        const page = parseInt((document.getElementById('redact-page') as HTMLInputElement)?.value || '0')
        const x = parseInt((document.getElementById('redact-x') as HTMLInputElement)?.value || '0')
        const y = parseInt((document.getElementById('redact-y') as HTMLInputElement)?.value || '0')
        const w = parseInt((document.getElementById('redact-w') as HTMLInputElement)?.value || '100')
        const h = parseInt((document.getElementById('redact-h') as HTMLInputElement)?.value || '50')
        const color = hexToRgb((document.getElementById('redact-color') as HTMLInputElement)?.value || '#000000')
        redactArea(page, { x0: x, y0: y, x1: x + w, y1: y + h }, color)
      }} 
      disabled={isProcessing}
      className="w-full"
    >
      Redaksi Area
    </Button>
  </div>
)

const OverlayTab = ({ 
  isProcessing, 
  watermarkText, setWatermarkText,
  addTextOverlay, addImageOverlay, addWatermark
}: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
    <div>
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Text Overlay</h3>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <input type="text" placeholder="Teks overlay" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="overlay-text" />
        <input type="number" placeholder="Halaman" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="overlay-page" />
        <input type="color" value="#000000" className="h-10 w-full cursor-pointer" id="overlay-color" />
      </div>
      <div className="grid md:grid-cols-4 gap-4 mb-4">
        <input type="number" placeholder="X" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="overlay-x" />
        <input type="number" placeholder="Y" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="overlay-y" />
        <input type="number" placeholder="Font Size" value="12" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="overlay-size" />
        <input type="number" placeholder="Rotation" value="0" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="overlay-rot" />
      </div>
      <Button 
        onClick={() => {
          const page = parseInt((document.getElementById('overlay-page') as HTMLInputElement)?.value || '0')
          const text = (document.getElementById('overlay-text') as HTMLInputElement)?.value || ''
          const x = parseInt((document.getElementById('overlay-x') as HTMLInputElement)?.value || '100')
          const y = parseInt((document.getElementById('overlay-y') as HTMLInputElement)?.value || '100')
          const size = parseInt((document.getElementById('overlay-size') as HTMLInputElement)?.value || '12')
          const rot = parseInt((document.getElementById('overlay-rot') as HTMLInputElement)?.value || '0')
          const color = { r: 0, g: 0, b: 0 }
          addTextOverlay(page, text, { x, y }, { fontSize: size, color, rotation: rot })
        }}
        disabled={isProcessing}
      >
        Tambah Text Overlay
      </Button>
    </div>

    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Image Overlay</h3>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <input type="file" accept="image/*" className="hidden" id="overlay-image" onChange={(e) => {}} />
        <label htmlFor="overlay-image" className="col-span-2">
          <Button variant="secondary">Pilih Gambar</Button>
        </label>
        <input type="number" placeholder="Halaman" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="img-page" />
        <input type="number" placeholder="X" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="img-x" />
        <input type="number" placeholder="Y" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="img-y" />
        <input type="number" placeholder="Width" value="200" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="img-w" />
        <input type="number" placeholder="Height" value="150" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="img-h" />
      </div>
    </div>

    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Watermark</h3>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <input 
          type="text" 
          value={watermarkText} 
          onChange={(e) => setWatermarkText(e.target.value)} 
          placeholder="Teks Watermark" 
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
        />
        <input type="color" value="#888888" className="h-10 w-full cursor-pointer" id="wm-color" />
        <input type="number" placeholder="Opacity (0-1)" value="0.15" step="0.05" min="0" max="1" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="wm-opacity" />
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <input type="number" placeholder="Font Size" value="48" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="wm-size" />
        <input type="number" placeholder="Rotation" value="45" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="wm-rot" />
        <input type="number" placeholder="Spacing" value="200" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="wm-spacing" />
      </div>
      <Button 
        variant="secondary"
        onClick={() => {
          const text = watermarkText
          const color = hexToRgb((document.getElementById('wm-color') as HTMLInputElement)?.value || '#888888')
          const opacity = parseFloat((document.getElementById('wm-opacity') as HTMLInputElement)?.value || '0.15')
          const fontSize = parseInt((document.getElementById('wm-size') as HTMLInputElement)?.value || '48')
          const rotation = parseInt((document.getElementById('wm-rot') as HTMLInputElement)?.value || '45')
          const spacing = parseInt((document.getElementById('wm-spacing') as HTMLInputElement)?.value || '200')
          addWatermark(text, { color, opacity, fontSize, rotation, spacing }).then(blob => {
            if (blob) downloadBlob(blob, 'watermarked.pdf')
          })
        }}
        disabled={isProcessing}
        className="w-full"
      >
        Terapkan Watermark & Download
      </Button>
    </div>
  </div>
)

const BackupTab = ({ isProcessing, createBackup, verifyBackup }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
    <div>
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Backup Dokumen</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">Buat backup terverifikasi dari dokumen PDF sebelum editing berisiko</p>
      <Button 
        variant="primary" 
        size="lg" 
        onClick={async () => { const id = await createBackup(); if (id) alert(`Backup dibuat: ${id}`); }} 
        disabled={isProcessing}
        className="w-full"
      >
        Buat Backup Terverifikasi
      </Button>
    </div>

    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Verifikasi Backup</h3>
      <div className="flex gap-4 mb-4">
        <input type="text" placeholder="Backup ID" className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" id="verify-backup-id" />
        <Button 
          variant="secondary"
          onClick={async () => { const id = (document.getElementById('verify-backup-id') as HTMLInputElement)?.value; const verified = await verifyBackup(id); alert(verified ? 'Backup valid ✓' : 'Backup TIDAK valid ✗'); }}
          disabled={isProcessing}
        >
          Verifikasi
        </Button>
      </div>
    </div>
  </div>
)

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  return '#' + [rgb.r, rgb.g, rgb.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  } : { r: 0, g: 0, b: 0 }
}