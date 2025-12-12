/**
 * Studio Module
 *
 * Barrel export for all Studio-related utilities
 */

// Canvas operations
export * from './canvasOperations.js';
export { createStudioCanvas, releaseStudioCanvas, getCanvasPoolStats } from './canvasOperations.js';

// Filter engine
export * from './filterEngine.js';

// Layer manager
export * from './layerManager.js';

// Drawing engine
export * from './drawingEngine.js';

// Background removal
export * from './backgroundRemoval.js';

// Character presets
export * from './characterPresets.js';

// Studio presets
export * from './studioPresets.js';

// Canvas overlay (grid, guides, rulers)
export * from './canvasOverlay.js';

// Asset integration (connects Studio to global asset storage)
export * from './assetIntegration.js';

// Navigation helpers (cross-tab navigation to Studio)
export * from './navigationHelpers.js';

// History manager (undo/redo system)
export * from './historyManager.js';

// Memory manager (memory monitoring and cleanup)
export * from './memoryManager.js';

// Logo templates (script logo generation)
export * from './logoTemplates.js';
