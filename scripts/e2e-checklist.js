console.log('\n=== MANUAL E2E TESTING CHECKLIST ===\n');
console.log('Open http://localhost:7221 in your browser and verify:\n');

const checklist = [
  'APPLICATION BASICS',
  '  □ Application loads without console errors',
  '  □ Version number displays correctly',
  '  □ Settings modal opens and closes',
  '',
  'TOKEN GENERATION',
  '  □ Upload example script: Fall_of_Rome.json',
  '  □ Tokens generate successfully',
  '  □ Character tokens render correctly',
  '  □ Reminder tokens render correctly',
  '  □ Meta tokens generate (Pandemonium, Script Name, QR)',
  '',
  'FILTERING',
  '  □ Team filter works (all options)',
  '  □ Token type filter works',
  '  □ Display filter works',
  '',
  'EXPORT',
  '  □ Individual PNG download works',
  '  □ ZIP download works',
  '  □ PDF generation works',
  '  □ PDF layout is correct',
  '',
  'CONFIGURATION',
  '  □ Token diameter changes work',
  '  □ Background changes work',
  '  □ Font selection works',
  '',
  'EDGE CASES',
  '  □ Invalid JSON shows error',
  '  □ Large script handles gracefully',
  '',
];

checklist.forEach(item => console.log(item));
console.log('\nRun: npm run dev');
console.log('to start the development server for testing.\n');
