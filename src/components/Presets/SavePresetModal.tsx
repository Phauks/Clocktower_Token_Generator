import { useState, useRef, useCallback } from 'react'

interface SavePresetModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, icon: string, description: string) => void
  onImport?: (file: File) => Promise<void>
  importError?: string | null
}

export function SavePresetModal({ isOpen, onClose, onSave, onImport, importError }: SavePresetModalProps) {
  const [presetName, setPresetName] = useState('')
  const [presetDescription, setPresetDescription] = useState('')
  const [presetIcon, setPresetIcon] = useState('⭐')
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    if (!presetName.trim()) {
      return
    }
    try {
      onSave(presetName, presetIcon, presetDescription)
      setPresetName('')
      setPresetDescription('')
      setPresetIcon('⭐')
    } catch (err) {
      console.error('Failed to save preset:', err)
    }
  }

  const handleImportClick = () => {
    setLocalError(null)
    importInputRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImport) {
      setLocalError(null)
      try {
        await onImport(file)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to import preset'
        setLocalError(message)
      }
      e.target.value = ''
    }
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onImport) {
      setIsDragging(true)
    }
  }, [onImport])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setLocalError(null)

    if (!onImport) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        try {
          await onImport(file)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to import preset'
          setLocalError(message)
        }
      } else {
        setLocalError('Please drop a JSON file')
      }
    }
  }, [onImport])

  // Combine local and passed-in errors
  const displayError = localError || importError

  if (!isOpen) return null

  return (
    <div className="settings-modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div 
        className={`modal-container ${isDragging ? 'drag-over' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="modal-header">
          <h2>Save Current Settings as Preset</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {displayError && (
            <div className="error-message" style={{ marginBottom: 'var(--spacing-md)' }}>
              ⚠️ {displayError}
            </div>
          )}
          <form className="preset-modal-form">
            <div className="form-group">
              <label htmlFor="presetName">Preset Name *</label>
              <input
                id="presetName"
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="My Custom Preset"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSave()
                  }
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="presetDescription">Description</label>
              <input
                id="presetDescription"
                type="text"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Optional description of this preset"
              />
            </div>
            <div className="form-group">
              <label htmlFor="presetIcon">Icon</label>
              <div className="emoji-picker">
                {['⭐', '🌸', '⬜', '🎨', '✨', '🎭', '🎪', '🎯', '🌙', '🔥', '💎', '🍀'].map((emoji) => (
                  <button
                    key={emoji}
                    className={`emoji-option ${presetIcon === emoji ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      setPresetIcon(emoji)
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
        <div className="modal-actions">
          {onImport && (
            <>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
              <button className="btn-secondary" onClick={handleImportClick}>
                📥 Import
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!presetName.trim()}>
            Save Preset
          </button>
        </div>
      </div>
    </div>
  )
}
