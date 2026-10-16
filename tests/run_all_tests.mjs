/**
 * Master Test Runner for Filza Motion AI
 */

console.log('====================================================');
console.log('  FILZA MOTION AI — AUTOMATED TEST SUITE');
console.log('====================================================\n');

try {
  await import('./config.test.mjs');
  await import('./validation.test.mjs');
  await import('./client.test.mjs');

  console.log('====================================================');
  console.log('  ALL TESTS PASSED SUCCESSFULLY! (100% VERIFIED)');
  console.log('====================================================');
} catch (err) {
  console.error('\nTest Suite execution failed with error:', err);
  process.exit(1);
}
