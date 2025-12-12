/**
 * Blood on the Clocktower Token Generator
 * Canvas Module - Barrel export for all canvas utilities
 */

// Canvas utilities
export {
    createCanvas,
    createCircularClipPath,
    applyTextShadow,
    applyAbilityTextShadow,
    clearShadow,
    wrapText,
    drawImageCover,
    fillCircle,
    strokeCircle,
    drawCenteredText,
    drawMultiLineText,
    measureCharacterWidths,
    type Point,
    type CanvasContext,
    type CanvasOptions,
} from './canvasUtils.js';

// Text drawing utilities
export {
    drawCurvedText,
    drawCenteredWrappedText,
    drawTwoLineCenteredText,
    drawAbilityText,
    drawQROverlayText,
    applyConfigurableShadow,
    type CurvedTextOptions,
    type CenteredTextOptions,
} from './textDrawing.js';

// Leaf drawing utilities
export {
    drawLeaves,
    type LeafDrawingOptions,
} from './leafDrawing.js';

// QR code generation
export {
    generateQRCode,
    type QRCodeOptions,
    type QRCodeConstructor,
} from './qrGeneration.js';

// Canvas optimization utilities
export {
    calculateCircularTextLayout,
    createCircularWidthCalculator,
    calculateCircularWidth,
    precalculateCurvedTextPositions,
    type TextLayoutResult,
    type CharacterPosition,
} from './canvasOptimizations.js';

// Font cache (using hexagonal architecture)
export {
    getCachedFont,
    clearFontCache,
    getFontCacheStats,
    fontCache
} from '../cache/instances/fontCache.js';

// Canvas pooling
export {
    CanvasPool,
    globalCanvasPool,
} from './canvasPool.js';
