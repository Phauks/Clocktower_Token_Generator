/**
 * Blood on the Clocktower Token Generator
 * Utility Functions
 */

/**
 * Debounce function to limit rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Load an image from URL with CORS handling
 * @param {string} url - Image URL
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
export async function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
}

/**
 * Load an image from local path
 * @param {string} path - Local file path
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
export async function loadLocalImage(path) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load local image: ${path}`));
        img.src = path;
    });
}

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color string
 * @returns {Object} RGB object with r, g, b properties
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Generate a unique filename suffix for duplicates
 * @param {Map} nameCount - Map tracking name occurrences
 * @param {string} baseName - Base filename
 * @returns {string} Filename with suffix if needed
 */
export function generateUniqueFilename(nameCount, baseName) {
    if (!nameCount.has(baseName)) {
        nameCount.set(baseName, 0);
    }
    const count = nameCount.get(baseName);
    nameCount.set(baseName, count + 1);
    
    if (count === 0) {
        return baseName;
    }
    return `${baseName}_${String(count).padStart(2, '0')}`;
}

/**
 * Sanitize filename by removing invalid characters
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .trim();
}

/**
 * Convert canvas to blob
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} type - MIME type
 * @param {number} quality - Quality (0-1)
 * @returns {Promise<Blob>} Image blob
 */
export async function canvasToBlob(canvas, type = 'image/png', quality = 1) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to convert canvas to blob'));
            }
        }, type, quality);
    });
}

/**
 * Download a file
 * @param {Blob|string} data - File data (Blob or data URL)
 * @param {string} filename - Download filename
 */
export function downloadFile(data, filename) {
    const link = document.createElement('a');
    if (data instanceof Blob) {
        link.href = URL.createObjectURL(data);
    } else {
        link.href = data;
    }
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (data instanceof Blob) {
        URL.revokeObjectURL(link.href);
    }
}

/**
 * Format JSON with pretty printing
 * @param {string} jsonString - JSON string to format
 * @returns {string} Formatted JSON string
 */
export function formatJson(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return jsonString;
    }
}

/**
 * Validate JSON string
 * @param {string} jsonString - JSON string to validate
 * @returns {Object} Validation result with valid boolean and error message
 */
export function validateJson(jsonString) {
    if (!jsonString.trim()) {
        return { valid: false, error: 'JSON is empty' };
    }
    try {
        const parsed = JSON.parse(jsonString);
        if (!Array.isArray(parsed)) {
            return { valid: false, error: 'JSON must be an array' };
        }
        return { valid: true, data: parsed };
    } catch (e) {
        return { valid: false, error: `Invalid JSON: ${e.message}` };
    }
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get contrast color (black or white) for given background
 * @param {string} hexColor - Background hex color
 * @returns {string} '#000000' or '#FFFFFF'
 */
export function getContrastColor(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#000000';
    
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Check if fonts are loaded
 * @param {string[]} fontNames - Array of font names to check
 * @returns {Promise<boolean>} Whether fonts are loaded
 */
export async function checkFontsLoaded(fontNames) {
    if (!document.fonts) {
        // Fallback for older browsers
        return new Promise(resolve => setTimeout(() => resolve(true), 500));
    }
    
    try {
        await document.fonts.ready;
        const checks = fontNames.map(name => document.fonts.check(`16px "${name}"`));
        return checks.every(loaded => loaded);
    } catch {
        return false;
    }
}

/**
 * Deep clone an object using JSON serialization.
 * Note: This method has limitations:
 * - Does not handle functions, undefined, symbols, or circular references
 * - Date objects are converted to strings
 * - RegExp objects are converted to empty objects
 * For simple configuration objects and data, this is sufficient.
 * @param {Object} obj - Object to clone (must be JSON-serializable)
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default {
    debounce,
    loadImage,
    loadLocalImage,
    hexToRgb,
    generateUniqueFilename,
    sanitizeFilename,
    canvasToBlob,
    downloadFile,
    formatJson,
    validateJson,
    sleep,
    getContrastColor,
    checkFontsLoaded,
    deepClone,
    capitalize
};
