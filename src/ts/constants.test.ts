/**
 * Blood on the Clocktower Token Generator
 * Unit Tests for Constants Module
 */

import { describe, it, expect } from 'vitest';
import {
    CHARACTER_LAYOUT,
    REMINDER_LAYOUT,
    META_TOKEN_LAYOUT,
    QR_TOKEN_LAYOUT,
    LINE_HEIGHTS,
    TOKEN_COUNT_BADGE,
    DEFAULT_COLORS,
    QR_COLORS,
    TEXT_SHADOW,
    ABILITY_TEXT_SHADOW,
    TIMING,
    UI_SIZE,
    TOKEN_PREVIEW
} from './constants';

// ============================================================================
// CHARACTER_LAYOUT Tests
// ============================================================================

describe('CHARACTER_LAYOUT', () => {
    it('should have valid image size ratio', () => {
        expect(CHARACTER_LAYOUT.IMAGE_SIZE_RATIO).toBeGreaterThan(0);
        expect(CHARACTER_LAYOUT.IMAGE_SIZE_RATIO).toBeLessThan(1);
        expect(CHARACTER_LAYOUT.IMAGE_SIZE_RATIO).toBe(0.65);
    });

    it('should have valid ability text position', () => {
        expect(CHARACTER_LAYOUT.ABILITY_TEXT_Y_POSITION).toBeGreaterThan(0);
        expect(CHARACTER_LAYOUT.ABILITY_TEXT_Y_POSITION).toBeLessThan(1);
    });

    it('should have valid max arc span', () => {
        // Should be approximately 126 degrees (0.7 * PI)
        expect(CHARACTER_LAYOUT.MAX_TEXT_ARC_SPAN).toBeCloseTo(Math.PI * 0.7);
        expect(CHARACTER_LAYOUT.MAX_TEXT_ARC_SPAN).toBeLessThan(Math.PI); // Less than 180 degrees
    });

    it('should have valid curved text radius', () => {
        expect(CHARACTER_LAYOUT.CURVED_TEXT_RADIUS).toBe(0.85);
    });
});

// ============================================================================
// REMINDER_LAYOUT Tests
// ============================================================================

describe('REMINDER_LAYOUT', () => {
    it('should have smaller image size than character tokens', () => {
        expect(REMINDER_LAYOUT.IMAGE_SIZE_RATIO).toBeLessThan(CHARACTER_LAYOUT.IMAGE_SIZE_RATIO);
        expect(REMINDER_LAYOUT.IMAGE_SIZE_RATIO).toBe(0.5);
    });

    it('should have matching curved text radius', () => {
        expect(REMINDER_LAYOUT.CURVED_TEXT_RADIUS).toBe(CHARACTER_LAYOUT.CURVED_TEXT_RADIUS);
    });
});

// ============================================================================
// META_TOKEN_LAYOUT Tests
// ============================================================================

describe('META_TOKEN_LAYOUT', () => {
    it('should have reasonable text sizes', () => {
        expect(META_TOKEN_LAYOUT.PANDEMONIUM_TEXT_SIZE).toBeGreaterThan(0);
        expect(META_TOKEN_LAYOUT.PANDEMONIUM_TEXT_SIZE).toBeLessThan(0.2);
        expect(META_TOKEN_LAYOUT.CENTERED_TEXT_SIZE).toBeGreaterThan(0);
        expect(META_TOKEN_LAYOUT.CENTERED_TEXT_SIZE).toBeLessThan(0.2);
    });

    it('should have author text smaller than main text', () => {
        expect(META_TOKEN_LAYOUT.AUTHOR_TEXT_SIZE_FACTOR).toBeLessThan(1);
    });
});

// ============================================================================
// QR_TOKEN_LAYOUT Tests
// ============================================================================

describe('QR_TOKEN_LAYOUT', () => {
    it('should have QR code fill most of token', () => {
        expect(QR_TOKEN_LAYOUT.QR_CODE_SIZE).toBe(0.8);
        expect(QR_TOKEN_LAYOUT.QR_CODE_SIZE).toBeGreaterThan(0.5);
    });

    it('should have text box dimensions', () => {
        expect(QR_TOKEN_LAYOUT.TEXT_BOX_WIDTH).toBeGreaterThan(0);
        expect(QR_TOKEN_LAYOUT.TEXT_BOX_HEIGHT).toBeGreaterThan(0);
    });
});

// ============================================================================
// DEFAULT_COLORS Tests
// ============================================================================

describe('DEFAULT_COLORS', () => {
    it('should have valid hex colors', () => {
        expect(DEFAULT_COLORS.FALLBACK_BACKGROUND).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(DEFAULT_COLORS.TEXT_PRIMARY).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(DEFAULT_COLORS.TEXT_DARK).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have white as primary text color', () => {
        expect(DEFAULT_COLORS.TEXT_PRIMARY).toBe('#FFFFFF');
    });

    it('should have black as dark text color', () => {
        expect(DEFAULT_COLORS.TEXT_DARK).toBe('#000000');
    });

    it('should have valid rgba shadow color', () => {
        expect(DEFAULT_COLORS.TEXT_SHADOW).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/);
    });
});

// ============================================================================
// QR_COLORS Tests
// ============================================================================

describe('QR_COLORS', () => {
    it('should have standard black and white colors', () => {
        expect(QR_COLORS.DARK).toBe('#000000');
        expect(QR_COLORS.LIGHT).toBe('#FFFFFF');
    });

    it('should have high error correction level', () => {
        // Level 3 = H = 30% error recovery
        expect(QR_COLORS.ERROR_CORRECTION_LEVEL).toBe(3);
    });
});

// ============================================================================
// TEXT_SHADOW Tests
// ============================================================================

describe('TEXT_SHADOW', () => {
    it('should have reasonable shadow values', () => {
        expect(TEXT_SHADOW.BLUR).toBeGreaterThan(0);
        expect(TEXT_SHADOW.OFFSET_X).toBeGreaterThan(0);
        expect(TEXT_SHADOW.OFFSET_Y).toBeGreaterThan(0);
    });
});

describe('ABILITY_TEXT_SHADOW', () => {
    it('should have smaller shadow than main text', () => {
        expect(ABILITY_TEXT_SHADOW.BLUR).toBeLessThanOrEqual(TEXT_SHADOW.BLUR);
        expect(ABILITY_TEXT_SHADOW.OFFSET_X).toBeLessThanOrEqual(TEXT_SHADOW.OFFSET_X);
        expect(ABILITY_TEXT_SHADOW.OFFSET_Y).toBeLessThanOrEqual(TEXT_SHADOW.OFFSET_Y);
    });
});

// ============================================================================
// LINE_HEIGHTS Tests
// ============================================================================

describe('LINE_HEIGHTS', () => {
    it('should have standard line height greater than 1', () => {
        expect(LINE_HEIGHTS.STANDARD).toBeGreaterThan(1);
        expect(LINE_HEIGHTS.STANDARD).toBe(1.3);
    });

    it('should have tight line height', () => {
        expect(LINE_HEIGHTS.TIGHT).toBeGreaterThan(1);
        expect(LINE_HEIGHTS.TIGHT).toBeLessThan(LINE_HEIGHTS.STANDARD);
    });
});

// ============================================================================
// TIMING Tests
// ============================================================================

describe('TIMING', () => {
    it('should have reasonable delays', () => {
        expect(TIMING.QR_GENERATION_DELAY).toBeGreaterThan(0);
        expect(TIMING.QR_GENERATION_DELAY).toBeLessThan(1000);

        expect(TIMING.JSON_VALIDATION_DEBOUNCE).toBeGreaterThan(0);
        expect(TIMING.JSON_VALIDATION_DEBOUNCE).toBeLessThan(1000);

        expect(TIMING.OPTION_CHANGE_DEBOUNCE).toBeGreaterThan(0);
        expect(TIMING.OPTION_CHANGE_DEBOUNCE).toBeLessThan(1000);
    });
});

// ============================================================================
// UI_SIZE Tests
// ============================================================================

describe('UI_SIZE', () => {
    it('should have valid min/max range', () => {
        expect(UI_SIZE.MIN).toBeLessThan(UI_SIZE.MAX);
        expect(UI_SIZE.DEFAULT).toBeGreaterThanOrEqual(UI_SIZE.MIN);
        expect(UI_SIZE.DEFAULT).toBeLessThanOrEqual(UI_SIZE.MAX);
    });

    it('should have default at 100%', () => {
        expect(UI_SIZE.DEFAULT).toBe(100);
    });

    it('should have standard base font size', () => {
        expect(UI_SIZE.BASE_FONT_SIZE_PX).toBe(16);
    });
});

// ============================================================================
// TOKEN_PREVIEW Tests
// ============================================================================

describe('TOKEN_PREVIEW', () => {
    it('should have reasonable display size', () => {
        expect(TOKEN_PREVIEW.DISPLAY_SIZE).toBeGreaterThan(100);
        expect(TOKEN_PREVIEW.DISPLAY_SIZE).toBeLessThan(500);
        expect(TOKEN_PREVIEW.DISPLAY_SIZE).toBe(180);
    });
});

// ============================================================================
// TOKEN_COUNT_BADGE Tests
// ============================================================================

describe('TOKEN_COUNT_BADGE', () => {
    it('should have valid values', () => {
        expect(TOKEN_COUNT_BADGE.BACKGROUND_RADIUS).toBeGreaterThan(0);
        expect(TOKEN_COUNT_BADGE.STROKE_WIDTH).toBeGreaterThan(0);
    });
});
