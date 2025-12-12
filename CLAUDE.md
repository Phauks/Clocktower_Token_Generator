# Claude Code Generation Guide for Clocktower Token Generator

> **Purpose**: This document helps Claude (and contributors) understand the existing codebase structure to minimize code duplication and ensure consistent architecture when making changes.

---

## 🔍 Pre-Implementation Checklist

**Before writing ANY new TypeScript code, Claude should:**

1. **Search for existing utilities** in these locations (in order):
   - `src/ts/utils/` - Domain-specific utilities (strings, images, JSON, colors, async, **logger**, **errorUtils**)
   - `src/ts/canvas/` - Canvas rendering utilities (text, shapes, images, QR codes)
   - `src/ts/data/` - Data loading and script parsing utilities
   - `src/ts/sync/` - GitHub data synchronization (IndexedDB, Cache API, GitHub releases)
   - `src/ts/export/` - Export utilities (PDF, PNG, ZIP)
   - `src/ts/generation/` - Token generation (**refactored with DI**), presets, renderers
   - `src/ts/ui/` - UI utility functions
   - `src/hooks/` - Custom React hooks (including **refactored TokenGrid hooks**, **cache warming**)
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
│   ├── characterUtils.ts  # Character validation and utilities
│   ├── characterLookup.ts # 🆕 Character search & validation service
│   └── exampleScripts.ts  # 🆕 Example script definitions
│
├── sync/           # 🆕 GitHub data synchronization (v0.3.0)
│   ├── index.ts               # Barrel export
│   ├── dataSyncService.ts     # Main sync orchestrator with event system
│   ├── githubReleaseClient.ts # GitHub API client with rate limiting
│   ├── packageExtractor.ts    # ZIP extraction and validation
│   ├── storageManager.ts      # IndexedDB + Cache API wrapper
│   ├── versionManager.ts      # Version comparison logic (vYYYY.MM.DD-rN)
│   ├── migrationHelper.ts     # Legacy data migration
│   └── __tests__/             # Unit tests (92 tests total)
│       ├── dataSyncService.test.ts      (10 tests)
│       ├── githubReleaseClient.test.ts  (14 tests)
│       ├── packageExtractor.test.ts     (19 tests)
│       ├── storageManager.test.ts       (19 tests)
│       ├── versionManager.test.ts       (30 tests)
│       └── __mocks__/         # Test mocks and fixtures
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
│   ├── progressUtils.ts   # Progress tracking
│   ├── classNames.ts      # 🆕 CSS className utility
│   ├── nameGenerator.ts   # 🆕 Unique name generation
│   ├── storageKeys.ts     # 🆕 localStorage key constants
│   ├── tokenGrouping.ts   # 🆕 Token grouping logic
│   └── characterImageResolver.ts # 🆕 SSOT for character icon URL resolution
│
├── themes.ts       # 🆕 Theme definitions and utilities
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
| `characterImageResolver.ts` | **🆕 SSOT** character icon resolution | `resolveCharacterImageUrl`, `resolveCharacterImages`, `isExternalUrl`, `extractCharacterIdFromPath` |

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
| `characterLookup.ts` | Character search & validation | `CharacterLookupService` class with O(1) validation and fuzzy search |
| `exampleScripts.ts` | Example script definitions | `EXAMPLE_SCRIPTS` array with predefined scripts |

### Sync Module (`src/ts/sync/`) 🆕 v0.3.0

**Purpose:** GitHub data synchronization with offline-first architecture

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `dataSyncService.ts` | Main orchestrator | `DataSyncService` class - initialize, checkForUpdates, downloadAndInstall, getCharacters, clearCacheAndResync |
| `githubReleaseClient.ts` | GitHub API client | `GitHubReleaseClient` class - fetchLatestRelease, downloadAsset, ETag caching, rate limit handling |
| `packageExtractor.ts` | ZIP extraction | `PackageExtractor` class - extract, validateStructure, verifyContentHash |
| `storageManager.ts` | IndexedDB + Cache API | `StorageManager` class - character CRUD, metadata ops, image caching, quota management |
| `versionManager.ts` | Version comparison | `VersionManager` class - parse, compare, getCurrentVersion (vYYYY.MM.DD-rN format) |
| `migrationHelper.ts` | Legacy migration | `MigrationHelper` class - detectFirstTime, runMigration, cleanup |

**Key Features:**
- **Event System**: Subscribe to sync events (checking, downloading, extracting, success, error)
- **Non-blocking**: Background updates don't interrupt user workflow
- **Fallback Strategy**: Cache → GitHub → graceful degradation
- **Storage Management**: IndexedDB (~2-5 MB) + Cache API (~15-20 MB)
- **Version Tracking**: Metadata stored in IndexedDB
- **Rate Limiting**: Exponential backoff for GitHub API (60 req/hour unauthenticated)

**Data Flow:**
```
App Load → StorageManager.getCharacters() → Load from IndexedDB
         → DataSyncService.checkForUpdates() → GitHub API (background)
         → If update available → Download ZIP → Extract → Store
         → CharacterLookupService.populate() → Ready for validation
```

**Integration Points:**
- `src/contexts/DataSyncContext.tsx` - React context for sync state
- `src/hooks/useScriptData.ts` - Uses sync service when initialized
- `src/components/Shared/SyncStatusIndicator.tsx` - UI status display
- `src/components/Modals/SyncDetailsModal.tsx` - Sync management UI

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

### Resolving Character Icon URLs (SSOT)

```typescript
// DON'T: Duplicate resolution logic in multiple places
if (url.startsWith('http')) { /* ... */ }
else if (url.startsWith('asset:')) { /* ... */ }
else { const blob = await dataSyncService.getCharacterImage(id) /* ... */ }

// DO: Use the SSOT utility for single URLs
import { resolveCharacterImageUrl } from './utils/characterImageResolver.js';

const result = await resolveCharacterImageUrl(imageUrl, characterId);
// result.url = resolved URL (http/data/blob)
// result.source = 'asset' | 'external' | 'sync' | 'fallback'
// result.blobUrl = blob URL to cleanup (if source is 'sync')

// DO: Use the SSOT utility for batch resolution (in hooks)
import { resolveCharacterImages } from './utils/characterImageResolver.js';

const { urls, blobUrls } = await resolveCharacterImages(characters);
// urls = Map<uuid, resolvedUrl>
// blobUrls = array of blob URLs for cleanup

// DO: Use the React hook wrapper for components
import { useCharacterImageResolver } from '../hooks/useCharacterImageResolver';

const { resolvedUrls, isLoading } = useCharacterImageResolver({ characters });
const iconUrl = resolvedUrls.get(character.uuid);
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

*This guide should be consulted before any significant code changes to maintain consistency and reduce refactoring needs.*

---

## 🔧 Refactoring Patterns (2025 Update)

### NEW: Structured Logging

**ALWAYS use the logger utility instead of console.**

```typescript
// DON'T: Use console directly
console.log('Loading data...');
console.error('Failed:', error);

// DO: Use structured logger
import { logger } from './ts/utils/logger.js';

logger.info('DataLoader', 'Loading data...');
logger.error('DataLoader', 'Failed to load', error);

// Child loggers for modules
const syncLogger = logger.child('DataSync');
syncLogger.debug('Checking for updates');

// Performance timing
const result = await logger.time('SlowOperation', 'Processing', async () => {
  return await processData();
});
```

### NEW: Error Handling in Hooks

**Use error utilities to eliminate boilerplate.**

```typescript
// DON'T: Repetitive error handling
try {
  setIsLoading(true);
  setError(null);
  const data = await fetchData();
  return data;
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed');
  console.error('Failed:', err);
} finally {
  setIsLoading(false);
}

// DO: Use handleAsyncOperation
import { handleAsyncOperation } from './ts/utils/errorUtils.js';

const data = await handleAsyncOperation(
  () => fetchData(),
  'Fetch data',
  setIsLoading,
  setError,
  { successMessage: 'Data loaded successfully' }
);
```

### NEW: Dependency Injection Pattern

**Use DI for better testability (TokenGenerator example).**

```typescript
// DON'T: Hard-coded dependencies
class TokenGenerator {
  async getCachedImage(url: string) {
    return globalImageCache.get(url); // Hard dependency
  }
}

// DO: Inject dependencies
import type { IImageCache } from './TokenImageRenderer.js';

class TokenGenerator {
  constructor(
    options: TokenGeneratorOptions,
    private imageCache: IImageCache = defaultImageCache
  ) {}

  async getCachedImage(url: string) {
    return this.imageCache.get(url); // Injected, mockable
  }
}

// Easy to test
const mockCache = { get: vi.fn(), clear: vi.fn() };
const generator = new TokenGenerator(options, mockCache);
```

### NEW: Extract Complex Logic to Custom Hooks

**Create focused hooks for reusability.**

```typescript
// DON'T: Complex component with mixed concerns
export function TokenGrid() {
  const [tokenToDelete, setTokenToDelete] = useState(null);
  const handleDelete = useCallback(...); // 30 lines
  const confirmDelete = useCallback(...); // 20 lines
  const handleSort = useMemo(...); // 40 lines
  const handleGroup = useMemo(...); // 30 lines
  // Component is 200+ lines
}

// DO: Extract to custom hooks
import { useTokenDeletion, useTokenGrouping } from '../hooks';

export function TokenGrid() {
  const deletion = useTokenDeletion({ tokens, setTokens, ... });
  const grouped = useTokenGrouping(tokens);

  // Component is now 50 lines, logic is reusable
}
```

### NEW: Type-Safe Event Emitters

**Define event types for compile-time safety.**

```typescript
// DON'T: Untyped events
const emitter = new EventEmitter();
emitter.on('data', (data) => { /* data is 'any' */ });

// DO: Define event map
interface SyncEvents {
  'progress': [loaded: number, total: number];
  'complete': [data: Character[]];
  'error': [error: Error];
}

const emitter = new EventEmitter<SyncEvents>();
emitter.on('progress', (loaded, total) => {
  // loaded: number, total: number (fully typed!)
});
```

---

## 📦 New Utilities Reference

### Logger (`src/ts/utils/logger.ts`)
- `logger.debug(context, message, ...data)` - Debug logs (dev only)
- `logger.info(context, message, ...data)` - Info logs
- `logger.warn(context, message, ...data)` - Warnings
- `logger.error(context, message, ...error)` - Errors
- `logger.time(context, label, fn)` - Performance timing
- `logger.child(context)` - Create context-specific logger

### Error Handling (`src/ts/utils/errorUtils.ts`)
- `handleHookError(error, context, setError, options?)` - Simple error handling
- `handleAsyncOperation(fn, context, setLoading, setError, options?)` - Complete async wrapper
- `retryOperation(fn, context, options?)` - Retry with exponential backoff
- `validateRequiredFields(obj, fields, context)` - Form validation

### Refactored Hooks (`src/hooks/`)
- `useTokenDeletion({ tokens, setTokens, ... })` - Token deletion logic
- `useTokenGrouping(tokens)` - Token sorting/grouping
- `useStudioNavigation({ onTabChange })` - Studio navigation
- `useProjectCacheWarming(project)` - Auto cache warming

### Refactored Components (`src/ts/generation/`)
- `TokenImageRenderer` - Image rendering (265 lines)
- `TokenTextRenderer` - Text rendering (298 lines)
- `TokenGeneratorRefactored` - Main generator with DI (< 300 lines)
- `ImageCacheAdapter` - Cache adapter for DI

---

## 🎯 Code Review Checklist

Before committing, verify:

- [ ] NO `console.log/error/warn` - use `logger` instead
- [ ] NO repetitive try-catch - use `handleAsyncOperation`
- [ ] Complex hooks extracted to separate files
- [ ] Dependencies injected, not hard-coded
- [ ] Event emitters use typed event maps
- [ ] Functions < 50 lines
- [ ] Classes < 300 lines
- [ ] No `any` types (use generics or `unknown`)

---

*Last updated: 2025-12-10 - See REFACTORING_GUIDE.md for migration details*
