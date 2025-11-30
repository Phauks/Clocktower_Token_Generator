interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="settings-modal">
      <div className="modal-backdrop" onClick={onCancel} />
      <div className="modal-container modal-confirm">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}
