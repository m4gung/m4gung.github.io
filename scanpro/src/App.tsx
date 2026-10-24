import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { MobileNavBar } from './components/layout/MobileNavBar'
import { Dashboard } from './features/dashboard/Dashboard'
import { Settings } from './features/settings/Settings'
import { DocumentList } from './features/documents/DocumentList'
import { CreateDocument } from './features/documents/CreateDocument'
import { ImageImport } from './features/documents/ImageImport'
import { ScannerWorkspace } from './features/scanner/ScannerWorkspace'
import { PDFEditorWorkspace } from './features/pdf-editor/PDFEditorWorkspace'
import { CanvasEditorWorkspace } from './features/canvas-editor/CanvasEditorWorkspace'
import { OcrWorkspace } from './features/ocr/OcrWorkspace'
import { AdvancedPDFWorkspace } from './features/advanced-pdf-editor/AdvancedPDFWorkspace'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col transition-colors">
      <Header />
      <main className="flex-1 pb-20 lg:pb-8">{children}</main>
      <MobileNavBar />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename="/scanpro">
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
