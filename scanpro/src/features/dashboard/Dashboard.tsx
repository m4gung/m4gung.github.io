import { Link } from 'react-router-dom'
import {
  Camera, FileText, Palette, FileSearch, Layers, Upload, Plus,
  ShieldCheck, HardDrive, Zap, Sparkles, Clock, ArrowRight,
  CheckCircle2, Lock
} from 'lucide-react'
import { useTranslation } from '../../lib/i18n'
import { useDocumentStore } from '../../stores/documentStore'
import { useEffect } from 'react'

export const Dashboard = () => {
  const { t } = useTranslation()
  const { documents, loadDocuments } = useDocumentStore()

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const quickActions = [
    {
      to: '/scan',
      title: 'Scan Document',
      description: 'Capture with camera, auto-crop & perspective fix',
      icon: Camera,
      badge: 'Popular',
      color: 'from-blue-600 to-indigo-600',
      iconColor: 'text-blue-500',
    },
    {
      to: '/pdf',
      title: 'PDF Editor',
      description: 'Merge, split, rotate, watermark & reorder pages',
      icon: FileText,
      badge: 'Essential',
      color: 'from-emerald-600 to-teal-600',
      iconColor: 'text-emerald-500',
    },
    {
      to: '/canvas',
      title: 'Canvas Studio',
      description: 'Sign, draw, add shapes, stamp & markup images',
      icon: Palette,
      color: 'from-purple-600 to-pink-600',
      iconColor: 'text-purple-500',
    },
    {
      to: '/ocr',
      title: 'Extract Text (OCR)',
      description: 'Local on-device text recognition with Tesseract',
      icon: FileSearch,
      badge: 'Offline',
      color: 'from-amber-600 to-orange-600',
      iconColor: 'text-amber-500',
    },
    {
      to: '/advanced-pdf',
      title: 'Advanced PDF & Forms',
      description: 'PDF inspection, form fields, redactions & backup',
      icon: Layers,
      color: 'from-cyan-600 to-blue-700',
      iconColor: 'text-cyan-500',
    },
    {
      to: '/documents/import',
      title: 'Import Images',
      description: 'Convert JPG, PNG, WEBP directly into documents',
      icon: Upload,
      color: 'from-rose-600 to-pink-600',
      iconColor: 'text-rose-500',
    },
  ]

  const recentDocs = documents.slice(0, 4)

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 text-white p-6 md:p-10 shadow-xl mb-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-4 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>100% Client-Side & Private</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
            ScanPro Studio
          </h1>
          <p className="text-blue-100 text-base md:text-lg mb-6 leading-relaxed">
            Professional document scanning, PDF tools, OCR recognition, and canvas markup right inside your browser. No files are uploaded to any server.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 font-semibold shadow-lg hover:bg-blue-50 active:scale-95 transition-all text-sm md:text-base"
            >
              <Camera className="w-5 h-5" />
              <span>Start Scanning</span>
            </Link>
            <Link
              to="/documents/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold border border-white/20 active:scale-95 transition-all text-sm md:text-base"
            >
              <Plus className="w-5 h-5" />
              <span>New Document</span>
            </Link>
          </div>
        </div>

        {/* Ambient background blur elements */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-20 w-60 h-60 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />
      </div>

      {/* Feature Highlights / Value Props */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Privacy</div>
            <div className="font-semibold text-sm">100% On-Device</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Storage</div>
            <div className="font-semibold text-sm">Offline IndexedDB</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Performance</div>
            <div className="font-semibold text-sm">WebAssembly Speed</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Compliance</div>
            <div className="font-semibold text-sm">Zero Data Leaks</div>
          </div>
        </div>
      </div>

      {/* Main Tools Grid */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Studio Tools
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Touch-friendly & responsive
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${action.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {action.badge && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {action.description}
                  </p>
                </div>

                <div className="flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                  <span>Open tool</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Recent Documents
            </h2>
          </div>
          <Link
            to="/documents"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentDocs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentDocs.map((doc) => (
              <Link
                key={doc.id}
                to={`/pdf/${doc.id}`}
                className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500 transition shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                    PDF
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">
                      {doc.name}
                    </h4>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {doc.pages?.length || 0} pages
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-800 p-8 text-center bg-gray-50/50 dark:bg-gray-900/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              No documents created yet. Scan or create your first document to see it here.
            </p>
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Now</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
