# UI Unification Migration Plan

> **Purpose**: Step-by-step implementation guide for Claude to unify the UI component system.
> **Estimated Effort**: 15-20 focused implementation sessions
> **Priority**: High - Fixes visual inconsistency and reduces code duplication
> **Status**: ✅ COMPLETE

---

## Implementation Progress

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 1.1 | Create `useModalBehavior` hook | ✅ DONE | `src/hooks/useModalBehavior.ts` |
| 1.2 | Extend `Button` with loading state | ✅ DONE | Added `loading`, `loadingText` props |
| 1.3 | Create `Alert` component | ✅ DONE | `src/components/Shared/Alert.tsx` |
| 2.1 | Create unified `Modal` component | ✅ DONE | `src/components/Shared/Modal/Modal.tsx` |
| 2.2 | Create `ConfirmDialog` component | ✅ DONE | `src/components/Shared/Modal/ConfirmDialog.tsx` |
| 2.3a | Migrate `DeleteProjectModal` | ✅ DONE | Reduced from 197 to 99 lines |
| 2.3b | Migrate `InfoModal` | ✅ DONE | Uses new Modal wrapper |
| 2.3c | Migrate `ConfirmModal` (Presets) | ✅ DONE | Now uses ConfirmDialog |
| 2.3d | Migrate `SettingsModal` | ✅ DONE | Uses new Modal + Button components |
| 2.3e | Migrate `SavePresetModal` | ✅ DONE | Uses Modal, Button, Alert, Input, FormGroup |
| 2.3f | Migrate `EditPresetModal` | ✅ DONE | Uses Modal, Button, Input, FormGroup |
| 2.3g | Migrate `AnnouncementsModal` | ✅ DONE | Uses Modal (53% reduction) |
| 2.3h | Migrate `ImportProjectModal` | ✅ DONE | Uses Modal, Button, Alert |
| 2.3i | Migrate `ExportProjectModal` | ✅ DONE | Uses Modal, Button, Alert |
| 2.3j | Migrate `SyncDetailsModal` | ✅ DONE | Uses Modal, Button, Alert |
| 2.3k | Migrate `IconManagementModal` | ✅ DONE | Uses Modal, Button |
| 2.3l | Migrate `AssetManagerModal` | ✅ DONE | Uses Modal, Button, ConfirmDialog |
| 3.1 | Migrate `EditorView` buttons | ✅ DONE | Uses Button component |
| 3.2 | Migrate `CustomizeView` buttons | ✅ DONE | Uses Button component |
| 3.3 | Migrate `DownloadView` buttons | ✅ DONE | Uses Button component |
| 4.1 | Create `Input` component | ✅ DONE | `src/components/Shared/Form/Input.tsx` |
| 4.2 | Create `Select` component | ✅ DONE | `src/components/Shared/Form/Select.tsx` |
| 4.3 | Create `Checkbox` component | ✅ DONE | `src/components/Shared/Form/Checkbox.tsx` |
| 4.4 | Create `Textarea` component | ✅ DONE | `src/components/Shared/Form/Textarea.tsx` |
| 4.5 | Create `FormGroup` wrapper | ✅ DONE | `src/components/Shared/Form/FormGroup.tsx` |
| 5.1 | Update `SavePresetModal` forms | ✅ DONE | Uses Input, FormGroup |
| 5.2 | Update `EditPresetModal` forms | ✅ DONE | Uses Input, FormGroup |
| 6.1 | Deprecate `buttons.css` | ✅ DONE | Removed ~120 lines of dead CSS |
| 6.2 | Clean modal CSS files | ✅ DONE | Removed overlay/header/footer styles |
| 6.3 | Update barrel exports | ✅ DONE | Form components exported from Shared |

**Files Created:**
- `src/hooks/useModalBehavior.ts`
- `src/components/Shared/Alert.tsx`
- `src/components/Shared/Modal/Modal.tsx`
- `src/components/Shared/Modal/ConfirmDialog.tsx`
- `src/components/Shared/Modal/index.ts`
- `src/styles/components/shared/Modal.module.css`
- `src/styles/components/shared/Alert.module.css`
- `src/components/Shared/Form/Input.tsx`
- `src/components/Shared/Form/Select.tsx`
- `src/components/Shared/Form/Checkbox.tsx`
- `src/components/Shared/Form/Textarea.tsx`
- `src/components/Shared/Form/FormGroup.tsx`
- `src/components/Shared/Form/index.ts`
- `src/styles/components/shared/Form.module.css`

**Files Modified:**
- `src/components/Shared/Button.tsx` - Added loading state
- `src/styles/components/shared/Button.module.css` - Added spinner styles
- `src/components/Shared/index.ts` - Updated exports (fixed duplicate ToastContainer, added Form)
- `src/components/Modals/DeleteProjectModal.tsx` - Migrated
- `src/components/Modals/InfoModal.tsx` - Migrated
- `src/components/Modals/SettingsModal.tsx` - Migrated
- `src/components/Modals/AnnouncementsModal.tsx` - Migrated
- `src/components/Modals/ImportProjectModal.tsx` - Migrated
- `src/components/Modals/ExportProjectModal.tsx` - Migrated
- `src/components/Modals/SyncDetailsModal.tsx` - Migrated
- `src/components/Modals/IconManagementModal.tsx` - Migrated
- `src/components/Modals/AssetManagerModal.tsx` - Migrated
- `src/components/Presets/ConfirmModal.tsx` - Migrated
- `src/components/Presets/SavePresetModal.tsx` - Migrated to use Input, FormGroup
- `src/components/Presets/EditPresetModal.tsx` - Migrated to use Input, FormGroup
- `src/components/Views/EditorView.tsx` - Migrated buttons
- `src/components/Views/CustomizeView.tsx` - Migrated buttons
- `src/components/Views/DownloadView.tsx` - Migrated buttons

**CSS Cleaned Up (Phase 6):**
- `src/styles/base/buttons.css` - Removed all dead button classes (~120 lines)
- `src/styles/components/modals/SyncDetailsModal.module.css` - Removed overlay/header/footer styles (~100 lines)
- `src/styles/components/modals/ExportProjectModal.module.css` - Removed overlay/header/footer/button styles (~100 lines)
- `src/styles/components/modals/ImportProjectModal.module.css` - Removed overlay/header/footer/button styles (~100 lines)
- `src/ts/utils/classNames.ts` - Updated example comment to not reference deprecated button classes

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Foundation Components](#phase-1-foundation-components)
3. [Phase 2: Modal System Unification](#phase-2-modal-system-unification)
4. [Phase 3: Button Migration](#phase-3-button-migration)
5. [Phase 4: Form Components](#phase-4-form-components)
6. [Phase 5: View Components Migration](#phase-5-view-components-migration)
7. [Phase 6: Cleanup](#phase-6-cleanup)
8. [Testing Checklist](#testing-checklist)

---

## Overview

### Current Problems

1. **3 competing button systems**: Global CSS, Modal CSS modules, and unused Button component
2. **9+ modal components** with duplicated escape key/scroll lock logic
3. **40+ unique button class names** with inconsistent styling
4. **Extensive inline styles** in components like `DeleteProjectModal.tsx`
5. **No shared form components** (Input, Select, Checkbox)

### Target Architecture

```
src/components/Shared/
├── Button.tsx          (EXTEND - add loading state, more variants)
├── Modal/
│   ├── Modal.tsx       (NEW - wrapper component)
│   ├── ModalHeader.tsx (NEW)
│   ├── ModalBody.tsx   (NEW)
│   ├── ModalFooter.tsx (NEW)
│   └── useModalBehavior.ts (NEW - hook for escape/scroll)
├── Form/
│   ├── Input.tsx       (NEW)
│   ├── Select.tsx      (NEW)
│   ├── Checkbox.tsx    (NEW)
│   └── FormGroup.tsx   (NEW)
├── Alert.tsx           (NEW - for warnings/errors)
├── OptionGroup.tsx     (EXISTS - keep)
├── SegmentedControl.tsx (EXISTS - keep)
└── Toast.tsx           (EXISTS - keep)
```

---

## Phase 1: Foundation Components

### Task 1.1: Create useModalBehavior Hook

**File**: `src/hooks/useModalBehavior.ts`

```typescript
import { useEffect, useCallback } from 'react'

interface UseModalBehaviorOptions {
  isOpen: boolean
  onClose: () => void
  closeOnEscape?: boolean
  closeOnBackdrop?: boolean
  preventClose?: boolean // For loading states
}

export function useModalBehavior({
  isOpen,
  onClose,
  closeOnEscape = true,
  closeOnBackdrop = true,
  preventClose = false,
}: UseModalBehaviorOptions) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventClose) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape, preventClose])

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow || 'unset'
      }
    }
  }, [isOpen])

  // Backdrop click handler
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && closeOnBackdrop && !preventClose) {
        onClose()
      }
    },
    [onClose, closeOnBackdrop, preventClose]
  )

  return { handleBackdropClick }
}
```

**Why**: Eliminates 50+ lines of duplicated code across 9 modals.

---

### Task 1.2: Extend Button Component

**File**: `src/components/Shared/Button.tsx`

Add to existing component:

```typescript
// ADD these props to ButtonProps interface
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  isIconOnly?: boolean
  fullWidth?: boolean
  loading?: boolean        // NEW
  loadingText?: string     // NEW
  children?: ReactNode
}

// ADD loading variant styles in Button.module.css
// UPDATE the component to handle loading state:
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'medium',
      icon,
      iconPosition = 'left',
      isIconOnly = false,
      fullWidth = false,
      loading = false,
      loadingText,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      styles.button,
      variantClasses[variant],
      sizeClasses[size],
      isIconOnly && styles.iconOnly,
      fullWidth && styles.fullWidth,
      loading && styles.loading,
      className,
    )

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {icon && !loading && (
          <span className={`${styles.icon} ${iconPosition === 'left' ? styles.iconLeft : styles.iconRight}`}>
            {icon}
          </span>
        )}
        {loading && loadingText ? loadingText : children}
      </button>
    )
  }
)
```

**Add to Button.module.css**:

```css
/* Loading state */
.loading {
  position: relative;
  color: transparent;
}

.loading > *:not(.spinner) {
  visibility: hidden;
}

.spinner {
  position: absolute;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Ensure loading text is visible */
.loading.hasLoadingText {
  color: inherit;
}

.loading.hasLoadingText > *:not(.spinner) {
  visibility: visible;
}
```

---

### Task 1.3: Create Alert Component

**File**: `src/components/Shared/Alert.tsx`

```typescript
import { ReactNode } from 'react'
import { cn } from '../../ts/utils'
import styles from '../../styles/components/shared/Alert.module.css'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  className?: string
  icon?: ReactNode
}

const defaultIcons: Record<AlertVariant, string> = {
  info: 'i',
  success: '✓',
  warning: '⚠',
  error: '✕',
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  icon
}: AlertProps) {
  return (
    <div
      className={cn(styles.alert, styles[variant], className)}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon ?? defaultIcons[variant]}
      </span>
      <div className={styles.content}>
        {title && <strong className={styles.title}>{title}</strong>}
        <div className={styles.message}>{children}</div>
      </div>
    </div>
  )
}
```

**File**: `src/styles/components/shared/Alert.module.css`

```css
.alert {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  line-height: 1.5;
}

.icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.content {
  flex: 1;
  min-width: 0;
}

.title {
  display: block;
  margin-bottom: 0.25rem;
}

/* Variants */
.info {
  background-color: rgba(52, 152, 219, 0.15);
  border: 1px solid var(--color-info);
  color: var(--color-info);
}

.success {
  background-color: rgba(39, 174, 96, 0.15);
  border: 1px solid var(--color-success);
  color: var(--color-success);
}

.warning {
  background-color: rgba(243, 156, 18, 0.15);
  border: 1px solid var(--color-warning);
  color: #b7791f; /* Darker for readability */
}

.error {
  background-color: rgba(231, 76, 60, 0.15);
  border: 1px solid var(--color-error);
  color: var(--color-error);
}
```

---

## Phase 2: Modal System Unification

### Task 2.1: Create Modal Component

**File**: `src/components/Shared/Modal/Modal.tsx`

```typescript
import { ReactNode } from 'react'
import { useModalBehavior } from '../../../hooks/useModalBehavior'
import { cn } from '../../../ts/utils'
import styles from '../../../styles/components/shared/Modal.module.css'

type ModalSize = 'small' | 'medium' | 'large' | 'xlarge' | 'full'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: ModalSize
  children: ReactNode
  footer?: ReactNode
  preventClose?: boolean
  className?: string
  'aria-describedby'?: string
}

const sizeClasses: Record<ModalSize, string> = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
  xlarge: styles.sizeXLarge,
  full: styles.sizeFull,
}

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'medium',
  children,
  footer,
  preventClose = false,
  className,
  'aria-describedby': ariaDescribedBy,
}: ModalProps) {
  const { handleBackdropClick } = useModalBehavior({
    isOpen,
    onClose,
    preventClose,
  })

  if (!isOpen) return null

  const titleId = `modal-title-${title.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={ariaDescribedBy}
    >
      <div className={styles.backdrop} onClick={handleBackdropClick} />
      <div className={cn(styles.container, sizeClasses[size], className)}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={preventClose}
            aria-label="Close modal"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Convenience sub-components for complex modals
Modal.Header = function ModalHeader({ children }: { children: ReactNode }) {
  return <div className={styles.customHeader}>{children}</div>
}

Modal.Body = function ModalBody({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return <div className={cn(styles.body, compact && styles.bodyCompact)}>{children}</div>
}

Modal.Footer = function ModalFooter({
  children,
  align = 'end'
}: {
  children: ReactNode
  align?: 'start' | 'center' | 'end' | 'between'
}) {
  const alignClass = {
    start: styles.footerStart,
    center: styles.footerCenter,
    end: styles.footerEnd,
    between: styles.footerBetween,
  }[align]

  return <div className={cn(styles.footer, alignClass)}>{children}</div>
}
```

**File**: `src/styles/components/shared/Modal.module.css`

```css
/* ============================================
   Unified Modal Component Styles
   ============================================ */

.overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
}

.container {
  position: relative;
  background-color: var(--bg-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.2s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Size Variants */
.sizeSmall { width: 90%; max-width: 360px; }
.sizeMedium { width: 90%; max-width: 480px; }
.sizeLarge { width: 90%; max-width: 640px; }
.sizeXLarge { width: 90%; max-width: 800px; }
.sizeFull { width: 95vw; max-width: 95vw; max-height: 95vh; }

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.title {
  font-size: 1.125rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent);
  margin: 0;
}

.closeButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: none;
  border: none;
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.closeButton:hover:not(:disabled) {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

.closeButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.closeButton:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Body */
.body {
  padding: var(--spacing-lg);
}

.bodyCompact {
  padding: var(--spacing-md);
}

/* Footer */
.footer {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.footerStart { justify-content: flex-start; }
.footerCenter { justify-content: center; }
.footerEnd { justify-content: flex-end; }
.footerBetween { justify-content: space-between; }
```

---

### Task 2.2: Create ConfirmDialog Component

**File**: `src/components/Shared/Modal/ConfirmDialog.tsx`

A specialized modal for confirmations (replaces `ConfirmModal.tsx` in Presets):

```typescript
import { Modal } from './Modal'
import { Button } from '../Button'
import { Alert } from '../Alert'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  loading?: boolean
  warning?: string
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  warning,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      preventClose={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            loadingText="Processing..."
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{message}</p>
      {warning && (
        <Alert variant="warning" style={{ marginTop: 'var(--spacing-md)' }}>
          {warning}
        </Alert>
      )}
    </Modal>
  )
}
```

---

### Task 2.3: Migrate Modals (One by One)

**Migration Order** (easiest to hardest):

1. `InfoModal.tsx` - Simplest, no form elements
2. `ConfirmModal.tsx` (Presets) - Replace with ConfirmDialog
3. `DeleteProjectModal.tsx` - Has inline styles to remove
4. `SettingsModal.tsx` - Medium complexity
5. `SavePresetModal.tsx` - Has form and drag/drop
6. `EditPresetModal.tsx` - Has form
7. `ExportProjectModal.tsx` - Has own CSS module
8. `ImportProjectModal.tsx` - Has form and file upload
9. `SyncDetailsModal.tsx` - Complex UI
10. `AssetManagerModal.tsx` - Complex with file browser
11. `IconManagementModal.tsx` - Complex with grid

**Example Migration: DeleteProjectModal.tsx**

```typescript
// BEFORE: ~195 lines with inline styles and duplicated logic

// AFTER: ~60 lines
import { useState } from 'react'
import { useProjects } from '../../hooks/useProjects'
import { useToast } from '../../contexts/ToastContext'
import { Modal } from '../Shared/Modal/Modal'
import { Button } from '../Shared/Button'
import { Alert } from '../Shared/Alert'
import type { Project } from '../../ts/types/project.js'

interface DeleteProjectModalProps {
  isOpen: boolean
  project: Project | null
  onClose: () => void
  onSuccess?: () => void
}

export function DeleteProjectModal({
  isOpen,
  project,
  onClose,
  onSuccess,
}: DeleteProjectModalProps) {
  const { deleteProject, isLoading } = useProjects()
  const { addToast } = useToast()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!project) return
    try {
      setError(null)
      await deleteProject(project.id)
      addToast(`Project "${project.name}" deleted successfully`, 'success')
      onSuccess?.()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete project'
      setError(msg)
      addToast(msg, 'error')
    }
  }

  if (!project) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Project"
      size="small"
      preventClose={isLoading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={isLoading}
            loadingText="Deleting..."
          >
            Delete Project
          </Button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
        Are you sure you want to delete <strong>"{project.name}"</strong>?
      </p>

      <Alert variant="warning" title="Warning">
        This action cannot be undone. All project data, including custom icons
        and snapshots, will be permanently deleted.
      </Alert>

      {error && (
        <Alert variant="error" style={{ marginTop: 'var(--spacing-md)' }}>
          {error}
        </Alert>
      )}
    </Modal>
  )
}
```

---

## Phase 3: Button Migration

### Task 3.1: Update EditorView.tsx

Replace all `btn-primary` and `btn-secondary` global classes with `<Button>` component.

**File**: `src/components/Views/EditorView.tsx`

**Changes**:

```typescript
// ADD import
import { Button } from '../Shared/Button'

// REPLACE (around line 264-268)
// BEFORE:
<button className={`btn-secondary ${styles.btnLeftPanelAction}`} onClick={onCreateProject}>
  Create New Project
</button>

// AFTER:
<Button variant="secondary" fullWidth onClick={onCreateProject}>
  Create New Project
</Button>

// REPLACE (around line 302-307)
// BEFORE:
<button className={`btn-primary ${styles.btnLeftPanelAction}`} onClick={onNavigateToCustomize}>
  Create New Character
</button>

// AFTER:
<Button variant="primary" fullWidth onClick={onNavigateToCustomize}>
  Create New Character
</Button>

// Continue for all buttons...
```

**Pattern**: Find all `className="btn-*"` or `className={\`btn-*` and replace.

---

### Task 3.2: Update CustomizeView.tsx

Same pattern as EditorView.

---

### Task 3.3: Update DownloadView.tsx

Same pattern as EditorView.

---

### Task 3.4: Update Modal Buttons

After Modal wrapper is in place, update all modal footers to use:

```typescript
footer={
  <>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={onSave}>Save</Button>
  </>
}
```

---

## Phase 4: Form Components

### Task 4.1: Create Input Component

**File**: `src/components/Shared/Form/Input.tsx`

```typescript
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../../ts/utils'
import styles from '../../../styles/components/shared/Form.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={cn(styles.formGroup, error && styles.hasError, className)}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {leftIcon && <span className={styles.inputIconLeft}>{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              styles.input,
              leftIcon && styles.hasLeftIcon,
              rightIcon && styles.hasRightIcon
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
            {...props}
          />
          {rightIcon && <span className={styles.inputIconRight}>{rightIcon}</span>}
        </div>
        {error && (
          <span id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
        {helpText && !error && (
          <span id={`${inputId}-help`} className={styles.helpText}>
            {helpText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

### Task 4.2: Create Select Component

**File**: `src/components/Shared/Form/Select.tsx`

```typescript
import { forwardRef, SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../../ts/utils'
import styles from '../../../styles/components/shared/Form.module.css'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  helpText?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, error, helpText, className, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={cn(styles.formGroup, error && styles.hasError, className)}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={styles.select}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className={styles.errorText}>{error}</span>}
        {helpText && !error && <span className={styles.helpText}>{helpText}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'
```

### Task 4.3: Create Checkbox Component

**File**: `src/components/Shared/Form/Checkbox.tsx`

```typescript
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../../ts/utils'
import styles from '../../../styles/components/shared/Form.module.css'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <label className={cn(styles.checkboxWrapper, className)}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={styles.checkbox}
          {...props}
        />
        <div className={styles.checkboxContent}>
          <span className={styles.checkboxLabel}>{label}</span>
          {description && (
            <span className={styles.checkboxDescription}>{description}</span>
          )}
        </div>
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
```

### Task 4.4: Create Form.module.css

**File**: `src/styles/components/shared/Form.module.css`

```css
/* ============================================
   Unified Form Component Styles
   ============================================ */

/* Form Group */
.formGroup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.formGroup + .formGroup {
  margin-top: var(--spacing-md);
}

/* Labels */
.label {
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

/* Input Wrapper (for icons) */
.inputWrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* Input & Select Base */
.input,
.select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input:focus,
.select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.2);
}

.input:disabled,
.select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input::placeholder {
  color: var(--text-muted);
}

/* Input with icons */
.hasLeftIcon {
  padding-left: 2.5rem;
}

.hasRightIcon {
  padding-right: 2.5rem;
}

.inputIconLeft,
.inputIconRight {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 100%;
  color: var(--text-muted);
  pointer-events: none;
}

.inputIconLeft {
  left: 0;
}

.inputIconRight {
  right: 0;
}

/* Error State */
.hasError .input,
.hasError .select {
  border-color: var(--color-error);
}

.hasError .input:focus,
.hasError .select:focus {
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
}

/* Help & Error Text */
.helpText,
.errorText {
  font-size: 0.75rem;
  line-height: 1.4;
}

.helpText {
  color: var(--text-secondary);
}

.errorText {
  color: var(--color-error);
}

/* Checkbox */
.checkboxWrapper {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.checkboxWrapper:has(.checkbox:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox {
  flex-shrink: 0;
  width: 1.125rem;
  height: 1.125rem;
  margin-top: 0.125rem;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.checkbox:disabled {
  cursor: not-allowed;
}

.checkboxContent {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.checkboxLabel {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.checkboxDescription {
  font-size: 0.75rem;
  color: var(--text-secondary);
}
```

---

## Phase 5: View Components Migration

### Task 5.1: Update SettingsModal

Replace inline form elements with new components:

```typescript
// BEFORE:
<select className={styles.selectInput} ...>

// AFTER:
import { Select } from '../Shared/Form/Select'
<Select
  label="Image Quality (DPI)"
  helpText="Higher DPI creates larger, more detailed token images"
  options={[
    { value: '300', label: '300 DPI (Standard)' },
    { value: '600', label: '600 DPI (High Quality)' },
  ]}
  value={generationOptions.dpi.toString()}
  onChange={(e) => updateGenerationOptions({ dpi: parseInt(e.target.value) })}
/>
```

### Task 5.2: Update ExportProjectModal

Replace custom checkbox pattern with Checkbox component:

```typescript
// BEFORE:
<label className={styles.option}>
  <input type="checkbox" checked={options.includeCustomIcons} .../>
  <div className={styles.optionContent}>
    <span className={styles.optionLabel}>Include Custom Icons</span>
    <span className={styles.optionDescription}>...</span>
  </div>
</label>

// AFTER:
import { Checkbox } from '../Shared/Form/Checkbox'
<Checkbox
  label="Include Custom Icons"
  description={`${project.state.customIcons?.length || 0} custom icon(s)`}
  checked={options.includeCustomIcons}
  onChange={(e) => setOptions(prev => ({ ...prev, includeCustomIcons: e.target.checked }))}
  disabled={isExporting || !project.state.customIcons?.length}
/>
```

---

## Phase 6: Cleanup

### Task 6.1: Remove Duplicate CSS

After all migrations complete:

1. **Delete or clean**: `src/styles/base/buttons.css`
   - Remove `.btn-primary`, `.btn-secondary`, `.btn-danger` classes
   - Keep any truly global styles if needed

2. **Clean**: `src/styles/components/layout/Modal.module.css`
   - Remove `.primaryBtn`, `.secondaryBtn`, `.btnDanger`, `.btnSecondary`
   - Keep modal-specific layout styles

3. **Consolidate**: Individual modal CSS modules
   - `ExportProjectModal.module.css` - can likely be removed entirely
   - Keep only unique layout styles, move common patterns to shared

### Task 6.2: Update Barrel Exports

**File**: `src/components/Shared/index.ts`

```typescript
// Buttons
export { Button, ToggleButton, ButtonGroup } from './Button'

// Modal
export { Modal } from './Modal/Modal'
export { ConfirmDialog } from './Modal/ConfirmDialog'

// Form
export { Input } from './Form/Input'
export { Select } from './Form/Select'
export { Checkbox } from './Form/Checkbox'

// Feedback
export { Alert } from './Alert'
export { Toast } from './Toast'

// Layout
export { OptionGroup } from './OptionGroup'
export { SegmentedControl } from './SegmentedControl'
```

### Task 6.3: Run CSS Purge Check

```bash
# Find unused CSS classes
npx purgecss --css "src/styles/**/*.css" --content "src/**/*.tsx" --output purge-report
```

---

## Testing Checklist

### Visual Regression Testing

For each migrated component, verify:

- [ ] Button hover states work correctly
- [ ] Button disabled states are visually distinct
- [ ] Button loading states show spinner
- [ ] Modal opens/closes with animation
- [ ] Modal closes on Escape key
- [ ] Modal closes on backdrop click
- [ ] Modal prevents scroll on body
- [ ] Form inputs focus states show accent color
- [ ] Form error states show red border
- [ ] Alert variants display correct colors
- [ ] Responsive behavior on mobile widths

### Functionality Testing

- [ ] All button click handlers fire correctly
- [ ] Modal form submissions work
- [ ] Modal cancel buttons work
- [ ] Keyboard navigation (Tab, Enter, Escape) works
- [ ] Screen reader announces modal title
- [ ] Screen reader announces form errors

### Integration Testing

Run the existing test suite after each phase:

```bash
npm run test
npm run build
```

---

## Migration Order Summary

| Phase | Priority | Files | Estimated Work |
|-------|----------|-------|----------------|
| 1.1 | CRITICAL | useModalBehavior.ts | 1 session |
| 1.2 | CRITICAL | Button.tsx (extend) | 1 session |
| 1.3 | HIGH | Alert.tsx | 1 session |
| 2.1 | CRITICAL | Modal.tsx | 1 session |
| 2.2 | HIGH | ConfirmDialog.tsx | 1 session |
| 2.3 | HIGH | Migrate 11 modals | 4-5 sessions |
| 3.x | MEDIUM | Migrate view buttons | 2-3 sessions |
| 4.x | MEDIUM | Form components | 2 sessions |
| 5.x | LOW | Update forms in views | 2-3 sessions |
| 6.x | LOW | Cleanup CSS | 1 session |

**Total: ~15-20 sessions**

---

## Notes for Implementation

1. **Test after each file change** - Run `npm run build` to catch TypeScript errors
2. **Keep old code until verified** - Comment out rather than delete initially
3. **One component at a time** - Don't try to migrate multiple modals in parallel
4. **Preserve accessibility** - Maintain all `aria-*` attributes during migration
5. **Check for regressions** - Test the UI manually after each migration

---

*Generated: UI Unification Analysis*
*Last Updated: Phase 1 Ready for Implementation*
