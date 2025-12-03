/**
 * Blood on the Clocktower Token Generator
 * JSON Utility Functions
 */

import type { ValidationResult, ScriptEntry } from '../types/index.js';

/**
 * Format JSON with pretty printing
 * @param jsonString - JSON string to format
 * @returns Formatted JSON string
 */
export function formatJson(jsonString: string): string {
    try {
        const parsed = JSON.parse(jsonString) as unknown;
        return JSON.stringify(parsed, null, 2);
    } catch {
        return jsonString;
    }
}

/**
 * Validate JSON string
 * @param jsonString - JSON string to validate
 * @returns Validation result with valid boolean and error message
 */
export function validateJson(jsonString: string): ValidationResult {
    if (!jsonString.trim()) {
        return { valid: false, error: 'JSON is empty' };
    }
    try {
        const parsed = JSON.parse(jsonString) as unknown;
        if (!Array.isArray(parsed)) {
            return { valid: false, error: 'JSON must be an array' };
        }
        return { valid: true, data: parsed as ScriptEntry[] };
    } catch (e) {
        const error = e instanceof Error ? e.message : 'Unknown error';
        return { valid: false, error: `Invalid JSON: ${error}` };
    }
}

/**
 * Deep clone an object using JSON serialization.
 * Note: This method has limitations:
 * - Does not handle functions, undefined, symbols, or circular references
 * - Date objects are converted to strings
 * - RegExp objects are converted to empty objects
 * For simple configuration objects and data, this is sufficient.
 * 
 * TODO: Consider using `structuredClone()` for modern browsers (Chrome 98+, Firefox 94+, Safari 15.4+).
 * structuredClone() handles more types (Date, RegExp, Map, Set, ArrayBuffer, etc.) and circular references.
 * For now, JSON serialization is kept for broader compatibility.
 * 
 * @param obj - Object to clone (must be JSON-serializable)
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || obj === undefined) {
        return obj;
    }
    return JSON.parse(JSON.stringify(obj)) as T;
}
