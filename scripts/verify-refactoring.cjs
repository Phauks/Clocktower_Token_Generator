/**
 * Refactoring Verification Script
 *
 * Verifies that all refactored imports and exports are correctly configured.
 * Run with: node scripts/verify-refactoring.js
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, symbol, message) {
  console.log(`${color}${symbol} ${message}${COLORS.reset}`);
}

function success(message) {
  log(COLORS.green, '✓', message);
}

function error(message) {
  log(COLORS.red, '✗', message);
}

function warning(message) {
  log(COLORS.yellow, '⚠', message);
}

function info(message) {
  log(COLORS.blue, 'ℹ', message);
}

function section(message) {
  console.log();
  log(COLORS.cyan, '━', `━━━ ${message} ━━━`);
}

// Check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// Check if file contains pattern
function fileContains(filePath, pattern) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return new RegExp(pattern).test(content);
  } catch {
    return false;
  }
}

// Verification tests
const verifications = {
  'New Hooks Created': {
    tests: [
      {
        name: 'useProjectCacheWarming.ts exists',
        check: () => fileExists('src/hooks/useProjectCacheWarming.ts')
      },
      {
        name: 'useTokenDeletion.ts exists',
        check: () => fileExists('src/hooks/useTokenDeletion.ts')
      },
      {
        name: 'useTokenGrouping.ts exists',
        check: () => fileExists('src/hooks/useTokenGrouping.ts')
      },
      {
        name: 'useStudioNavigation.ts exists',
        check: () => fileExists('src/hooks/useStudioNavigation.ts')
      }
    ]
  },

  'Barrel Exports': {
    tests: [
      {
        name: 'src/hooks/index.ts exists',
        check: () => fileExists('src/hooks/index.ts')
      },
      {
        name: 'useProjectCacheWarming exported from hooks/index.ts',
        check: () => fileContains('src/hooks/index.ts', 'useProjectCacheWarming')
      },
      {
        name: 'useTokenDeletion exported from hooks/index.ts',
        check: () => fileContains('src/hooks/index.ts', 'useTokenDeletion')
      },
      {
        name: 'useTokenGrouping exported from hooks/index.ts',
        check: () => fileContains('src/hooks/index.ts', 'useTokenGrouping')
      },
      {
        name: 'useStudioNavigation exported from hooks/index.ts',
        check: () => fileContains('src/hooks/index.ts', 'useStudioNavigation')
      },
      {
        name: 'logger exported from utils/index.ts',
        check: () => fileContains('src/ts/utils/index.ts', 'logger')
      },
      {
        name: 'handleAsyncOperation exported from utils/index.ts',
        check: () => fileContains('src/ts/utils/index.ts', 'handleAsyncOperation')
      }
    ]
  },

  'Component Migrations': {
    tests: [
      {
        name: 'ProjectContext uses useProjectCacheWarming',
        check: () => fileContains('src/contexts/ProjectContext.tsx', 'useProjectCacheWarming')
      },
      {
        name: 'ProjectContext no longer has inline cache warming',
        check: () => !fileContains('src/contexts/ProjectContext.tsx', 'warmingPolicyManager\\.warm')
      },
      {
        name: 'TokenGrid uses useTokenDeletion',
        check: () => fileContains('src/components/TokenGrid/TokenGrid.tsx', 'useTokenDeletion')
      },
      {
        name: 'TokenGrid uses useTokenGrouping',
        check: () => fileContains('src/components/TokenGrid/TokenGrid.tsx', 'useTokenGrouping')
      },
      {
        name: 'TokenGrid uses useStudioNavigation',
        check: () => fileContains('src/components/TokenGrid/TokenGrid.tsx', 'useStudioNavigation')
      },
      {
        name: 'TokenGrid no longer has inline deletion logic',
        check: () => !fileContains('src/components/TokenGrid/TokenGrid.tsx', 'const \\[tokenToDelete, setTokenToDelete\\]')
      }
    ]
  },

  'Logger Migration': {
    tests: [
      {
        name: 'useProjects imports logger',
        check: () => fileContains('src/hooks/useProjects.ts', 'import.*logger')
      },
      {
        name: 'useProjects imports handleAsyncOperation',
        check: () => fileContains('src/hooks/useProjects.ts', 'import.*handleAsyncOperation')
      },
      {
        name: 'useProjects uses handleAsyncOperation',
        check: () => fileContains('src/hooks/useProjects.ts', 'handleAsyncOperation\\(')
      },
      {
        name: 'useProjects no longer has raw console.error',
        check: () => !fileContains('src/hooks/useProjects.ts', 'console\\.error')
      },
      {
        name: 'EditorView imports logger',
        check: () => fileContains('src/components/Views/EditorView.tsx', 'import.*logger')
      },
      {
        name: 'ImportProjectModal imports logger',
        check: () => fileContains('src/components/Modals/ImportProjectModal.tsx', 'import.*logger')
      }
    ]
  },

  'Documentation': {
    tests: [
      {
        name: 'REFACTORING_GUIDE.md exists',
        check: () => fileExists('REFACTORING_GUIDE.md')
      },
      {
        name: 'REFACTORING_PROGRESS.md exists',
        check: () => fileExists('REFACTORING_PROGRESS.md')
      },
      {
        name: 'CLAUDE.md mentions refactoring patterns',
        check: () => fileContains('CLAUDE.md', 'Refactoring|refactoring')
      }
    ]
  }
};

// Run verifications
function runVerifications() {
  console.log();
  info('Starting Refactoring Verification...');
  console.log();

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const [sectionName, { tests }] of Object.entries(verifications)) {
    section(sectionName);

    for (const test of tests) {
      totalTests++;
      const passed = test.check();

      if (passed) {
        success(test.name);
        passedTests++;
      } else {
        error(test.name);
        failedTests++;
      }
    }
  }

  // Summary
  section('Summary');
  console.log();
  console.log(`  Total Tests:  ${totalTests}`);
  success(`Passed:       ${passedTests}`);

  if (failedTests > 0) {
    error(`Failed:       ${failedTests}`);
    console.log();
    process.exit(1);
  } else {
    console.log();
    success('✨ All verifications passed! Refactoring is correctly configured.');
    console.log();
    process.exit(0);
  }
}

// Run the script
runVerifications();
