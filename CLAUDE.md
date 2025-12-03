# Claude Code Generation Guide for Clocktower Token Generator

> **Purpose**: This document helps Claude (and contributors) understand the existing codebase structure to minimize code duplication and ensure consistent architecture when making changes.

---

## 🔍 Pre-Implementation Checklist

**Before writing ANY new TypeScript code, Claude should:**

1. **Search for existing utilities** in these locations (in order):
   - `src/ts/utils/` - Domain-specific utilities (strings, images, JSON, colors, async)
   - `src/ts/canvas/` - Canvas rendering utilities (text, shapes, images, QR codes)
   - `src/ts/data/` - Data loading and script parsing utilities
   - `src/ts/export/` - Export utilities (PDF, PNG, ZIP)
   - `src/ts/generation/` - Token generation and presets
   - `src/ts/ui/` - UI utility functions
   - `src/ts/constants.ts` - Magic numbers, layout ratios, colors
   - `src/ts/config.ts` - Application configuration
   - `src/ts/types/index.ts` - Type definitions
   - `src/ts/errors.ts` - Custom error classes

2. **Check if functionality already exists** by searching for:
   - Function names that match the intent
   - Similar parameter signatures
   - Comments describing the behavior

3. **Prefer composition over creation** - Combine existing utilities rather than writing new ones

---

## 📁 Codebase Architecture

### Module Organization (`src/ts/`)

The codebase is organized into domain-specific folders:

```
src/ts/
├── canvas/         # Canvas drawing utilities
│   ├── index.ts           # Barrel export
│   ├── canvasUtils.ts     # Basic canvas operations
│   ├── textDrawing.ts     # Text rendering (curved, wrapped, ability)
│   ├── leafDrawing.ts     # Decorative leaf rendering
│   └── qrGeneration.ts    # QR code generation
│
├── data/           # Data loading and parsing
│   ├── index.ts           # Barrel export
│   ├── dataLoader.ts      # I/O operations (fetch, file loading)
│   ├── scriptParser.ts    # Script JSON parsing
│   └── characterUtils.ts  # Character validation and utilities
│
├── export/         # Export functionality
│   ├── index.ts           # Barrel export
│   ├── pdfGenerator.ts    # PDF generation
│   ├── zipExporter.ts     # ZIP file creation
│   ├── pngExporter.ts     # PNG download
│   └── pngMetadata.ts     # PNG tEXt chunk metadata
│
├── generation/     # Token generation
│   ├── index.ts           # Barrel export
│   ├── tokenGenerator.ts  # TokenGenerator class
│   ├── batchGenerator.ts  # Batch token creation
│   └── presets.ts         # Preset configurations
│
├── types/          # Type definitions
│   ├── index.ts           # Main type definitions
│   └── tokenOptions.ts    # Token generator options
│
├── ui/             # UI utilities
│   ├── index.ts           # Barrel export
│   ├── detailViewUtils.ts # Token detail view functions
│   └── jsonHighlighter.ts # JSON syntax highlighting
│
├── utils/          # General utilities
│   ├── index.ts           # Barrel export
│   ├── stringUtils.ts     # String manipulation
│   ├── imageUtils.ts      # Image loading
│   ├── jsonUtils.ts       # JSON operations
│   ├── colorUtils.ts      # Color manipulation
│   ├── asyncUtils.ts      # Async patterns
│   └── progressUtils.ts   # Progress tracking
│
├── index.ts        # Root barrel export (all modules)
├── config.ts       # Application configuration
├── constants.ts    # Layout constants, colors
└── errors.ts       # Custom error classes
```

### Import Patterns

```typescript
// Preferred: Import from specific module
import { createCanvas, drawCurvedText } from './canvas/index.js';
import { fetchOfficialData, parseScriptData } from './data/index.js';
import { TokenGenerator } from './generation/index.js';

// Alternative: Import from root barrel (all modules)
import { 
    createCanvas, 
    fetchOfficialData, 
    TokenGenerator 
} from './index.js';
```

### Utility Module Structure (`src/ts/utils/`)

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `stringUtils.ts` | Filename/text manipulation | `sanitizeFilename`, `generateUniqueFilename`, `capitalize` |
| `imageUtils.ts` | Image loading & canvas ops | `loadImage`, `loadLocalImage`, `canvasToBlob`, `downloadFile`, `checkFontsLoaded` |
| `jsonUtils.ts` | JSON handling | `formatJson`, `validateJson`, `deepClone` |
| `colorUtils.ts` | Color manipulation | `hexToRgb`, `getContrastColor` |
| `asyncUtils.ts` | Async patterns | `shuffleArray`, `debounce`, `sleep` |
| `progressUtils.ts` | Progress tracking | `createProgressState`, `updateProgress` |

### Canvas Module (`src/ts/canvas/`)

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `canvasUtils.ts` | Basic canvas operations | `createCanvas`, `createCircularClipPath`, `wrapText`, `drawImageCover` |
| `textDrawing.ts` | Text rendering | `drawCurvedText`, `drawCenteredWrappedText`, `drawAbilityText` |
| `leafDrawing.ts` | Leaf decorations | `drawLeaves` |
| `qrGeneration.ts` | QR codes | `generateQRCode` |

### Data Module (`src/ts/data/`)

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `dataLoader.ts` | I/O operations | `fetchOfficialData`, `loadExampleScript`, `loadJsonFile` |
| `scriptParser.ts` | Script parsing | `parseScriptData`, `validateAndParseScript`, `extractScriptMeta` |
| `characterUtils.ts` | Character utilities | `validateCharacter`, `getCharacterImageUrl`, `countReminders`, `groupByTeam` |

### Export Module (`src/ts/export/`)

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `pdfGenerator.ts` | PDF generation | `PDFGenerator` class |
| `zipExporter.ts` | ZIP creation | `createTokensZip` |
| `pngExporter.ts` | PNG download | `downloadTokenPNG` |
| `pngMetadata.ts` | PNG metadata | `embedPngMetadata`, `createCharacterMetadata` |

### Generation Module (`src/ts/generation/`)

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `tokenGenerator.ts` | Token creation | `TokenGenerator` class |
| `batchGenerator.ts` | Batch creation | `generateAllTokens` |
| `presets.ts` | Preset configs | `PRESETS`, `getPreset`, `getPresetNames` |

### Constants (`src/ts/constants.ts`)

**Layout Constants:**
- `CHARACTER_LAYOUT` - Character token positioning (image size, text radius, etc.)
- `REMINDER_LAYOUT` - Reminder token positioning
- `META_TOKEN_LAYOUT` - Script name/Pandemonium token layout
- `QR_TOKEN_LAYOUT` - QR code almanac token layout
- `LEAF_LAYOUT` - Leaf decoration configuration

**Visual Constants:**
- `DEFAULT_COLORS` - Background, text, shadow colors
- `QR_COLORS` - QR code specific colors
- `TEXT_SHADOW` / `ABILITY_TEXT_SHADOW` - Shadow settings
- `LINE_HEIGHTS` - Typography line heights
- `TOKEN_COUNT_BADGE` - Badge styling

**Timing:**
- `TIMING` - Debounce delays, QR generation delay

### Configuration (`src/ts/config.ts`)

- `CONFIG` - Main configuration object with:
  - `TOKEN` - Token sizes, display options
  - `STYLE` - Default styling options
  - `PDF` - PDF export settings
  - `FONT_SPACING` - Letter spacing defaults
  - `TEXT_SHADOW` - Shadow blur defaults
  - `ZIP` - ZIP export settings
  - `API` - API endpoints
  - `ASSETS` - Asset paths
  - `FONTS` - Font sizing ratios
  
- `TEAM_COLORS` - Color mapping for teams
- `TEAM_LABELS` - Display labels for teams

### Type Definitions (`src/ts/types/index.ts`)

Key types to reuse:
- `Team` - Union type for team names
- `Character` - Character data structure
- `ScriptMeta` - Script metadata
- `ScriptEntry` - Union of valid script entries
- `Token` - Generated token with canvas
- `TokenConfig` - Token generation settings
- `PDFOptions` - PDF export options
- `ZipExportOptions` - ZIP export options
- `PngExportOptions` - PNG export options

### Error Classes (`src/ts/errors.ts`)

| Error Class | Use Case |
|-------------|----------|
| `TokenGeneratorError` | Base class for all errors |
| `DataLoadError` | JSON/API loading failures |
| `ValidationError` | Data validation failures (includes `validationErrors` array) |
| `TokenCreationError` | Canvas/token generation failures (includes `tokenName`) |
| `PDFGenerationError` | PDF export failures |
| `ZipCreationError` | ZIP export failures |
| `ResourceNotFoundError` | Missing libraries, fonts, images, elements |
| `UIInitializationError` | Missing DOM elements, invalid UI state |
| `ErrorHandler` | Utility class for user-friendly messages and logging |

---

## 🔧 Common Patterns

### Creating a Token Canvas

```typescript
// DON'T: Create canvas manually
const canvas = document.createElement('canvas');
canvas.width = diameter;
canvas.height = diameter;
const ctx = canvas.getContext('2d');

// DO: Use canvas module
import { createCanvas, createCircularClipPath } from './canvas/index.js';

const { canvas, ctx, center, radius } = createCanvas(diameter);
ctx.save();
createCircularClipPath(ctx, center, radius);
```

### Drawing Text with Shadow

```typescript
// DON'T: Set shadow manually each time
ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
ctx.shadowBlur = 4;
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;

// DO: Use utility functions
import { applyTextShadow, clearShadow } from './canvas/index.js';

applyTextShadow(ctx);
ctx.fillText(text, x, y);
clearShadow(ctx);
```

### Word Wrapping Text

```typescript
// DON'T: Implement word wrapping inline
const words = text.split(' ');
let currentLine = '';
// ... lots of code

// DO: Use existing utility
import { wrapText } from './canvas/index.js';

const lines = wrapText(text, ctx, maxWidth);
```

### Loading Images

```typescript
// DON'T: Create image loading logic
const img = new Image();
img.crossOrigin = 'anonymous';
img.onload = ...

// DO: Use utilities
import { loadImage, loadLocalImage } from './utils/index.js';

const externalImg = await loadImage(url);      // For URLs (with CORS)
const localImg = await loadLocalImage(path);   // For local assets
```

### Using Layout Constants

```typescript
// DON'T: Use magic numbers
const imgSize = diameter * 0.65;
const textRadius = radius * 0.85;

// DO: Use named constants
import { CHARACTER_LAYOUT } from './constants.js';

const imgSize = diameter * CHARACTER_LAYOUT.IMAGE_SIZE_RATIO;
const textRadius = radius * CHARACTER_LAYOUT.CURVED_TEXT_RADIUS;
```

### Handling Errors

```typescript
// DON'T: Throw generic errors
throw new Error('Failed to create token');

// DO: Use typed errors
import { TokenCreationError } from './errors.js';

throw new TokenCreationError('Failed to create token', characterName, originalError);
```

### Using ErrorHandler for User-Friendly Messages

```typescript
import { ErrorHandler, ValidationError } from './errors.js';

try {
    await generateToken(character);
} catch (error) {
    // Get user-friendly message
    const message = ErrorHandler.getUserMessage(error);
    showToast(message);
    
    // Log with appropriate level
    ErrorHandler.log(error, 'TokenGeneration');
    
    // Check if should show detailed error to user
    if (ErrorHandler.shouldShowToUser(error)) {
        displayErrorDetails(error);
    }
}
```

---

## ✅ Refactoring Completed (November 2025)

### Phase 1: File-Level Refactoring

The following refactoring was applied to reduce file sizes:

1. ✅ **`tokenGenerator.ts` reduced from 1,276 → 363 lines**
   - Extracted batch generation to `batchGenerator.ts`
   - Extracted QR code logic to `canvas/qrGeneration.ts`
   - Extracted token options to `types/tokenOptions.ts`

2. ✅ **`pdfGenerator.ts` reduced from 430 → 203 lines**
   - Extracted ZIP creation to `zipExporter.ts`
   - Extracted PNG download to `pngExporter.ts`

3. ✅ **`dataLoader.ts` split into three modules**
   - `dataLoader.ts` (144 lines) - I/O operations only
   - `scriptParser.ts` (256 lines) - Script parsing logic
   - `characterUtils.ts` (160 lines) - Character utilities

### Phase 2: Folder Reorganization

The codebase was reorganized into domain-specific folders with backward compatibility:

1. ✅ **`canvas/` folder** - Canvas drawing utilities
   - `canvasUtils.ts`, `textDrawing.ts`, `leafDrawing.ts`, `qrGeneration.ts`
   - Consolidated from `canvas-utils.ts`, `text-drawing.ts`, `leaf-drawing.ts`, `qr-generation.ts`

2. ✅ **`data/` folder** - Data loading and parsing
   - `dataLoader.ts`, `scriptParser.ts`, `characterUtils.ts`
   - All data operations in one logical location

3. ✅ **`export/` folder** - Export functionality
   - `pdfGenerator.ts`, `zipExporter.ts`, `pngExporter.ts`, `pngMetadata.ts`
   - All export formats consolidated

4. ✅ **`generation/` folder** - Token generation
   - `tokenGenerator.ts`, `batchGenerator.ts`, `presets.ts`
   - Token creation logic centralized

5. ✅ **`ui/` folder** - UI utilities
   - `detailViewUtils.ts`, `jsonHighlighter.ts`
   - UI-specific helper functions

6. ✅ **Root `index.ts`** - Barrel export for all modules
   - Convenient single import point for all public APIs

7. ✅ **Legacy stubs removed** - All backward compatibility re-exports deleted
   - All imports now use module paths directly (e.g., `./canvas/index.js`)
   - `utils.ts` removed; use `./utils/index.js`

---

## 📋 Before Adding New Code

Ask these questions:

1. **Is there an existing utility?**
   - Check `canvas/`, `data/`, `export/`, `generation/`, `ui/`, `utils/`

2. **Is there a similar pattern elsewhere?**
   - Search codebase for similar function names or logic

3. **Should this be a constant?**
   - Magic numbers → `constants.ts`
   - Configuration values → `config.ts`

4. **Should this be a type?**
   - New interfaces/types → `types/index.ts`

5. **Should this be an error class?**
   - New error scenarios → `errors.ts`

6. **Where does it belong?**
   - Canvas/drawing → `canvas/`
   - Data loading/parsing → `data/`
   - Exporting files → `export/`
   - Token generation → `generation/`
   - UI helpers → `ui/`
   - General utilities → `utils/`

---

## 🔄 When to Create New Code

Create new utilities when:
- Functionality is used in 2+ places
- Logic is complex enough to warrant abstraction
- It fits a clear domain (strings, images, canvas, etc.)

Create new constants when:
- A magic number appears in code
- A value might need to change in the future
- The value has semantic meaning

Create new types when:
- An object shape is used in multiple places
- Type safety would catch potential bugs
- Documentation would help understanding

---

## 🚀 Performance Optimization Plan

### Planned Improvements

The rendering pipeline has been analyzed and the following optimizations are planned:

#### Tier 1: High Impact, Moderate Effort

1. **React.memo for TokenCard** - Prevent re-renders of unchanged cards
   - Location: `src/components/TokenGrid/TokenCard.tsx`
   - Add `memo()` wrapper with custom comparison on `token.filename`

2. **Global image cache singleton** - Share cache across TokenGenerator instances
   - Create: `src/ts/utils/imageCache.ts`
   - Update: `src/ts/generation/tokenGenerator.ts` to use shared instance

3. **Parallel batch generation with adaptive sizing**
   - Location: `src/ts/generation/batchGenerator.ts`
   - Replace sequential `for...of` with `Promise.all()` chunked batches
   - Add to `config.ts`:
     ```typescript
     GENERATION: {
         BATCH_SIZE: Math.min(8, Math.max(2, (navigator.hardwareConcurrency || 4) - 1)),
         MIN_BATCH_SIZE: 2,
         MAX_BATCH_SIZE: 8,
     }
     ```

4. **Incremental token updates**
   - Location: `src/hooks/useTokenGenerator.ts`
   - Convert to async generator, update state per-token instead of all-at-once

5. **AbortController for cancellation**
   - Location: `src/hooks/useTokenGenerator.ts`, `src/ts/generation/batchGenerator.ts`
   - Allow canceling in-progress generation

#### Tier 2: High Impact, High Effort

6. **Image cache persistence with IndexedDB**
   - Create: `src/ts/utils/persistentCache.ts`
   - Cache character images (50-200KB each) for 7 days
   - Use `idb` library for async IndexedDB access
   - LRU eviction when cache exceeds 100MB
   - Benefits: Instant reload, offline support, reduced API calls

7. **Token hash caching**
   - Location: `src/ts/generation/batchGenerator.ts`
   - Skip regeneration when character + options hash matches cached token

#### Tier 3: Quick Wins

8. **Lazy rendering with IntersectionObserver**
   - Location: `src/components/TokenGrid/TokenCard.tsx`
   - Only render tokens when they enter viewport

### TODO: Future Optimizations

- [ ] **OffscreenCanvas + Web Workers** - Move canvas ops off main thread
  - Browser support: ~93% (Baseline since March 2023)
  - Safari 17+ fully supported, Safari 16.x partial (2D only)
  - Requires progressive enhancement with fallback:
    1. Best: Web Worker + OffscreenCanvas
    2. Good: Main thread + `requestIdleCallback` chunking
    3. Fallback: Current blocking approach
  - Challenge: Workers can't use `new Image()` - need `fetch()` + `createImageBitmap()`

---

*This guide should be consulted before any significant code changes to maintain consistency and reduce refactoring needs.*
