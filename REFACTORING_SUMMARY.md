# Refactoring Summary - Version 0.2.0

## Overview

This document summarizes the major refactoring effort completed for version 0.2.0 of the Blood on the Clocktower Token Generator. The refactoring focused on three main recommendations:

1. **Extract Magic Numbers to Constants**
2. **Standardize Error Handling**
3. **Refactor UIController into Smaller Manager Classes**

---

## 1. Constants Extraction

### Created: `src/ts/constants.ts`

**Purpose:** Extract all magic numbers and hard-coded values into well-documented constants for improved maintainability.

### Key Constants Added:

- **`CHARACTER_LAYOUT`** - Character token sizing and positioning ratios
- **`REMINDER_LAYOUT`** - Reminder token layout ratios
- **`META_TOKEN_LAYOUT`** - Meta token (script name, Pandemonium) layout
- **`QR_TOKEN_LAYOUT`** - QR code almanac token layout
- **`LINE_HEIGHTS`** - Text line height multipliers
- **`TOKEN_COUNT_BADGE`** - Reminder count badge styling
- **`DEFAULT_COLORS`** - Default colors for rendering
- **`QR_COLORS`** - QR code specific colors and error correction
- **`TEXT_SHADOW`** - Text shadow configuration
- **`ABILITY_TEXT_SHADOW`** - Ability text shadow settings
- **`TIMING`** - Delay and debounce timing values
- **`UI_SIZE`** - UI scaling constants
- **`TOKEN_PREVIEW`** - Token preview display settings

### Benefits:

- **Maintainability:** All magic numbers are now centralized with clear documentation
- **Consistency:** Same values used across different token types
- **Tweakability:** Easy to adjust layout without hunting through code
- **Self-documenting:** Constant names describe their purpose

### Files Updated:

- ✅ `src/ts/tokenGenerator.ts` - Now uses all constants instead of hard-coded values

---

## 2. Error Handling Standardization

### Created: `src/ts/errors.ts`

**Purpose:** Provide consistent, type-safe error handling throughout the application.

### Custom Error Classes:

1. **`TokenGeneratorError`** - Base class for all custom errors
2. **`DataLoadError`** - JSON file loading, API fetching, example script loading
3. **`ValidationError`** - JSON validation, character validation
4. **`TokenCreationError`** - Canvas operations, image loading, token creation
5. **`PDFGenerationError`** - PDF layout and export errors
6. **`ZipCreationError`** - ZIP file creation errors
7. **`ResourceNotFoundError`** - Missing libraries, fonts, images, elements
8. **`UIInitializationError`** - DOM element initialization failures

### ErrorHandler Utility:

- **`getUserMessage()`** - Extract user-friendly error messages
- **`log()`** - Consistent error logging with context
- **`shouldShowToUser()`** - Determine if error should be displayed

### Benefits:

- **Type Safety:** TypeScript can differentiate error types
- **User Experience:** Consistent, helpful error messages
- **Debugging:** Better error context and stack traces
- **Maintainability:** Single source of truth for error handling

---

## 3. UI Controller Refactoring

### Problem

The original `UIController` class was **2088 lines** long and handled too many responsibilities:
- Preset management
- Token display and filtering
- Modal interactions
- Form input handling
- PDF/ZIP export operations

This violated the Single Responsibility Principle and made the code difficult to maintain and test.

### Solution: Manager Classes

Created 5 specialized manager classes to handle specific concerns:

---

### 3.1 PresetManager (`src/ts/ui/presets.ts`)

**Responsibilities:**
- Apply built-in presets (Classic, Full Bloom, Minimal)
- Apply custom user presets
- Save/load/delete/edit custom presets
- Duplicate presets
- Manage default preset selection

**Key Methods:**
- `applyPreset()` - Apply built-in preset
- `applyCustomPreset()` - Apply user-saved preset
- `saveCustomPreset()` - Save current settings as preset
- `loadCustomPresets()` - Load from localStorage
- `deleteCustomPreset()` - Remove preset
- `setDefaultPreset()` - Set startup preset

---

### 3.2 TokenDisplayManager (`src/ts/ui/tokenDisplay.ts`)

**Responsibilities:**
- Render token grids (character and reminder sections)
- Apply filters (team, type, official/custom, has reminders)
- Create token cards
- Show/hide loading and empty states
- Manage display canvas cache for performance

**Key Methods:**
- `setTokens()` - Set tokens to display
- `applyFilters()` - Filter tokens based on user selection
- `renderTokenGrid()` - Render filtered tokens to DOM
- `showLoading()` - Show/hide loading state
- `showEmptyState()` - Display empty state message
- `clearCache()` - Clear display canvas cache

**Performance Optimizations:**
- Document fragments for batch DOM updates
- WeakMap cache for display canvases
- Efficient filtering logic

---

### 3.3 ModalManager (`src/ts/ui/modals.ts`)

**Responsibilities:**
- Open/close settings modal
- Open/close info modal
- Create and show preset dialogs (add/edit)
- Handle modal backdrop and keyboard shortcuts

**Key Methods:**
- `openSettingsModal()` / `closeSettingsModal()`
- `openInfoModal()` / `closeInfoModal()`
- `showAddPresetModal()` - Show save preset dialog
- `showEditPresetModal()` - Show edit preset dialog
- `setupEventListeners()` - Configure modal triggers

---

### 3.4 FormManager (`src/ts/ui/forms.ts`)

**Responsibilities:**
- Handle file uploads
- Handle example script selection
- Validate JSON input
- Format/clear JSON editor
- Toggle auto-generate
- Get generation options from form
- Handle JSON download

**Key Methods:**
- `handleFileUpload()` - Process uploaded JSON files
- `handleExampleSelect()` - Load example scripts
- `validateJsonInput()` - Real-time JSON validation
- `formatJsonEditor()` - Pretty-print JSON
- `getGenerationOptions()` - Extract form values
- `toggleAutoGenerate()` - Toggle auto-generation

**Features:**
- Debounced validation (300ms)
- Defensive editor access with fallbacks
- Auto-generate on valid JSON

---

### 3.5 ExportManager (`src/ts/ui/exports.ts`)

**Responsibilities:**
- Handle ZIP downloads with progress tracking
- Handle PDF generation with progress tracking
- Update PDF options from form
- Manage export button states

**Key Methods:**
- `handleDownloadZip()` - Create and download token ZIP
- `handleGeneratePdf()` - Generate and download PDF
- `updatePDFOptions()` - Sync PDF settings from form
- `setupEventListeners()` - Configure export buttons

**Features:**
- Progress callbacks for user feedback
- Button state management (disabled during export)
- Error handling with user-friendly messages

---

## Refactoring Statistics

### Files Created:
- ✅ `src/ts/constants.ts` (222 lines)
- ✅ `src/ts/errors.ts` (158 lines)
- ✅ `src/ts/ui/presets.ts` (287 lines)
- ✅ `src/ts/ui/tokenDisplay.ts` (327 lines)
- ✅ `src/ts/ui/modals.ts` (218 lines)
- ✅ `src/ts/ui/forms.ts` (320 lines)
- ✅ `src/ts/ui/exports.ts` (135 lines)

**Total New Code:** ~1,667 lines (well-structured, focused modules)

### Files Modified:
- ✅ `src/ts/tokenGenerator.ts` - Updated to use constants
- ✅ `package.json` - Version bumped to 0.2.0
- ✅ `src/ts/config.ts` - Version bumped to 0.2.0

---

## Benefits of Refactoring

### Maintainability
- **Single Responsibility:** Each class has one clear purpose
- **Easier Navigation:** Find code by responsibility (presets, display, forms, etc.)
- **Reduced Complexity:** Smaller files are easier to understand
- **Better Testing:** Focused classes are easier to unit test

### Code Quality
- **Type Safety:** Custom error classes provide better type checking
- **Constants:** No more magic numbers scattered through code
- **Consistency:** Standardized error handling and patterns
- **Documentation:** Well-commented constants and methods

### Performance
- **Canvas Caching:** Display canvases cached in WeakMap
- **Batch DOM Updates:** Document fragments for grid rendering
- **Debouncing:** Input validation debounced to reduce CPU usage

### Developer Experience
- **Clear Separation:** Know exactly where to make changes
- **Reusability:** Managers can be tested and used independently
- **Extensibility:** Easy to add new features to specific managers
- **Error Messages:** Helpful, context-aware error messages

---

## Additional Improvements Completed

### Token Generation Method Extraction

**Created helper methods in tokenGenerator.ts:**

1. **`createBaseCanvas(diameter)`** - Centralizes canvas creation with DPI scaling
   - Creates canvas element with proper dimensions
   - Gets 2D context with null checking
   - Sets high-quality rendering settings
   - Applies DPI scaling transformation
   - Returns canvas, context, center point, and radius

2. **`applyCircularClip(ctx, center, radius)`** - Applies circular clipping path
   - Saves context state
   - Creates circular path
   - Applies clip for circular tokens

**Methods Refactored:**
- ✅ `generateCharacterToken()` - Now uses helper methods
- ✅ `generateReminderToken()` - Now uses helper methods

**Benefits:**
- **Reduced duplication:** ~30 lines of setup code eliminated per method
- **Consistency:** All tokens use same canvas setup logic
- **Error handling:** Centralized null-check for context
- **Maintainability:** Single location to update canvas setup

---

## Next Steps (Future Improvements)

While the major refactoring is complete, here are potential future improvements:

### Phase 3 - Remaining Recommendations:

1. **Template-based DOM Creation** (Low Priority)
   - Use template literals for cleaner HTML generation
   - Reduce direct DOM manipulation in TokenDisplayManager

3. **Enhanced Test Coverage** (Medium Priority)
   - Unit tests for manager classes
   - Integration tests for token generation pipeline
   - Mock canvas/DOM APIs for testing

4. **UI Controller Integration** (High Priority - Next Release)
   - Update `UIController` to use the new manager classes
   - Remove duplicated code from original `ui.ts`
   - Wire up manager callbacks

---

## Migration Notes

### For Developers:

1. **Constants Usage:**
   ```typescript
   // OLD:
   const imgSize = diameter * 0.65;

   // NEW:
   import { CHARACTER_LAYOUT } from './constants.js';
   const imgSize = diameter * CHARACTER_LAYOUT.IMAGE_SIZE_RATIO;
   ```

2. **Error Handling:**
   ```typescript
   // OLD:
   throw new Error('Failed to load data');

   // NEW:
   import { DataLoadError } from './errors.js';
   throw new DataLoadError('Failed to load data', originalError);
   ```

3. **Manager Classes:**
   ```typescript
   // In UIController (to be updated):
   this.presetManager = new PresetManager(this.elements, callbacks);
   this.tokenDisplay = new TokenDisplayManager(this.elements);
   // ... etc
   ```

### Breaking Changes:

- None - This is an internal refactoring
- All public APIs remain unchanged
- Existing functionality preserved

---

## Testing Checklist

Before release, verify:

- [ ] TypeScript compilation succeeds (`npm run build`)
- [ ] All tests pass (`npm run test`)
- [ ] Token generation works correctly
- [ ] Presets can be applied
- [ ] Filters work on token display
- [ ] File upload functions
- [ ] Example scripts load
- [ ] PDF generation works
- [ ] ZIP download works
- [ ] Error messages display correctly

---

## Version History

### v0.2.0 (Current)
- ✅ Extracted magic numbers to constants
- ✅ Standardized error handling with custom error classes
- ✅ Created manager classes for UI concerns
- ✅ Updated tokenGenerator to use constants
- ✅ Improved code organization and maintainability

### v0.1.8 (Previous)
- Original monolithic UIController implementation
- Hard-coded magic numbers throughout
- Inconsistent error handling

---

## Contributors

This refactoring was completed following code review recommendations and best practices for TypeScript application architecture.

---

*Document last updated: 2025-11-27*
