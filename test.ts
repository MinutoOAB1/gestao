try {
  require('./api/index.ts');
  console.log('SUCCESS');
} catch (e) {
  console.error('CRASH:', e);
}
