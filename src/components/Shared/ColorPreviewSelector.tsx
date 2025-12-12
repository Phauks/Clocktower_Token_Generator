/**
 * ColorPreviewSelector Component
 *
 * A compact color selector that shows a preview of the current color
 * with editing controls and an Apply button for controlled color changes.
 *
 * @module components/Shared/ColorPreviewSelector
 */

import { memo, useState, useRef, useEffect } from 'react'
import styles from '../../styles/components/shared/ColorPreviewSelector.module.css'

// ============================================================================
// Types
// ============================================================================

export interface ColorPreviewSelectorProps {
  /** Current color value (hex format) */
  value: string
  /** Called when color is applied */
  onChange: (value: string) => void
  /** Display label */
  label?: string
  /** Preview shape */
  shape?: 'circle' | 'square'
  /** Component size */
  size?: 'small' | 'medium' | 'large'
  /** Disabled state */
  disabled?: boolean
  /** Aria label for accessibility */
  ariaLabel?: string
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert hex color to a human-readable name or formatted hex
 */
function getColorLabel(hex: string): string {
  const normalized = hex.toUpperCase()

  // Common color names
  const colorNames: Record<string, string> = {
    '#FFFFFF': 'White',
    '#000000': 'Black',
    '#FF0000': 'Red',
    '#00FF00': 'Lime',
    '#0000FF': 'Blue',
    '#FFFF00': 'Yellow',
    '#FF00FF': 'Magenta',
    '#00FFFF': 'Cyan',
    '#808080': 'Gray',
    '#C0C0C0': 'Silver',
    '#800000': 'Maroon',
    '#808000': 'Olive',
    '#008000': 'Green',
    '#800080': 'Purple',
    '#008080': 'Teal',
    '#000080': 'Navy',
  }

  return colorNames[normalized] || normalized
}

// ============================================================================
// Component
// ============================================================================

export const ColorPreviewSelector = memo(function ColorPreviewSelector({
  value,
  onChange,
  label,
  shape = 'circle',
  size = 'medium',
  disabled = false,
  ariaLabel,
}: ColorPreviewSelectorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [pendingColor, setPendingColor] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync pending color when value prop changes (and not editing)
  useEffect(() => {
    if (!isEditing) {
      setPendingColor(value)
    }
  }, [value, isEditing])

  // Handle click on the "Change" button - enter edit mode
  const handleChangeClick = () => {
    setIsEditing(true)
    setPendingColor(value)
    // Delay to allow state update before clicking input
    setTimeout(() => {
      inputRef.current?.click()
    }, 0)
  }

  // Handle color input change
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingColor(e.target.value)
  }

  // Handle Apply - commit the change
  const handleApply = () => {
    onChange(pendingColor)
    setIsEditing(false)
  }

  // Handle Cancel - revert to original
  const handleCancel = () => {
    setPendingColor(value)
    setIsEditing(false)
  }

  // CSS class construction
  const containerClasses = [
    styles.container,
    size === 'small' && styles.compact,
    disabled && styles.disabled,
    isEditing && styles.editing,
  ].filter(Boolean).join(' ')

  const previewClasses = [
    styles.preview,
    styles[`preview${size.charAt(0).toUpperCase()}${size.slice(1)}`],
    shape === 'circle' ? styles.previewCircle : styles.previewSquare,
  ].filter(Boolean).join(' ')

  // Display the pending color when editing, otherwise show current value
  const displayColor = isEditing ? pendingColor : value
  const colorLabel = label || getColorLabel(displayColor)
  const hasChanges = isEditing && pendingColor !== value

  return (
    <div
      className={containerClasses}
      aria-label={ariaLabel ?? 'Select color'}
    >
      {/* Color Preview */}
      <div
        className={previewClasses}
        style={{ backgroundColor: displayColor }}
      >
        {/* Color input - always available for picking */}
        <input
          ref={inputRef}
          type="color"
          value={pendingColor}
          onChange={handleColorChange}
          disabled={disabled}
          className={styles.colorInput}
          aria-label={ariaLabel ?? 'Color picker'}
        />
      </div>

      {/* Info Section */}
      <div className={styles.info}>
        <span className={styles.label}>{colorLabel}</span>
        {size !== 'small' && (
          <span className={styles.hexValue}>{displayColor.toUpperCase()}</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        {isEditing ? (
          <>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.applyButton}`}
              onClick={handleApply}
              disabled={disabled}
            >
              Apply
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.cancelButton}`}
              onClick={handleCancel}
              disabled={disabled}
            >
              ✕
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.changeButton}
            onClick={handleChangeClick}
            disabled={disabled}
          >
            Change
          </button>
        )}
      </div>

      {/* Change indicator */}
      {hasChanges && (
        <span className={styles.changeIndicator} title="Unsaved changes">●</span>
      )}
    </div>
  )
})

export default ColorPreviewSelector
