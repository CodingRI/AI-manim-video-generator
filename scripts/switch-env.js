const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (target !== 'dev' && target !== 'prod') {
  console.error('Usage: node scripts/switch-env.js [dev|prod]');
  process.exit(1);
}

const sourceFile = target === 'dev' ? '.env.dev' : '.env.prod';
const destFile = '.env';

const sourcePath = path.resolve(__dirname, '..', sourceFile);
const destPath = path.resolve(__dirname, '..', destFile);

if (!fs.existsSync(sourcePath)) {
  console.error(`Source file ${sourceFile} does not exist at ${sourcePath}`);
  process.exit(1);
}

try {
  fs.copyFileSync(sourcePath, destPath);
  console.log(`Successfully switched to ${target} environment (${sourceFile} -> ${destFile})`);
} catch (err) {
  console.error('Failed to copy environment file:', err);
  process.exit(1);
}
