import { useState, useRef, useEffect } from 'react'

interface ActionButtonsProps {
  isDirty: boolean
  isLoading: boolean
  liveUpdateEnabled: boolean
  autoSaveEnabled: boolean
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

export function ActionButtons({ isDirty, isLoading, liveUpdateEnabled, autoSaveEnabled, onReset, onDownloadAll, onDownloadCharacter, onDownloadReminders, onDownloadJson, onApply, onToggleLiveUpdate, onToggleAutoSave, onDelete }: ActionButtonsProps) {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    <div className="token-detail-actions">
      <div className="action-spacer"></div>
      <button
        type="button"
        className={`btn-icon-toggle ${liveUpdateEnabled ? 'active' : ''}`}
        onClick={onToggleLiveUpdate}
        title={liveUpdateEnabled ? 'Live preview enabled - Click to disable' : 'Live preview disabled - Click to enable'}
        aria-label={liveUpdateEnabled ? 'Disable live preview' : 'Enable live preview'}
      >
        <span className="btn-icon">⚡</span>
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={onReset}
        disabled={!isDirty || isLoading}
        title="Reset all changes to the original values"
      >
        Reset
      </button>
      <div className="download-dropdown" ref={dropdownRef}>
        <div className="download-button-group">
          <button
            type="button"
            className="btn-secondary download-main-btn"
            onClick={onDownloadAll}
            disabled={isLoading}
            title="Download character token, reminder tokens, and JSON as ZIP"
          >
            <span className="btn-icon">📥</span>
            Download All
          </button>
          <button
            type="button"
            className="btn-secondary download-caret-btn"
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            disabled={isLoading}
            title="More download options"
            aria-label="More download options"
            aria-expanded={showDownloadMenu}
          >
            <span className="caret-icon">▼</span>
          </button>
        </div>
        {showDownloadMenu && (
          <div className="download-menu">
            <button
              type="button"
              className="download-menu-item"
              onClick={() => {
                onDownloadCharacter()
                setShowDownloadMenu(false)
              }}
            >
              Character Token Only
            </button>
            <button
              type="button"
              className="download-menu-item"
              onClick={() => {
                onDownloadReminders()
                setShowDownloadMenu(false)
              }}
            >
              Reminder Tokens Only
            </button>
            <button
              type="button"
              className="download-menu-item"
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
      <div className="save-group">
        <button
          type="button"
          className={`btn-icon-toggle ${autoSaveEnabled ? 'active' : ''}`}
          onClick={onToggleAutoSave}
          title={autoSaveEnabled ? 'Auto-save enabled - Click to disable' : 'Auto-save disabled - Click to enable'}
          aria-label={autoSaveEnabled ? 'Disable auto-save' : 'Enable auto-save'}
        >
          <span className="btn-icon">💾</span>
        </button>
        <button
          type="button"
          className={`btn-primary ${autoSaveEnabled ? 'btn-disabled' : ''}`}
          onClick={onApply}
          disabled={autoSaveEnabled || isLoading}
          title={autoSaveEnabled ? 'Auto-save is enabled' : 'Save changes to the script JSON'}
        >
          SAVE
        </button>
      </div>
      <button
        type="button"
        className="btn-icon-toggle btn-delete"
        onClick={onDelete}
        disabled={isLoading}
        title="Delete this character"
        aria-label="Delete character"
      >
        <span className="btn-icon">🗑️</span>
      </button>
    </div>
  )
}
