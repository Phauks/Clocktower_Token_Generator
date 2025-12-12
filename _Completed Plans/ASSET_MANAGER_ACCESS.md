# Asset Manager - Access Guide

**Last Updated**: December 10, 2025
**Status**: ✅ Consolidated - Single access point implemented

---

## 📍 How to Access Asset Manager

### **Single, Consolidated Access Point**

The Asset Manager is accessible via **one location only** for a unified workflow:

**Header Button (Always Visible)** 📷

- **Location**: Top-right corner of the header (first action button)
- **Icon**: Image/gallery icon
- **Tooltip**: "Asset Manager - Manage uploaded assets"
- **Availability**: **Always accessible from any view** (Gallery, Customize, Editor, Projects, etc.)

---

## ✨ Features

When you click the Asset Manager button, you get access to:

✅ **Upload Assets**
- Character icons
- Token backgrounds
- Script backgrounds
- Logos, leaves, setup flowers
- Studio assets

✅ **Browse & Filter**
- Filter by asset type
- Filter by scope (project/global)
- Search by name
- Sort by various criteria

✅ **Bulk Operations**
- Delete multiple assets
- Promote to global
- Move to project
- Batch management

✅ **Organization**
- View asset metadata
- Track usage statistics
- See linked characters/projects
- Preview with thumbnails

---

## 🎯 Workflow

1. **Click** the 📷 icon in the top-right header
2. **Browse** existing assets or upload new ones
3. **Select/Edit/Delete** assets as needed
4. **Close** the modal when done

You stay in your current view - no need to navigate away from your work!

---

## ⚠️ Important Notes

- **Studio Tab ≠ Asset Manager**: The "Studio" tab in the main navigation is for token design/canvas tools, **NOT** asset management
- **All asset management** happens through the header button
- **Always available**: No matter which tab you're on, the Asset Manager button is always visible
- **Studio-specific asset browser removed**: The "Browse" button previously in Studio toolbar has been removed to prevent confusion and ensure a single consolidated workflow

---

## 📝 Implementation Details

**Files Modified**:
- Button: `src/components/Layout/AppHeader.tsx` (Added Asset Manager button)
- Modal: `src/components/Modals/AssetManagerModal.tsx` (Existing modal)
- State: `src/App.tsx` (Added modal state management)
- Studio: `src/components/Studio/StudioToolbar.tsx` (Removed "Browse" button and AssetBrowser)

**Integration**: The Asset Manager is integrated with the current project context, automatically filtering assets relevant to your active project.

**Removed Duplicate Access**:
- ❌ Studio "Browse" button (removed from StudioToolbar.tsx)
- ❌ Studio AssetBrowser component (no longer imported or used)

---

**Asset management = One button, one interface, always accessible.** ✨

## ✅ Consolidation Complete

All asset management functionality is now accessible through a **single, unified interface**:
- ✅ Header button added and always visible
- ✅ Studio-specific asset browser removed
- ✅ No duplicate interfaces
- ✅ Clean, consolidated workflow

**Studio is now purely for token design/canvas work:**
- ✨ New Project
- 📁 Import Image
- 📝 Logo Wizard
- 💾 Save Asset
- Canvas editing tools

