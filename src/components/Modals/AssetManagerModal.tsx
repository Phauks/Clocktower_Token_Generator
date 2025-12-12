/**
 * Asset Manager Modal Component
 *
 * Full-featured modal for managing uploaded assets with filtering,
 * bulk operations, and asset organization.
 * Migrated to use unified Modal, Button, and ConfirmDialog components.
 *
 * @module components/Modals/AssetManagerModal
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Modal } from '../Shared/Modal/Modal';
import { Button } from '../Shared/Button';
import { ConfirmDialog } from '../Shared/Modal/ConfirmDialog';
import { useAssetManager } from '../../hooks/useAssetManager.js';
import { useFileUpload } from '../../hooks/useFileUpload.js';
import { useTokenContext } from '../../contexts/TokenContext.js';
import { FileDropzone } from '../Shared/FileDropzone.js';
import { AssetThumbnail } from '../Shared/AssetThumbnail.js';
import { TokenGenerator } from '../../ts/generation/tokenGenerator.js';
import type { GenerationOptions } from '../../ts/types/index.js';
import {
  AssetType,
  ASSET_TYPE_LABELS,
  ASSET_TYPE_LABELS_PLURAL,
  ASSET_TYPE_ICONS,
  assetStorageService,
  fileUploadService,
} from '../../services/upload/index.js';
import { getBuiltInAssets, type BuiltInAsset } from '../../ts/constants/builtInAssets.js';
import { createAssetReference } from '../../services/upload/assetResolver.js';
import styles from '../../styles/components/modals/AssetManagerModal.module.css';

// ============================================================================
// Types
// ============================================================================

interface AssetManagerModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Current project ID */
  projectId?: string;
  /** Initial filter by asset type */
  initialAssetType?: AssetType;
  /** Callback when an asset is selected for use */
  onSelectAsset?: (assetId: string) => void;
  /** Selection mode (for picking an asset) */
  selectionMode?: boolean;
  /** Include built-in assets in selection mode */
  includeBuiltIn?: boolean;
  /** Show a "None" option in selection mode */
  showNoneOption?: boolean;
  /** Label for the None option */
  noneLabel?: string;
  /** Generation options for live preview (enables preview panel in selection mode) */
  generationOptions?: GenerationOptions;
}

type ScopeFilter = 'project' | 'global' | 'all';
type ViewMode = 'grid' | 'list';

const ASSET_TYPES: AssetType[] = [
  'character-icon',
  'token-background',
  'script-background',
  'setup-flower',
  'leaf',
  'logo',
];

// ============================================================================
// Component
// ============================================================================

export function AssetManagerModal({
  isOpen,
  onClose,
  projectId,
  initialAssetType,
  onSelectAsset,
  selectionMode = false,
  includeBuiltIn = false,
  showNoneOption = false,
  noneLabel = 'None',
  generationOptions,
}: AssetManagerModalProps) {
  // Local state
  const [activeTab, setActiveTab] = useState<AssetType | 'all'>(initialAssetType ?? 'all');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>(projectId ? 'project' : 'all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState<AssetType>('character-icon');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null); // For selection mode

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const generationIdRef = useRef(0);

  // Get character data from context for preview
  const { characters, scriptMeta } = useTokenContext();

  // Use asset manager hook
  const {
    assets,
    isLoading,
    error,
    filter,
    setFilter,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
    stats,
    orphanedCount,
    deleteAsset,
    deleteSelected,
    promoteToGlobal,
    cleanupOrphans,
    refresh,
  } = useAssetManager({
    currentProjectId: projectId ?? undefined,
    initialFilter: {
      type: initialAssetType,
      projectId: scopeFilter === 'all' ? 'all' : scopeFilter === 'global' ? null : projectId,
      search: searchQuery,
    },
  });

  // Update filter when local state changes
  const handleTabChange = useCallback(
    (tab: AssetType | 'all') => {
      setActiveTab(tab);
      setFilter({
        type: tab === 'all' ? undefined : tab,
      });
    },
    [setFilter]
  );

  const handleScopeChange = useCallback(
    (scope: ScopeFilter) => {
      setScopeFilter(scope);
      setFilter({
        projectId: scope === 'all' ? 'all' : scope === 'global' ? null : projectId,
      });
    },
    [setFilter, projectId]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setFilter({ search: query || undefined });
    },
    [setFilter]
  );

  // Handle asset selection (for selection mode - just select, don't apply)
  const handleAssetClick = useCallback(
    (id: string) => {
      if (selectionMode) {
        // Toggle selection in selection mode
        setSelectedAssetId(prev => prev === id ? null : id);
      } else {
        toggleSelect(id);
      }
    },
    [selectionMode, toggleSelect]
  );

  // Handle apply button click (selection mode)
  const handleApply = useCallback(() => {
    if (onSelectAsset) {
      if (selectedAssetId === 'none') {
        // "None" was selected
        onSelectAsset('none');
      } else if (selectedAssetId?.startsWith('builtin:')) {
        // Built-in asset - return just the ID without prefix
        onSelectAsset(selectedAssetId.replace('builtin:', ''));
      } else if (selectedAssetId) {
        // User asset - return as asset reference
        onSelectAsset(createAssetReference(selectedAssetId));
      }
      onClose();
    }
  }, [selectedAssetId, onSelectAsset, onClose]);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((id: string) => {
    setConfirmDelete(id);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (confirmDelete) {
      await deleteAsset(confirmDelete);
      setConfirmDelete(null);
    }
  }, [confirmDelete, deleteAsset]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete(null);
  }, []);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size > 0) {
      await deleteSelected();
    }
  }, [selectedIds, deleteSelected]);

  // Handle upload complete
  const handleUploadComplete = useCallback(
    (assetIds: string[]) => {
      setShowUpload(false);
      refresh();
    },
    [refresh]
  );

  // Handle cleanup orphans
  const handleCleanupOrphans = useCallback(async () => {
    const count = await cleanupOrphans();
    // Could show a toast here
  }, [cleanupOrphans]);

  // Handle rename
  const handleRename = useCallback(async (id: string) => {
    const asset = assets.find(a => a.id === id);
    if (!asset) return;
    
    const newName = window.prompt('Enter new name:', asset.metadata.filename);
    if (newName && newName.trim() && newName !== asset.metadata.filename) {
      await assetStorageService.update(id, {
        metadata: { ...asset.metadata, filename: newName.trim() }
      });
      refresh();
    }
  }, [assets, refresh]);

  // Handle download
  const handleDownload = useCallback(async (id: string) => {
    const asset = await assetStorageService.getById(id);
    if (!asset) return;
    
    const url = URL.createObjectURL(asset.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset.metadata.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Handle duplicate
  const handleDuplicate = useCallback(async (id: string) => {
    const asset = await assetStorageService.getById(id);
    if (!asset) return;
    
    // Create a copy with a new name
    const nameParts = asset.metadata.filename.split('.');
    const ext = nameParts.length > 1 ? `.${nameParts.pop()}` : '';
    const baseName = nameParts.join('.');
    const newName = `${baseName} (copy)${ext}`;
    
    await assetStorageService.save({
      type: asset.type,
      projectId: asset.projectId,
      blob: asset.blob,
      thumbnail: asset.thumbnail,
      metadata: { ...asset.metadata, filename: newName, uploadedAt: Date.now() },
      linkedTo: [],
    });
    refresh();
  }, [refresh]);

  // Handle reclassify (change asset type) - directly from submenu
  const handleReclassify = useCallback(async (id: string, newType: AssetType) => {
    const asset = await assetStorageService.getById(id);
    if (!asset || asset.type === newType) return;
    
    await assetStorageService.update(id, { type: newType });
    refresh();
  }, [refresh]);

  // Get built-in assets for the current filter type
  const builtInAssets = useMemo(() => {
    if (!selectionMode || !includeBuiltIn) return [];
    const filterType = activeTab === 'all' ? initialAssetType : activeTab;
    if (!filterType) return [];
    return getBuiltInAssets(filterType);
  }, [selectionMode, includeBuiltIn, activeTab, initialAssetType]);

  // Memoized filtered assets (for display) - including built-in when applicable
  const displayAssets = useMemo(() => {
    return assets;
  }, [assets]);

  // Get the first character with a setup flower (for preview)
  const sampleCharacter = useMemo(() => {
    return characters.find(c => c.setup) || characters[0];
  }, [characters]);

  // Map asset type to generation option property
  const getPreviewOptions = useCallback((assetValue: string | null): Partial<GenerationOptions> => {
    if (!assetValue || assetValue === 'none') return {};

    const assetType = initialAssetType || activeTab;
    switch (assetType) {
      case 'setup-flower':
        return { setupFlowerStyle: assetValue };
      case 'leaf':
        return { leafGeneration: assetValue };
      case 'token-background':
        return { characterBackground: assetValue };
      default:
        return {};
    }
  }, [initialAssetType, activeTab]);

  // Generate preview when selection changes
  useEffect(() => {
    // Only generate preview in selection mode with generation options and a sample character
    if (!selectionMode || !generationOptions || !sampleCharacter || !selectedAssetId) {
      setPreviewUrl(null);
      return;
    }

    const genId = ++generationIdRef.current;

    const generatePreview = async () => {
      setIsGeneratingPreview(true);

      try {
        // Get the asset value for preview options
        let assetValue: string | null = null;
        if (selectedAssetId === 'none') {
          assetValue = 'none';
        } else if (selectedAssetId.startsWith('builtin:')) {
          assetValue = selectedAssetId.replace('builtin:', '');
        } else {
          assetValue = createAssetReference(selectedAssetId);
        }

        // Merge preview options with generation options
        const previewOptions = {
          ...generationOptions,
          ...getPreviewOptions(assetValue),
          logoUrl: scriptMeta?.logo
        };

        const generator = new TokenGenerator(previewOptions);
        const canvas = await generator.generateCharacterToken(sampleCharacter);

        // Only update if this is still the current generation
        if (genId === generationIdRef.current && canvas) {
          setPreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        if (genId === generationIdRef.current) {
          console.error('Preview generation error:', err);
          setPreviewUrl(null);
        }
      } finally {
        if (genId === generationIdRef.current) {
          setIsGeneratingPreview(false);
        }
      }
    };

    // Debounce preview generation
    const timeout = setTimeout(generatePreview, 150);
    return () => clearTimeout(timeout);
  }, [selectedAssetId, selectionMode, generationOptions, sampleCharacter, scriptMeta, getPreviewOptions]);

  // Determine if we should show the preview panel
  const showPreviewPanel = selectionMode && generationOptions && characters.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectionMode ? 'Select Asset' : 'Asset Manager'}
      size="xlarge"
      footer={
        <>
          <div className={styles.footerLeft}>
            {selectedIds.size > 0 && !selectionMode && (
              <>
                <Button variant="ghost" size="small" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="small" onClick={clearSelection}>
                  Clear Selection
                </Button>
                <Button variant="danger" size="small" onClick={handleBulkDelete}>
                  Delete Selected ({selectedIds.size})
                </Button>
              </>
            )}
            {orphanedCount > 0 && !selectionMode && (
              <Button variant="ghost" size="small" onClick={handleCleanupOrphans}>
                Clean Up Orphans ({orphanedCount})
              </Button>
            )}
          </div>
          <div className={styles.footerRight}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {selectionMode && (
              <Button
                variant="accent"
                onClick={handleApply}
                disabled={!selectedAssetId}
              >
                Apply
              </Button>
            )}
          </div>
        </>
      }
    >

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('all')}
          >
            All
          </button>
          {ASSET_TYPES.map((type) => (
            <button
              key={type}
              className={`${styles.tab} ${activeTab === type ? styles.activeTab : ''}`}
              onClick={() => handleTabChange(type)}
            >
              <span className={styles.tabIcon}>{ASSET_TYPE_ICONS[type]}</span>
              <span className={styles.tabLabel}>{ASSET_TYPE_LABELS_PLURAL[type]}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.controlsLeft}>
            <select
              value={scopeFilter}
              onChange={(e) => handleScopeChange(e.target.value as ScopeFilter)}
              className={styles.scopeSelect}
            >
              {projectId && <option value="project">This Project</option>}
              <option value="global">Global Library</option>
              <option value="all">All Assets</option>
            </select>

            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.controlsRight}>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.activeView : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                ▦
              </button>
              <button
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.activeView : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                ☰
              </button>
            </div>

            <Button
              variant={showUpload ? 'secondary' : 'accent'}
              size="small"
              onClick={() => setShowUpload(!showUpload)}
            >
              {showUpload ? 'Cancel' : '+ Upload'}
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <span className={styles.statText}>
            📊 {stats?.count ?? 0} assets | {stats?.totalSizeMB.toFixed(1) ?? 0} MB
          </span>
          {selectedIds.size > 0 && (
            <span className={styles.selectionInfo}>
              {selectedIds.size} selected
            </span>
          )}
          {orphanedCount > 0 && (
            <span className={styles.orphanWarning}>
              ⚠️ {orphanedCount} orphaned
            </span>
          )}
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className={styles.uploadSection}>
            <div className={styles.uploadTypeSelect}>
              <label>Upload as:</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as AssetType)}
                className={styles.typeSelect}
              >
                {ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ASSET_TYPE_ICONS[type]} {ASSET_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <FileDropzone
              assetType={uploadType}
              projectId={scopeFilter === 'global' ? null : projectId}
              multiple={true}
              onUploadComplete={handleUploadComplete}
              compact={true}
            />
          </div>
        )}

        {/* Content with optional Preview */}
        <div className={showPreviewPanel ? styles.contentWithPreview : ''}>
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Loading assets...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p>Error: {error}</p>
              <button onClick={refresh} className={styles.retryButton}>
                Retry
              </button>
            </div>
          ) : displayAssets.length === 0 && builtInAssets.length === 0 && !showNoneOption ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>📁</p>
              <p className={styles.emptyText}>
                {searchQuery
                  ? `No assets found matching "${searchQuery}"`
                  : 'No assets yet. Upload some files to get started!'}
              </p>
              {!showUpload && (
                <button
                  onClick={() => setShowUpload(true)}
                  className={styles.uploadPrompt}
                >
                  Upload Assets
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className={styles.assetGrid}>
              {/* None Option (in selection mode) */}
              {selectionMode && showNoneOption && (
                <button
                  className={`${styles.builtInThumbnail} ${selectedAssetId === 'none' ? styles.selectedBuiltIn : ''}`}
                  onClick={() => setSelectedAssetId(prev => prev === 'none' ? null : 'none')}
                >
                  <span className={styles.noneIcon}>∅</span>
                  <span className={styles.builtInLabel}>{noneLabel}</span>
                </button>
              )}

              {/* Built-in Assets (in selection mode) */}
              {selectionMode && builtInAssets.map((asset) => (
                <button
                  key={`builtin:${asset.id}`}
                  className={`${styles.builtInThumbnail} ${selectedAssetId === `builtin:${asset.id}` ? styles.selectedBuiltIn : ''}`}
                  onClick={() => setSelectedAssetId(prev => prev === `builtin:${asset.id}` ? null : `builtin:${asset.id}`)}
                >
                  <img src={asset.src} alt={asset.label} className={styles.builtInImage} />
                  <span className={styles.builtInLabel}>{asset.label}</span>
                  <span className={styles.builtInBadge}>●</span>
                </button>
              ))}

              {/* Separator between built-in and user assets */}
              {selectionMode && (builtInAssets.length > 0 || showNoneOption) && displayAssets.length > 0 && (
                <div className={styles.assetSeparator}>
                  <span>My Uploads</span>
                </div>
              )}

              {/* User Assets */}
              {displayAssets.map((asset) => (
                <AssetThumbnail
                  key={asset.id}
                  asset={asset}
                  isSelected={selectionMode ? selectedAssetId === asset.id : isSelected(asset.id)}
                  onSelect={handleAssetClick}
                  onDelete={handleDeleteClick}
                  onRename={handleRename}
                  onDownload={handleDownload}
                  onDuplicate={handleDuplicate}
                  onReclassify={handleReclassify}
                  onPromoteToGlobal={asset.projectId ? promoteToGlobal : undefined}
                  showSelect={!selectionMode}
                  size="medium"
                />
              ))}
            </div>
          ) : (
            <div className={styles.assetList}>
              {displayAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={`${styles.listItem} ${(selectionMode ? selectedAssetId === asset.id : isSelected(asset.id)) ? styles.selectedItem : ''}`}
                  onClick={() => handleAssetClick(asset.id)}
                >
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.metadata.filename}
                    className={styles.listThumbnail}
                  />
                  <div className={styles.listInfo}>
                    <span className={styles.listFilename}>{asset.metadata.filename}</span>
                    <span className={styles.listMeta}>
                      {ASSET_TYPE_ICONS[asset.type]} {ASSET_TYPE_LABELS[asset.type]} •{' '}
                      {(asset.metadata.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <span className={asset.projectId ? styles.projectBadge : styles.globalBadge}>
                    {asset.projectId ? '📁' : '🌐'}
                  </span>
                  {!selectionMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(asset.id);
                      }}
                      className={styles.listDeleteButton}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Preview Panel */}
        {showPreviewPanel && (
          <div className={styles.previewPanel}>
            <div className={styles.previewHeader}>Live Preview</div>
            <div className={styles.previewContainer}>
              {isGeneratingPreview && (
                <div className={styles.previewSpinner}>
                  <div className={styles.spinner} />
                </div>
              )}
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Token preview"
                  className={styles.previewImage}
                />
              ) : (
                <div className={styles.previewPlaceholder}>
                  <span className={styles.previewPlaceholderIcon}>🎴</span>
                  <span className={styles.previewPlaceholderText}>
                    {selectedAssetId ? 'Generating...' : 'Select an asset'}
                  </span>
                </div>
              )}
            </div>
            {sampleCharacter && (
              <div className={styles.previewLabel}>
                <span className={styles.previewCharacterName}>{sampleCharacter.name}</span>
                <span className={styles.previewTeam}>{sampleCharacter.team}</span>
              </div>
            )}
          </div>
        )}
        </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Asset?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </Modal>
  );
}

export default AssetManagerModal;
