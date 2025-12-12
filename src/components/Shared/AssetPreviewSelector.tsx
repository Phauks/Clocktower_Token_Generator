/**
 * AssetPreviewSelector Component
 *
 * A compact asset selector that shows a preview of the current selection
 * with a "Change" button that opens the AssetManagerModal.
 *
 * @module components/Shared/AssetPreviewSelector
 *
 * @example
 * ```tsx
 * <AssetPreviewSelector
 *   value={generationOptions.characterBackground}
 *   onChange={(value) => onOptionChange({ characterBackground: value })}
 *   assetType="token-background"
 *   label="Background"
 *   shape="circle"
 * />
 * ```
 */

import { useState, useEffect, memo } from 'react'
import type { AssetType } from '../../services/upload/types.js'
import { isAssetReference, extractAssetId } from '../../services/upload/assetResolver.js'
import { assetStorageService } from '../../services/upload/index.js'
import {
  getBuiltInAsset,
  getBuiltInAssetPath,
  isBuiltInAsset,
} from '../../ts/constants/builtInAssets.js'
import { AssetManagerModal } from '../Modals/AssetManagerModal'
import styles from '../../styles/components/shared/AssetPreviewSelector.module.css'

// ============================================================================
// Types
// ============================================================================

export interface AssetPreviewSelectorProps {
  /** Current value: built-in ID, "asset:uuid", or "none" */
  value: string
  /** Called when selection changes */
  onChange: (value: string) => void
  /** Asset type for filtering in modal */
  assetType: AssetType
  /** Display label (shown next to preview) */
  label?: string
  /** Preview shape */
  shape?: 'circle' | 'square'
  /** Component size */
  size?: 'small' | 'medium' | 'large'
  /** Show "None" option */
  showNone?: boolean
  /** Label for none option */
  noneLabel?: string
  /** Project ID for scoping assets */
  projectId?: string
  /** Disabled state */
  disabled?: boolean
  /** Aria label for accessibility */
  ariaLabel?: string
  /** Generation options for live preview in modal */
  generationOptions?: import('../../ts/types/index.js').GenerationOptions
}

// ============================================================================
// Component
// ============================================================================

export const AssetPreviewSelector = memo(function AssetPreviewSelector({
  value,
  onChange,
  assetType,
  label,
  shape = 'square',
  size = 'medium',
  showNone = false,
  noneLabel = 'None',
  projectId,
  disabled = false,
  ariaLabel,
  generationOptions,
}: AssetPreviewSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [assetLabel, setAssetLabel] = useState<string>('')
  const [source, setSource] = useState<'builtin' | 'user' | 'global' | 'none'>('none')

  // Resolve the current value to a preview URL
  useEffect(() => {
    let cancelled = false

    async function resolvePreview() {
      if (!value || value === 'none') {
        setPreviewUrl(null)
        setAssetLabel(noneLabel)
        setSource('none')
        return
      }

      setIsLoading(true)

      // Check if it's a built-in asset
      if (isBuiltInAsset(value, assetType)) {
        const builtIn = getBuiltInAsset(value, assetType)
        if (builtIn) {
          setPreviewUrl(builtIn.thumbnail ?? builtIn.src)
          setAssetLabel(builtIn.label)
          setSource('builtin')
          setIsLoading(false)
          return
        }
      }

      // Check if it's an asset reference
      if (isAssetReference(value)) {
        const assetId = extractAssetId(value)
        if (assetId) {
          try {
            const asset = await assetStorageService.getByIdWithUrl(assetId)
            if (!cancelled && asset) {
              setPreviewUrl(asset.thumbnailUrl ?? asset.url ?? null)
              setAssetLabel(asset.metadata?.filename ?? 'Custom Asset')
              setSource(asset.projectId ? 'user' : 'global')
            }
          } catch {
            if (!cancelled) {
              setPreviewUrl(null)
              setAssetLabel('Asset not found')
              setSource('none')
            }
          }
        }
      } else {
        // Try as a direct path (fallback)
        setPreviewUrl(value)
        setAssetLabel(label ?? 'Custom')
        setSource('builtin')
      }

      if (!cancelled) {
        setIsLoading(false)
      }
    }

    resolvePreview()

    return () => {
      cancelled = true
    }
  }, [value, assetType, noneLabel, label])

  // Handle asset selection from modal
  const handleSelectAsset = (selectedId: string) => {
    onChange(selectedId)
    setIsModalOpen(false)
  }

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  // CSS class construction
  const containerClasses = [
    styles.container,
    size === 'small' && styles.compact,
    disabled && styles.disabled,
  ].filter(Boolean).join(' ')

  const previewClasses = [
    styles.preview,
    styles[`preview${size.charAt(0).toUpperCase()}${size.slice(1)}`],
    shape === 'circle' ? styles.previewCircle : styles.previewSquare,
    isLoading && styles.previewLoading,
    !previewUrl && source === 'none' && styles.previewNone,
  ].filter(Boolean).join(' ')

  return (
    <>
      <div
        className={containerClasses}
        aria-label={ariaLabel ?? `Select ${assetType}`}
      >
        {/* Preview Thumbnail */}
        <div className={previewClasses}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={assetLabel}
              className={styles.previewImage}
              loading="lazy"
            />
          ) : (
            <span className={styles.previewNone}>∅</span>
          )}

        </div>

        {/* Info Section */}
        <div className={styles.info}>
          <span className={styles.label}>{assetLabel}</span>
          {size !== 'small' && (
            <span className={styles.source}>
              {source === 'none' ? 'No selection' : source === 'builtin' ? 'Built-in' : source === 'user' ? 'My Upload' : 'Global'}
            </span>
          )}
        </div>

        {/* Change Button */}
        <button
          type="button"
          className={styles.changeButton}
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
        >
          Change
        </button>
      </div>

      {/* Asset Manager Modal */}
      <AssetManagerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        projectId={projectId}
        initialAssetType={assetType}
        selectionMode={true}
        onSelectAsset={handleSelectAsset}
        includeBuiltIn={true}
        showNoneOption={showNone}
        noneLabel={noneLabel}
        generationOptions={generationOptions}
      />
    </>
  )
})

export default AssetPreviewSelector
