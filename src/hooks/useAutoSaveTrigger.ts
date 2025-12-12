/**
 * Auto-Save Trigger Hook
 *
 * Watches isDirty flag and triggers debounced saves.
 * Does NOT detect changes - that's useAutoSaveDetector's job.
 *
 * @module hooks/useAutoSaveTrigger
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useProjectContext } from '../contexts/ProjectContext.js';
import { useTokenContext } from '../contexts/TokenContext.js';
import { projectDatabaseService } from '../ts/services/project/index.js';
import { debounce, logger } from '../ts/utils/index.js';
import { retryOperation } from '../ts/utils/errorUtils.js';
import { generateUuid } from '../ts/utils/nameGenerator.js';
import { useTabSynchronization } from './useTabSynchronization.js';
import type { Project, AutoSaveSnapshot, ProjectState } from '../ts/types/project.js';
import type { DebouncedFunction } from '../ts/utils/asyncUtils.js';

const AUTO_SAVE_DEBOUNCE_MS = 2000;
const MAX_SNAPSHOTS = 10; // Keep last 10 snapshots
const TELEMETRY_STORAGE_KEY = 'botc-autosave-telemetry';

// ============================================================================
// Telemetry Interface
// ============================================================================

/**
 * Auto-save telemetry metrics (privacy-friendly, stored locally)
 */
interface AutoSaveTelemetry {
  totalSaves: number;           // Successful saves
  totalErrors: number;          // Failed saves
  totalAttempts: number;        // Total attempts (saves + errors)
  totalDurationMs: number;      // Sum of all save durations
  lastSaveDurationMs: number;   // Duration of most recent save
  firstSaveAt: number;          // Timestamp of first save (session start)
  lastUpdatedAt: number;        // Last metrics update
}

// ============================================================================
// Telemetry Helper Functions
// ============================================================================

/**
 * Load telemetry from localStorage
 */
function loadTelemetry(): AutoSaveTelemetry {
  try {
    const stored = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    logger.warn('AutoSaveTrigger', 'Failed to load telemetry from localStorage', { error });
  }

  // Return default telemetry
  return {
    totalSaves: 0,
    totalErrors: 0,
    totalAttempts: 0,
    totalDurationMs: 0,
    lastSaveDurationMs: 0,
    firstSaveAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };
}

/**
 * Save telemetry to localStorage
 */
function saveTelemetry(telemetry: AutoSaveTelemetry): void {
  try {
    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(telemetry));
  } catch (error) {
    logger.warn('AutoSaveTrigger', 'Failed to save telemetry to localStorage', { error });
  }
}

/**
 * Update telemetry after a save attempt
 */
function updateTelemetry(
  telemetry: AutoSaveTelemetry,
  success: boolean,
  durationMs: number
): AutoSaveTelemetry {
  const updated: AutoSaveTelemetry = {
    ...telemetry,
    totalAttempts: telemetry.totalAttempts + 1,
    lastSaveDurationMs: durationMs,
    lastUpdatedAt: Date.now(),
  };

  if (success) {
    updated.totalSaves = telemetry.totalSaves + 1;
    updated.totalDurationMs = telemetry.totalDurationMs + durationMs;
  } else {
    updated.totalErrors = telemetry.totalErrors + 1;
  }

  return updated;
}

/**
 * Get computed telemetry stats
 */
function getTelemetryStats(telemetry: AutoSaveTelemetry) {
  const successRate = telemetry.totalAttempts > 0
    ? (telemetry.totalSaves / telemetry.totalAttempts) * 100
    : 0;

  const avgSaveDurationMs = telemetry.totalSaves > 0
    ? telemetry.totalDurationMs / telemetry.totalSaves
    : 0;

  return {
    ...telemetry,
    successRate,
    avgSaveDurationMs,
  };
}

/**
 * Watches isDirty flag and triggers debounced saves
 *
 * This hook watches the isDirty flag in ProjectContext and triggers a debounced
 * save operation when it becomes true. The save operation updates IndexedDB and
 * clears the dirty flag.
 *
 * Key design decisions:
 * - Only watches isDirty flag - doesn't compare state
 * - Separate effect for debounce creation (updates when saveProject changes)
 * - Separate effect for triggering saves (minimal deps: enabled, projectId, isDirty)
 * - Prevents multiple concurrent saves with pendingSaveRef
 * - Returns saveNow for manual saves
 */
export function useAutoSaveTrigger(enabled: boolean = true) {
  const {
    currentProject,
    isDirty,
    changeVersion,
    setIsDirty,
    setAutoSaveStatus,
    setLastSavedAt,
    setCurrentProject,
  } = useProjectContext();

  const {
    characters,
    scriptMeta,
    generationOptions,
    jsonInput,
    filters,
    characterMetadata,
  } = useTokenContext();

  // Track if we have a pending save
  const pendingSaveRef = useRef(false);

  // Telemetry tracking (privacy-friendly, stored locally)
  const telemetryRef = useRef<AutoSaveTelemetry>(loadTelemetry());

  // Tab synchronization
  const {
    tabId,
    hasConflict,
    conflictingTabCount,
    notifySaved,
  } = useTabSynchronization(currentProject?.id || null, enabled);

  // Conflict warning state
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  // Use a ref to keep saveProject stable (doesn't recreate on state changes)
  const saveProjectRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // Define save function (captures latest values from closure)
  saveProjectRef.current = async () => {
    if (!currentProject) {
      logger.warn('AutoSaveTrigger', 'Save called but no current project');
      return;
    }

    pendingSaveRef.current = true;

    // Start telemetry timing
    const startTime = performance.now();

    try {
      setAutoSaveStatus({ state: 'saving', isDirty: true });
      logger.info('AutoSaveTrigger', 'Starting save...', {
        projectId: currentProject.id,
        projectName: currentProject.name,
        characterCount: characters.length,
      });

      // Capture current state
      const currentState: ProjectState = {
        jsonInput,
        characters,
        scriptMeta,
        characterMetadata: Object.fromEntries(characterMetadata),
        generationOptions: { ...generationOptions },
        customIcons: currentProject.state.customIcons || [], // Preserve custom icons
        filters,
        schemaVersion: 1,
      };

      // Calculate stats
      const stats = {
        characterCount: characters.length,
        tokenCount: 0, // Will be updated when tokens are generated
        reminderCount: characters.reduce(
          (sum, char) => sum + (char.reminders?.length || 0),
          0
        ),
        customIconCount: currentState.customIcons.length,
        presetCount: 0,
        lastGeneratedAt: currentProject.stats.lastGeneratedAt,
      };

      // Create updated project
      const updatedProject: Project = {
        ...currentProject,
        state: currentState,
        stats,
        lastModifiedAt: Date.now(),
        lastAccessedAt: Date.now(),
      };

      // Save to database with retry logic (3 attempts with exponential backoff)
      logger.debug('AutoSaveTrigger', 'Saving project to IndexedDB', {
        projectId: currentProject.id,
      });
      await retryOperation(
        () => projectDatabaseService.saveProject(updatedProject),
        'AutoSaveTrigger',
        {
          maxAttempts: 3,
          delayMs: 1000,
          shouldRetry: (error) => {
            // Don't retry quota exceeded errors - they won't succeed on retry
            if (error instanceof Error && error.name === 'QuotaExceededError') {
              return false;
            }
            return true; // Retry all other errors
          }
        }
      );

      // Save snapshot for undo/recovery
      const snapshot: AutoSaveSnapshot = {
        id: generateUuid(),
        projectId: currentProject.id,
        timestamp: Date.now(),
        stateSnapshot: currentState,
      };
      await projectDatabaseService.saveSnapshot(snapshot);

      // Clean up old snapshots
      await projectDatabaseService.deleteOldSnapshots(currentProject.id, MAX_SNAPSHOTS);

      // Update context
      setCurrentProject(updatedProject);
      const now = Date.now();
      setLastSavedAt(now);

      // Clear dirty flag
      setIsDirty(false);

      setAutoSaveStatus({
        state: 'saved',
        isDirty: false,
      });

      // Calculate save duration and update telemetry
      const duration = performance.now() - startTime;
      telemetryRef.current = updateTelemetry(telemetryRef.current, true, duration);
      saveTelemetry(telemetryRef.current);

      logger.info('AutoSaveTrigger', 'Save completed successfully', {
        projectId: currentProject.id,
        projectName: currentProject.name,
        timestamp: now,
        durationMs: Math.round(duration),
        telemetry: getTelemetryStats(telemetryRef.current),
      });

      // Notify other tabs that we saved
      notifySaved();
    } catch (error) {
      // Calculate save duration and update telemetry (failed save)
      const duration = performance.now() - startTime;
      telemetryRef.current = updateTelemetry(telemetryRef.current, false, duration);
      saveTelemetry(telemetryRef.current);

      logger.error('AutoSaveTrigger', 'Save failed', error, {
        projectId: currentProject?.id,
        errorType: error instanceof Error ? error.name : 'Unknown',
        durationMs: Math.round(duration),
        telemetry: getTelemetryStats(telemetryRef.current),
      });

      let errorMessage = 'Failed to save project';
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        errorMessage = 'Storage full. Delete old projects to free space.';
        logger.warn('AutoSaveTrigger', 'IndexedDB quota exceeded', { error });
      }

      setAutoSaveStatus({
        state: 'error',
        isDirty: true,
        error: errorMessage,
      });
    } finally {
      pendingSaveRef.current = false;
    }
  };

  // Stable wrapper function that never recreates
  const saveProject = useCallback(async () => {
    await saveProjectRef.current?.();
  }, []); // Empty deps - never recreates!

  // Show conflict warning when first detected (once per project load)
  useEffect(() => {
    if (hasConflict && !hasShownWarning && currentProject) {
      logger.warn('AutoSaveTrigger', 'Showing tab conflict warning', {
        projectId: currentProject.id,
        conflictingTabs: conflictingTabCount,
      });
      setShowConflictWarning(true);
      setHasShownWarning(true);
    }
  }, [hasConflict, hasShownWarning, currentProject, conflictingTabCount]);

  // Reset warning flag when project changes
  useEffect(() => {
    setHasShownWarning(false);
    setShowConflictWarning(false);
  }, [currentProject?.id]);

  // Create debounced save - only created once!
  const debouncedSaveRef = useRef<DebouncedFunction<() => Promise<void>> | null>(null);

  useEffect(() => {
    // Create debounced function ONCE (saveProject never changes)
    debouncedSaveRef.current = debounce(saveProject, AUTO_SAVE_DEBOUNCE_MS);
    logger.debug('AutoSaveTrigger', 'Debounced save function created (one-time)');

    return () => {
      // Cleanup on unmount - cancel pending saves
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.cancel();
      }
    };
  }, [saveProject]);

  // Watch isDirty and changeVersion to trigger save
  useEffect(() => {
    logger.debug('AutoSaveTrigger', 'Effect triggered', {
      enabled,
      hasProject: !!currentProject,
      projectId: currentProject?.id,
      isDirty,
      changeVersion,
      hasPendingSave: pendingSaveRef.current,
      hasDebouncedSave: !!debouncedSaveRef.current,
    });

    if (!enabled) {
      logger.debug('AutoSaveTrigger', 'Auto-save disabled by user');
      return;
    }

    if (!currentProject) {
      logger.debug('AutoSaveTrigger', 'No project - skipping save trigger');
      return;
    }

    if (!isDirty) {
      logger.debug('AutoSaveTrigger', 'Not dirty - nothing to save');
      return;
    }

    if (pendingSaveRef.current) {
      logger.debug('AutoSaveTrigger', 'Save already pending - skipping');
      return;
    }

    // Trigger debounced save
    logger.debug('AutoSaveTrigger', 'Dirty flag set - scheduling debounced save (2s delay)', {
      projectId: currentProject.id,
      changeVersion,
    });

    if (debouncedSaveRef.current) {
      debouncedSaveRef.current();
    } else {
      logger.error('AutoSaveTrigger', 'ERROR: Debounced save function is null!');
    }
  }, [enabled, currentProject?.id, isDirty, changeVersion]); // changeVersion ensures effect runs on every change!

  // Return saveNow for manual saves (e.g., from AutoSaveIndicator)
  const saveNow = useCallback(async () => {
    if (!currentProject) {
      logger.warn('AutoSaveTrigger', 'saveNow called but no project');
      return;
    }

    logger.info('AutoSaveTrigger', 'Manual save triggered');
    await saveProject();
  }, [currentProject, saveProject]);

  const handleConflictContinue = useCallback(() => {
    logger.info('AutoSaveTrigger', 'User chose to continue despite conflict');
    setShowConflictWarning(false);
  }, []);

  const handleConflictClose = useCallback(() => {
    logger.info('AutoSaveTrigger', 'User acknowledged conflict warning');
    setShowConflictWarning(false);
  }, []);

  return {
    saveNow,
    // Conflict modal state (parent component should render the modal)
    conflictModalProps: {
      isOpen: showConflictWarning,
      conflictingTabCount,
      onContinue: handleConflictContinue,
      onClose: handleConflictClose,
    },
    // Telemetry stats (for debugging/analytics)
    telemetry: getTelemetryStats(telemetryRef.current),
  };
}
