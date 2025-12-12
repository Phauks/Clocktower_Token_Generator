/**
 * useAssetManager Hook
 *
 * React hook for managing assets with filtering, selection,
 * and bulk operations.
 *
 * @module hooks/useAssetManager
 *
 * @example
 * ```tsx
 * const {
 *   assets,
 *   isLoading,
 *   filter,
 *   setFilter,
 *   selectedIds,
 *   toggleSelect,
 *   deleteSelected,
 *   stats,
 * } = useAssetManager({
 *   currentProjectId: projectId,
 *   initialFilter: { type: 'character-icon' },
 * });
 * ```
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  assetStorageService,
  AssetFilter,
  AssetManagerOptions,
  AssetWithUrl,
  AssetType,
} from '../services/upload/index.js';

// ============================================================================
// Types
// ============================================================================

export interface AssetStats {
  count: number;
  totalSize: number;
  totalSizeMB: number;
  byType: Record<AssetType, { count: number; size: number }>;
}

export interface UseAssetManagerReturn {
  // State
  assets: AssetWithUrl[];
  isLoading: boolean;
  error: string | null;

  // Filter
  filter: AssetFilter;
  setFilter: (filter: Partial<AssetFilter>) => void;
  resetFilter: () => void;

  // Pagination
  totalCount: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  isLoadingMore: boolean;

  // Selection
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;

  // Stats
  stats: AssetStats | null;
  orphanedCount: number;

  // Actions
  deleteAsset: (id: string) => Promise<void>;
  deleteSelected: () => Promise<void>;
  promoteToGlobal: (id: string) => Promise<void>;
  promoteSelectedToGlobal: () => Promise<void>;
  moveToProject: (id: string, projectId: string) => Promise<void>;
  moveSelectedToProject: (projectId: string) => Promise<void>;
  cleanupOrphans: () => Promise<number>;
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

const DEFAULT_FILTER: AssetFilter = {
  sortBy: 'uploadedAt',
  sortDirection: 'desc',
};

/**
 * Hook for managing assets
 */
export function useAssetManager(options: AssetManagerOptions = {}): UseAssetManagerReturn {
  // State
  const [assets, setAssets] = useState<AssetWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilterState] = useState<AssetFilter>({
    ...DEFAULT_FILTER,
    ...options.initialFilter,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [orphanedCount, setOrphanedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Apply project context if set
      const effectiveFilter = { ...filter };
      if (options.currentProjectId && effectiveFilter.projectId === undefined) {
        effectiveFilter.projectId = options.currentProjectId;
      }

      const fetchedAssets = await assetStorageService.listWithUrls(effectiveFilter);
      setAssets(fetchedAssets);

      // Fetch total count (for pagination)
      const count = await assetStorageService.count(effectiveFilter);
      setTotalCount(count);

      // Fetch stats
      const fetchedStats = await assetStorageService.getStats(effectiveFilter);
      setStats(fetchedStats);

      // Fetch orphaned count
      const orphaned = await assetStorageService.getOrphaned();
      setOrphanedCount(orphaned.length);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [filter, options.currentProjectId]);

  // Load more assets (for infinite scroll)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !filter.limit) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const effectiveFilter = { ...filter };
      if (options.currentProjectId && effectiveFilter.projectId === undefined) {
        effectiveFilter.projectId = options.currentProjectId;
      }

      // Increment offset by current limit
      const nextOffset = (filter.offset ?? 0) + filter.limit;
      effectiveFilter.offset = nextOffset;

      const moreAssets = await assetStorageService.listWithUrls(effectiveFilter);
      setAssets((prev) => [...prev, ...moreAssets]);

      // Update filter offset for next load
      setFilterState((prev) => ({ ...prev, offset: nextOffset }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [filter, isLoadingMore, options.currentProjectId]);

  // Initial fetch
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Auto-refresh
  useEffect(() => {
    if (options.autoRefreshInterval && options.autoRefreshInterval > 0) {
      const interval = setInterval(fetchAssets, options.autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [options.autoRefreshInterval, fetchAssets]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      assetStorageService.revokeAllUrls();
    };
  }, []);

  // Filter methods
  const setFilter = useCallback((updates: Partial<AssetFilter>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
    setSelectedIds(new Set()); // Clear selection on filter change
  }, []);

  const resetFilter = useCallback(() => {
    setFilterState({ ...DEFAULT_FILTER, ...options.initialFilter });
    setSelectedIds(new Set());
  }, [options.initialFilter]);

  // Selection methods
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(assets.map((a) => a.id)));
  }, [assets]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  // Action methods
  const deleteAsset = useCallback(
    async (id: string) => {
      try {
        await assetStorageService.delete(id);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await fetchAssets();
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    [fetchAssets]
  );

  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;

    try {
      await assetStorageService.bulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      await fetchAssets();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [selectedIds, fetchAssets]);

  const promoteToGlobal = useCallback(
    async (id: string) => {
      try {
        await assetStorageService.promoteToGlobal(id);
        await fetchAssets();
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    [fetchAssets]
  );

  const moveToProject = useCallback(
    async (id: string, projectId: string) => {
      try {
        await assetStorageService.moveToProject(id, projectId);
        await fetchAssets();
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    [fetchAssets]
  );

  const promoteSelectedToGlobal = useCallback(async () => {
    if (selectedIds.size === 0) return;

    try {
      await assetStorageService.bulkPromoteToGlobal(Array.from(selectedIds));
      setSelectedIds(new Set());
      await fetchAssets();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [selectedIds, fetchAssets]);

  const moveSelectedToProject = useCallback(
    async (projectId: string) => {
      if (selectedIds.size === 0) return;

      try {
        await assetStorageService.bulkMoveToProject(Array.from(selectedIds), projectId);
        setSelectedIds(new Set());
        await fetchAssets();
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    [selectedIds, fetchAssets]
  );

  const cleanupOrphans = useCallback(async () => {
    try {
      const count = await assetStorageService.cleanupOrphans();
      await fetchAssets();
      return count;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [fetchAssets]);

  const refresh = useCallback(async () => {
    await fetchAssets();
  }, [fetchAssets]);

  // Compute hasMore for pagination
  const hasMore = useMemo(() => {
    const currentCount = assets.length;
    return currentCount < totalCount;
  }, [assets.length, totalCount]);

  return {
    // State
    assets,
    isLoading,
    error,

    // Filter
    filter,
    setFilter,
    resetFilter,

    // Pagination
    totalCount,
    hasMore,
    loadMore,
    isLoadingMore,

    // Selection
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,

    // Stats
    stats,
    orphanedCount,

    // Actions
    deleteAsset,
    deleteSelected,
    promoteToGlobal,
    promoteSelectedToGlobal,
    moveToProject,
    moveSelectedToProject,
    cleanupOrphans,
    refresh,
  };
}

export default useAssetManager;
