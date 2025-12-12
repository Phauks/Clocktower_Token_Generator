/**
 * Hooks Barrel Export
 *
 * Central export point for all custom React hooks.
 * Organized by category for easy discovery.
 */

// ============================================================================
// Project Management Hooks
// ============================================================================
export { useProjects } from './useProjects.js';
export { useProjectAutoSave } from './useProjectAutoSave.js';
export { useProjectCacheWarming } from './useProjectCacheWarming.js';

// ============================================================================
// Token Management Hooks
// ============================================================================
export { useTokenGenerator } from './useTokenGenerator.js';
export { useTokenDetailEditor } from './useTokenDetailEditor.js';
export { useTokenDeletion } from './useTokenDeletion.js';
export { useTokenGrouping } from './useTokenGrouping.js';
export { useCharacterImageResolver } from './useCharacterImageResolver.js';

// ============================================================================
// Script & Data Hooks
// ============================================================================
export { useScriptData } from './useScriptData.js';
export { useFilters } from './useFilters.js';
export { usePresets } from './usePresets.js';

// ============================================================================
// Export & File Management Hooks
// ============================================================================
export { useExport } from './useExport.js';
export { useFileUpload } from './useFileUpload.js';
export { useAssetManager } from './useAssetManager.js';

// ============================================================================
// Studio & Navigation Hooks
// ============================================================================
export { useStudioNavigation } from './useStudioNavigation.js';

// ============================================================================
// Cache Management Hooks
// ============================================================================
export { usePreRenderCache } from './usePreRenderCache.js';
export { useCacheManager } from './useCacheManager.js';
export { useCacheStats } from './useCacheStats.js';

// ============================================================================
// UI & Interaction Hooks
// ============================================================================
export { useContextMenu } from './useContextMenu.js';
export { useModalBehavior } from './useModalBehavior.js';
export { useUndoStack } from './useUndoStack.js';
export { useIntersectionObserver } from './useIntersectionObserver.js';
export { useAutoResizeTextarea } from './useAutoResizeTextarea.js';

// ============================================================================
// Utility Hooks
// ============================================================================
export { useStorageQuota } from './useStorageQuota.js';
