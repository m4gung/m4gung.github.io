import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Dashboard } from './features/dashboard/Dashboard'
import { Settings } from './features/settings/Settings'
import { DocumentList } from './features/documents/DocumentList'
import { DocumentsLayout } from './layouts/DocumentsLayout'
import { CreateDocument } from './features/documents/CreateDocument'
import { ImageImport } from './features/documents/ImageImport'
import { ScannerWorkspace } from './features/scanner/ScannerWorkspace'
import { PDFEditorWorkspace } from './features/pdf-editor/PDFEditorWorkspace'
import { CanvasEditorWorkspace } from './features/canvas-editor/CanvasEditorWorkspace'
import { OcrWorkspace } from './features/ocr/OcrWorkspace'
import { AdvancedPDFWorkspace } from './features/advanced-pdf-editor/AdvancedPDFWorkspace'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">ScanPro Studio</h1>
          <nav className="space-x-4">
            <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link>
            <Link to="/scan" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Pindai</Link>
            <Link to="/pdf" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">PDF Editor</Link>
            <Link to="/canvas" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Canvas Editor</Link>
            <Link to="/ocr" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">OCR</Link>
            <Link to="/advanced-pdf" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Advanced PDF</Link>
            <Link to="/documents" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Dokumen</Link>
            <Link to="/settings" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Pengaturan</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/documents" element={<Layout><DocumentList /></Layout>} />
        <Route path="/documents/new" element={<Layout><CreateDocument /></Layout>} />
        <Route path="/documents/import" element={<Layout><ImageImport /></Layout>} />
        <Route path="/scan" element={<Layout><ScannerWorkspace /></Layout>} />
        <Route path="/pdf/:documentId?" element={<Layout><PDFEditorWorkspace /></Layout>} />
        <Route path="/canvas" element={<Layout><CanvasEditorWorkspace /></Layout>} />
        <Route path="/ocr" element={<Layout><OcrWorkspace /></Layout>} />
        <Route path="/advanced-pdf" element={<Layout><AdvancedPDFWorkspace /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
