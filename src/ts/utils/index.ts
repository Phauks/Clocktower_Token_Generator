/**
 * Blood on the Clocktower Token Generator
 * Utility Functions - Barrel Export
 * 
 * This module re-exports all utility functions for convenient importing.
 * Functions are organized into domain-specific modules:
 * - stringUtils: filename sanitization, capitalize, unique names
 * - imageUtils: image loading, canvas operations, file downloads
 * - jsonUtils: JSON formatting, validation, deep cloning
 * - colorUtils: hex to RGB conversion, contrast colors
 * - asyncUtils: debounce, sleep, array shuffling
 */

// String utilities
export {
    generateUniqueFilename,
    sanitizeFilename,
    capitalize
} from './stringUtils.js';

// Image utilities
export {
    loadImage,
    loadLocalImage,
    canvasToBlob,
    downloadFile,
    checkFontsLoaded,
    setCorsProxySetting,
    getCorsProxySetting
} from './imageUtils.js';

// JSON utilities
export {
    formatJson,
    validateJson,
    deepClone
} from './jsonUtils.js';

// Color utilities
export {
    hexToRgb,
    getContrastColor
} from './colorUtils.js';

// Async/timing utilities
export {
    shuffleArray,
    debounce,
    sleep
} from './asyncUtils.js';

// Progress tracking utilities
export {
    createProgressState,
    updateProgress,
    resetProgress,
    getProgressPercentage
} from './progressUtils.js';

// Global image cache
export { globalImageCache } from './imageCache.js';

// Re-export types
export type { DebouncedFunction } from './asyncUtils.js';
export type { ProgressCallback, ProgressState } from './progressUtils.js';
