import { useState, useRef, useEffect } from 'react'
import styles from '../../styles/components/tokenDetail/ActionButtons.module.css'

interface ActionButtonsProps {
  isDirty: boolean
  isLoading: boolean
  liveUpdateEnabled: boolean
  autoSaveEnabled: boolean
  downloadProgress?: { current: number; total: number } | null
  onReset: () => void
  onDownloadAll: () => void
  onDownloadCharacter: () => void
  onDownloadReminders: () => void
  onDownloadJson: () => void
  onApply: () => void
  onToggleLiveUpdate: () => void
  onToggleAutoSave: () => void
  onDelete: () => void
}

export function ActionButtons({ isDirty, isLoading, liveUpdateEnabled, autoSaveEnabled, downloadProgress, onReset, onDownloadAll, onDownloadCharacter, onDownloadReminders, onDownloadJson, onApply, onToggleLiveUpdate, onToggleAutoSave, onDelete }: ActionButtonsProps) {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Calculate progress percentage from downloadProgress prop
  const progressPercent = downloadProgress && downloadProgress.total > 0 
    ? Math.round((downloadProgress.current / downloadProgress.total) * 100) 
    : 0
  const isDownloading = downloadProgress !== null && downloadProgress !== undefined

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false)
      }
    }

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDownloadMenu])

  return (
    <div className={styles.actions}>
      <div className={styles.spacer}></div>
      <button
        type="button"
        className={`${styles.toggleBtn} ${liveUpdateEnabled ? styles.active : ''}`}
        onClick={onToggleLiveUpdate}
        title={liveUpdateEnabled ? 'Live preview enabled - Click to disable' : 'Live preview disabled - Click to enable'}
        aria-label={liveUpdateEnabled ? 'Disable live preview' : 'Enable live preview'}
      >
        <span className={styles.icon}>⚡</span>
      </button>
      <button
        type="button"
        className={styles.secondaryBtn}
        onClick={onReset}
        disabled={!isDirty || isLoading}
        title="Reset all changes to the original values"
      >
        Reset
      </button>
      <div className={styles.downloadDropdown} ref={dropdownRef}>
        <div className={styles.downloadButtonGroup}>
          <button
            type="button"
            className={`${styles.downloadMainBtn} ${isDownloading ? styles.downloading : ''}`}
            onClick={onDownloadAll}
            disabled={isLoading}
            title="Download character token, reminder tokens, and JSON as ZIP"
            style={isDownloading ? { '--progress': `${progressPercent}%` } as React.CSSProperties : undefined}
          >
            <span className={styles.downloadProgress} />
            <span className={styles.icon}>📥</span>
            {isDownloading ? `${progressPercent}%` : 'Download All'}
          </button>
          <button
            type="button"
            className={`${styles.downloadCaretBtn} ${isDownloading ? styles.downloading : ''}`}
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            disabled={isLoading}
            title="More download options"
            aria-label="More download options"
            aria-expanded={showDownloadMenu}
          >
            <span className={styles.caretIcon}>▼</span>
          </button>
        </div>
        {showDownloadMenu && (
          <div className={styles.downloadMenu}>
            <button
              type="button"
              className={styles.downloadMenuItem}
              onClick={() => {
                onDownloadCharacter()
                setShowDownloadMenu(false)
              }}
            >
              Character Token Only
            </button>
            <button
              type="button"
              className={styles.downloadMenuItem}
              onClick={() => {
                onDownloadReminders()
                setShowDownloadMenu(false)
              }}
            >
              Reminder Tokens Only
            </button>
            <button
              type="button"
              className={styles.downloadMenuItem}
              onClick={() => {
                onDownloadJson()
                setShowDownloadMenu(false)
              }}
            >
              Character JSON Only
            </button>
          </div>
        )}
      </div>
      <div className={styles.saveGroup}>
        <button
          type="button"
          className={`${styles.toggleBtn} ${autoSaveEnabled ? styles.active : ''}`}
          onClick={onToggleAutoSave}
          title={autoSaveEnabled ? 'Auto-save enabled - Click to disable' : 'Auto-save disabled - Click to enable'}
          aria-label={autoSaveEnabled ? 'Disable auto-save' : 'Enable auto-save'}
        >
          <span className={styles.icon}>💾</span>
        </button>
        <button
          type="button"
          className={`${styles.primaryBtn} ${autoSaveEnabled ? styles.disabled : ''}`}
          onClick={onApply}
          disabled={autoSaveEnabled || isLoading}
          title={autoSaveEnabled ? 'Auto-save is enabled' : 'Save changes to the script JSON'}
        >
          SAVE
        </button>
      </div>
      <button
        type="button"
        className={`${styles.toggleBtn} ${styles.deleteBtn}`}
        onClick={onDelete}
        disabled={isLoading}
        title="Delete this character"
        aria-label="Delete character"
      >
        <span className={styles.icon}>🗑️</span>
      </button>
    </div>
  )
}
