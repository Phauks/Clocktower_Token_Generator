import { useToast, type Toast as ToastType } from '../../contexts/ToastContext'

const icons: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useToast()

  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
