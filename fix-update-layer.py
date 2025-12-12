#!/usr/bin/env python3
"""Fix the updateLayer function to auto-increment version"""

import re

# Read the file
with open('src/contexts/StudioContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the pattern and replacement
old_pattern = r'''  const updateLayer = useCallback\(\(id: string, updates: Partial<Layer>\) => \{
    setLayers\(prev =>
      prev\.map\(layer =>
        layer\.id === id \? \{ \.\.\.layer, \.\.\.updates \} : layer
      \)
    \);
    setIsDirty\(true\);
  \}, \[\]\);'''

new_code = '''  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev =>
      prev.map(layer => {
        if (layer.id !== id) return layer;

        // Auto-increment version if canvas is being updated to force React re-renders
        // This ensures that even when the canvas reference stays the same but pixels change,
        // React will detect the update and trigger composition
        const newUpdates = updates.canvas
          ? { ...updates, version: (updates.version ?? (layer.version || 0) + 1) }
          : updates;

        return { ...layer, ...newUpdates };
      })
    );
    setIsDirty(true);
  }, []);'''

# Replace
new_content = re.sub(old_pattern, new_code, content, flags=re.MULTILINE)

if new_content != content:
    # Write back
    with open('src/contexts/StudioContext.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('✓ Fixed updateLayer function')
else:
    print('⚠ Pattern not found - trying manual search...')

    # Try to find the function manually
    if 'const updateLayer = useCallback((id: string, updates: Partial<Layer>)' in content:
        print('  Found updateLayer function')
        if 'const newUpdates = updates.canvas' in content:
            print('  ✓ Already patched!')
        else:
            print('  ✗ Not patched - manual intervention needed')
