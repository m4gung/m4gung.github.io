import { useOcrStore } from '../../../stores/ocrStore'
import { Button } from '../../../components/ui/Button'
import { X, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export const OcrProgress = () => {
  const { isProcessing, progress, status, currentPage, totalPages, lastError, clearError } = useOcrStore()

  if (!isProcessing && progress === 0 && !lastError) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isProcessing ? (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            ) : lastError ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {isProcessing ? 'Memproses OCR' : lastError ? 'Error' : 'Selesai'}
            </span>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{status}</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {currentPage > 0 && totalPages > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Halaman {currentPage} dari {totalPages}
                </p>
              )}
            </div>
          )}

          {lastError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{lastError}</p>
          )}
        </div>
        <div className="flex gap-1">
          {isProcessing ? (
            <Button variant="ghost" size="sm" onClick={() => { /* cancel */ }}>
              <X className="h-4 w-4" />
            </Button>
          ) : lastError ? (
            <Button variant="ghost" size="sm" onClick={clearError}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => { /* dismiss */ }}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}