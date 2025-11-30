import { useState, useEffect } from 'react'
import type { CustomPreset } from '../../hooks/usePresets'

interface EditPresetModalProps {
  isOpen: boolean
  preset: CustomPreset
  onClose: () => void
  onSave: (name: string, icon: string, description: string) => void
}

export function EditPresetModal({ isOpen, preset, onClose, onSave }: EditPresetModalProps) {
  const [presetName, setPresetName] = useState(preset.name)
  const [presetDescription, setPresetDescription] = useState(preset.description || '')
  const [presetIcon, setPresetIcon] = useState(preset.icon)

  // Reset form when preset changes
  useEffect(() => {
    setPresetName(preset.name)
    setPresetDescription(preset.description || '')
    setPresetIcon(preset.icon)
  }, [preset])

  const handleSave = () => {
    if (!presetName.trim()) {
      return
    }
    onSave(presetName, presetIcon, presetDescription)
  }

  if (!isOpen) return null

  return (
    <div className="settings-modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-container">
        <div className="modal-header">
          <h2>Edit Preset</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <form className="preset-modal-form">
            <div className="form-group">
              <label htmlFor="editPresetName">Preset Name *</label>
              <input
                id="editPresetName"
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
              <label htmlFor="editPresetDescription">Description</label>
              <input
                id="editPresetDescription"
                type="text"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Optional description of this preset"
              />
            </div>
            <div className="form-group">
              <label htmlFor="editPresetIcon">Icon</label>
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
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!presetName.trim()}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
