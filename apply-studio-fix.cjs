/**
 * Script to apply Studio live update fix
 * Run with: node apply-studio-fix.js
 */

const fs = require('fs');
const path = require('path');

const STUDIO_CONTEXT_PATH = path.join(__dirname, 'src/contexts/StudioContext.tsx');

console.log('Applying Studio live update fix...\n');

// Read the file
let content = fs.readFileSync(STUDIO_CONTEXT_PATH, 'utf8');
let changesMade = 0;

// Fix 1: Update updateLayer function
const oldUpdateLayer = `  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === id ? { ...layer, ...updates } : layer
      )
    );
    setIsDirty(true);
  }, []);`;

const newUpdateLayer = `  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
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
  }, []);`;

if (content.includes(oldUpdateLayer)) {
  content = content.replace(oldUpdateLayer, newUpdateLayer);
  console.log('✓ Fixed updateLayer function');
  changesMade++;
} else {
  console.log('⚠ updateLayer function already updated or not found');
}

// Fix 2: Add version to duplicateLayer (around line 315)
content = content.replace(
  /name: `\$\{layerToDuplicate\.name\} Copy`,\s+canvas: cloneCanvas\(layerToDuplicate\.canvas\),\s+zIndex: layerToDuplicate\.zIndex \+ 1,/,
  `name: \`\${layerToDuplicate.name} Copy\`,
        canvas: cloneCanvas(layerToDuplicate.canvas),
        version: 0,  // New layer starts with version 0
        zIndex: layerToDuplicate.zIndex + 1,`
);

// Fix 3: Add version to mergeLayerDown (around line 361)
content = content.replace(
  /canvas: mergedCanvas,\s+name: `\$\{layer\.name\} \+ \$\{currentLayer\.name\}`,/,
  `canvas: mergedCanvas,
            name: \`\${layer.name} + \${currentLayer.name}\`,
            version: (layer.version || 0) + 1,  // Increment version for merged layer`
);

// Fix 4: Add version to flattenAllLayers (around line 395)
content = content.replace(
  /zIndex: 0,\s+canvas: flatCanvas,\s+position: \{ x: 0, y: 0 \},/,
  `zIndex: 0,
      canvas: flatCanvas,
      version: 0,  // New layer starts with version 0
      position: { x: 0, y: 0 },`
);

// Fix 5: Add version to loadFromImage (around line 579)
content = content.replace(
  /zIndex: layers\.length,\s+canvas,\s+position: \{ x: 0, y: 0 \},/,
  `zIndex: layers.length,
        canvas,
        version: 0,  // New layer starts with version 0
        position: { x: 0, y: 0 },`
);

// Write the file back
fs.writeFileSync(STUDIO_CONTEXT_PATH, content, 'utf8');

console.log(`\n✓ Applied ${changesMade > 0 ? changesMade : 'all'} fixes to StudioContext.tsx`);
console.log('\nNext steps:');
console.log('1. Run: npm run build');
console.log('2. If build succeeds, restart your dev server');
console.log('3. Test the invert button - you should see live updates!');
