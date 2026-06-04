const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'public');
const destDir = path.join(__dirname, 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all files from public to dist
const files = fs.readdirSync(srcDir);
for (const file of files) {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(destDir, file);

  if (fs.statSync(srcFile).isFile()) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied ${file} to dist/`);
  }
}

console.log('Build completed successfully.');