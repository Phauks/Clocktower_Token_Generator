import styles from '../../styles/components/presets/PresetModal.module.css'
import modalStyles from '../../styles/components/layout/Modal.module.css'

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
    <div className={modalStyles.overlay}>
      <div className={modalStyles.backdrop} onClick={onCancel} />
      <div className={`${modalStyles.container} ${styles.modalConfirm}`}>
        <div className={modalStyles.header}>
          <h2>{title}</h2>
          <button className={modalStyles.closeBtn} onClick={onCancel}>
            ×
          </button>
        </div>
        <div className={modalStyles.body}>
          <p>{message}</p>
        </div>
        <div className={modalStyles.actions}>
          <button className={modalStyles.primaryBtn} onClick={onConfirm}>
            {confirmText}
          </button>
          <button className={modalStyles.secondaryBtn} onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}
