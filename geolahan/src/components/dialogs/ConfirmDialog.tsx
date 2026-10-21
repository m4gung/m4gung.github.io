import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          {isDestructive && (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle className="size-5" />
            </div>
          )}
          <h3 id="confirm-dialog-title" className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
        </div>

        <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300">
          {message}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary text-xs px-3 py-2"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`text-xs px-4 py-2 rounded-lg font-medium text-white transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500/50'
                : 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500/50'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
