/**
 * Blood on the Clocktower Token Generator
 * Unit Tests for Utils Module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    debounce,
    hexToRgb,
    generateUniqueFilename,
    sanitizeFilename,
    formatJson,
    validateJson,
    sleep,
    getContrastColor,
    deepClone,
    capitalize
} from './utils';

// ============================================================================
// hexToRgb Tests
// ============================================================================

describe('hexToRgb', () => {
    it('should convert standard hex colors correctly', () => {
        expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
        expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should handle hex colors without hash', () => {
        expect(hexToRgb('FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should handle lowercase hex colors', () => {
        expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should return null for invalid hex colors', () => {
        expect(hexToRgb('invalid')).toBeNull();
        expect(hexToRgb('#GGG')).toBeNull();
        expect(hexToRgb('#12345')).toBeNull();
        expect(hexToRgb('')).toBeNull();
    });

    it('should handle team colors from config', () => {
        // These are the TEAM_COLORS from config.ts
        expect(hexToRgb('#1a5f2a')).toEqual({ r: 26, g: 95, b: 42 }); // townsfolk
        expect(hexToRgb('#8b0000')).toEqual({ r: 139, g: 0, b: 0 }); // demon
        expect(hexToRgb('#808080')).toEqual({ r: 128, g: 128, b: 128 }); // meta
    });
});

// ============================================================================
// getContrastColor Tests
// ============================================================================

describe('getContrastColor', () => {
    it('should return black for light backgrounds', () => {
        expect(getContrastColor('#FFFFFF')).toBe('#000000');
        expect(getContrastColor('#FFFF00')).toBe('#000000'); // Yellow
        expect(getContrastColor('#00FF00')).toBe('#000000'); // Lime green
    });

    it('should return white for dark backgrounds', () => {
        expect(getContrastColor('#000000')).toBe('#FFFFFF');
        expect(getContrastColor('#1a1a1a')).toBe('#FFFFFF'); // Dark gray
        expect(getContrastColor('#8b0000')).toBe('#FFFFFF'); // Dark red
    });

    it('should return black for invalid colors', () => {
        expect(getContrastColor('invalid')).toBe('#000000');
        expect(getContrastColor('')).toBe('#000000');
    });

    it('should work with team colors', () => {
        // Test the team colors from config.ts
        expect(getContrastColor('#1a5f2a')).toBe('#FFFFFF'); // townsfolk - dark green
        expect(getContrastColor('#808080')).toBe('#000000'); // meta - gray (borderline)
    });
});

// ============================================================================
// sanitizeFilename Tests
// ============================================================================

describe('sanitizeFilename', () => {
    it('should remove invalid characters', () => {
        expect(sanitizeFilename('file<>name')).toBe('filename');
        expect(sanitizeFilename('file:name')).toBe('filename');
        expect(sanitizeFilename('file"name')).toBe('filename');
        expect(sanitizeFilename('file/name')).toBe('filename');
        expect(sanitizeFilename('file\\name')).toBe('filename');
        expect(sanitizeFilename('file|name')).toBe('filename');
        expect(sanitizeFilename('file?name')).toBe('filename');
        expect(sanitizeFilename('file*name')).toBe('filename');
    });

    it('should replace spaces with underscores', () => {
        expect(sanitizeFilename('file name')).toBe('file_name');
        expect(sanitizeFilename('file  name')).toBe('file_name');
        expect(sanitizeFilename('file   name')).toBe('file_name');
    });

    it('should handle character names', () => {
        expect(sanitizeFilename('Washerwoman')).toBe('Washerwoman');
        expect(sanitizeFilename('Fortune Teller')).toBe('Fortune_Teller');
        expect(sanitizeFilename("Philosopher's Stone")).toBe('Philosophers_Stone');
    });

    it('should trim whitespace', () => {
        expect(sanitizeFilename('  filename  ')).toBe('filename');
        expect(sanitizeFilename('  file name  ')).toBe('file_name');
    });

    it('should handle empty strings', () => {
        expect(sanitizeFilename('')).toBe('');
        expect(sanitizeFilename('   ')).toBe('');
    });
});

// ============================================================================
// generateUniqueFilename Tests
// ============================================================================

describe('generateUniqueFilename', () => {
    it('should return base name for first occurrence', () => {
        const nameCount = new Map<string, number>();
        expect(generateUniqueFilename(nameCount, 'Washerwoman')).toBe('Washerwoman');
    });

    it('should add suffix for duplicates', () => {
        const nameCount = new Map<string, number>();
        expect(generateUniqueFilename(nameCount, 'Drunk')).toBe('Drunk');
        expect(generateUniqueFilename(nameCount, 'Drunk')).toBe('Drunk_01');
        expect(generateUniqueFilename(nameCount, 'Drunk')).toBe('Drunk_02');
    });

    it('should track multiple different names', () => {
        const nameCount = new Map<string, number>();
        expect(generateUniqueFilename(nameCount, 'Imp')).toBe('Imp');
        expect(generateUniqueFilename(nameCount, 'Washerwoman')).toBe('Washerwoman');
        expect(generateUniqueFilename(nameCount, 'Imp')).toBe('Imp_01');
        expect(generateUniqueFilename(nameCount, 'Washerwoman')).toBe('Washerwoman_01');
    });

    it('should handle many duplicates with zero-padded numbers', () => {
        const nameCount = new Map<string, number>();
        for (let i = 0; i < 12; i++) {
            generateUniqueFilename(nameCount, 'Token');
        }
        // After 12 calls: Token, Token_01, Token_02, ..., Token_11
        expect(nameCount.get('Token')).toBe(12);
    });
});

// ============================================================================
// formatJson Tests
// ============================================================================

describe('formatJson', () => {
    it('should format valid JSON with indentation', () => {
        const input = '{"name":"test","value":123}';
        const expected = '{\n  "name": "test",\n  "value": 123\n}';
        expect(formatJson(input)).toBe(expected);
    });

    it('should format arrays', () => {
        const input = '[{"id":"washerwoman"},{"id":"librarian"}]';
        const result = formatJson(input);
        expect(result).toContain('"id": "washerwoman"');
        expect(result).toContain('"id": "librarian"');
    });

    it('should return original string for invalid JSON', () => {
        const input = 'not valid json';
        expect(formatJson(input)).toBe(input);
    });

    it('should handle empty arrays', () => {
        expect(formatJson('[]')).toBe('[]');
    });

    it('should handle nested objects', () => {
        const input = '{"outer":{"inner":"value"}}';
        const result = formatJson(input);
        expect(result).toContain('"outer"');
        expect(result).toContain('"inner"');
    });
});

// ============================================================================
// validateJson Tests
// ============================================================================

describe('validateJson', () => {
    it('should validate correct script JSON', () => {
        const input = '[{"id":"washerwoman"},{"id":"librarian"}]';
        const result = validateJson(input);
        expect(result.valid).toBe(true);
        expect(result.data).toEqual([{ id: 'washerwoman' }, { id: 'librarian' }]);
    });

    it('should reject empty string', () => {
        const result = validateJson('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('JSON is empty');
    });

    it('should reject whitespace-only string', () => {
        const result = validateJson('   ');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('JSON is empty');
    });

    it('should reject non-array JSON', () => {
        const result = validateJson('{"name":"test"}');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('JSON must be an array');
    });

    it('should reject invalid JSON syntax', () => {
        const result = validateJson('[{invalid}]');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid JSON');
    });

    it('should accept empty array', () => {
        const result = validateJson('[]');
        expect(result.valid).toBe(true);
        expect(result.data).toEqual([]);
    });

    it('should handle complex script entries', () => {
        const input = JSON.stringify([
            { id: '_meta', name: 'Test Script', author: 'Author' },
            { id: 'washerwoman' },
            { id: 'custom', name: 'Custom Char', team: 'townsfolk' }
        ]);
        const result = validateJson(input);
        expect(result.valid).toBe(true);
        expect(result.data?.length).toBe(3);
    });
});

// ============================================================================
// sleep Tests
// ============================================================================

describe('sleep', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should resolve after specified time', async () => {
        const promise = sleep(1000);
        vi.advanceTimersByTime(1000);
        await expect(promise).resolves.toBeUndefined();
    });

    it('should not resolve before specified time', async () => {
        let resolved = false;
        sleep(1000).then(() => { resolved = true; });

        vi.advanceTimersByTime(500);
        await Promise.resolve(); // Flush microtasks
        expect(resolved).toBe(false);

        vi.advanceTimersByTime(500);
        await Promise.resolve();
        expect(resolved).toBe(true);
    });
});

// ============================================================================
// deepClone Tests
// ============================================================================

describe('deepClone', () => {
    it('should clone simple objects', () => {
        const original = { name: 'test', value: 123 };
        const cloned = deepClone(original);
        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
    });

    it('should clone nested objects', () => {
        const original = { outer: { inner: { deep: 'value' } } };
        const cloned = deepClone(original);
        expect(cloned).toEqual(original);
        expect(cloned.outer).not.toBe(original.outer);
        expect(cloned.outer.inner).not.toBe(original.outer.inner);
    });

    it('should clone arrays', () => {
        const original = [1, 2, { name: 'test' }];
        const cloned = deepClone(original);
        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned[2]).not.toBe(original[2]);
    });

    it('should handle null and undefined', () => {
        expect(deepClone(null)).toBeNull();
        expect(deepClone(undefined)).toBeUndefined();
    });

    it('should clone character data', () => {
        const character = {
            id: 'washerwoman',
            name: 'Washerwoman',
            team: 'townsfolk',
            reminders: ['Townsfolk', 'Wrong']
        };
        const cloned = deepClone(character);
        expect(cloned).toEqual(character);
        expect(cloned.reminders).not.toBe(character.reminders);
    });
});

// ============================================================================
// capitalize Tests
// ============================================================================

describe('capitalize', () => {
    it('should capitalize first letter', () => {
        expect(capitalize('hello')).toBe('Hello');
        expect(capitalize('world')).toBe('World');
    });

    it('should lowercase rest of string', () => {
        expect(capitalize('HELLO')).toBe('Hello');
        expect(capitalize('hELLO')).toBe('Hello');
    });

    it('should handle single character', () => {
        expect(capitalize('a')).toBe('A');
        expect(capitalize('A')).toBe('A');
    });

    it('should handle empty string', () => {
        expect(capitalize('')).toBe('');
    });

    it('should handle team names', () => {
        expect(capitalize('townsfolk')).toBe('Townsfolk');
        expect(capitalize('DEMON')).toBe('Demon');
        expect(capitalize('miNioN')).toBe('Minion');
    });
});

// ============================================================================
// debounce Tests
// ============================================================================

describe('debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should delay function execution', () => {
        const fn = vi.fn();
        const debouncedFn = debounce(fn, 100);

        debouncedFn();
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
        const fn = vi.fn();
        const debouncedFn = debounce(fn, 100);

        debouncedFn();
        vi.advanceTimersByTime(50);
        debouncedFn();
        vi.advanceTimersByTime(50);
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', () => {
        const fn = vi.fn();
        const debouncedFn = debounce(fn, 100);

        debouncedFn('arg1', 'arg2');
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should only call with last arguments when called multiple times', () => {
        const fn = vi.fn();
        const debouncedFn = debounce(fn, 100);

        debouncedFn('first');
        debouncedFn('second');
        debouncedFn('third');
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('third');
    });
});
