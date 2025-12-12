const fs = require('fs');
const path = require('path');

console.log('Adding StudioDebugger to StudioView...\n');

const filePath = path.join(__dirname, 'src/components/Studio/StudioView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import
if (!content.includes('StudioDebugger')) {
  content = content.replace(
    "import { applyCorsProxy } from '../../ts/utils/imageUtils';",
    "import { applyCorsProxy } from '../../ts/utils/imageUtils';\nimport { StudioDebugger } from '../Debug/StudioDebugger';"
  );
  console.log('✓ Added import');
} else {
  console.log('⚠ Import already exists');
}

// Add component - find the closing </ViewLayout> tag
if (!content.includes('<StudioDebugger />')) {
  // Find the last occurrence of </ViewLayout>
  const layoutEndIndex = content.lastIndexOf('</ViewLayout>');
  if (layoutEndIndex !== -1) {
    content = content.slice(0, layoutEndIndex) +
              '      <StudioDebugger />\n      ' +
              content.slice(layoutEndIndex);
    console.log('✓ Added <StudioDebugger /> component');
  } else {
    console.log('✗ Could not find </ViewLayout> tag');
  }
} else {
  console.log('⚠ Component already added');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✓ Done! Restart your dev server and check the browser.');
