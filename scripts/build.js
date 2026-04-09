const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'build');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function safeCopy(relPath) {
  const src = path.join(root, relPath);
  if (!fs.existsSync(src)) return;
  copyRecursive(src, path.join(outDir, relPath));
}

function copyPublicToBuildRoot() {
  const publicDir = path.join(root, 'public');
  if (!fs.existsSync(publicDir)) return;

  for (const entry of fs.readdirSync(publicDir)) {
    copyRecursive(path.join(publicDir, entry), path.join(outDir, entry));
  }
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

copyPublicToBuildRoot();
safeCopy('src');
safeCopy('package.json');
safeCopy('package-lock.json');
safeCopy('.env.example');

fs.writeFileSync(
  path.join(outDir, 'BUILD_INFO.txt'),
  [
    'Medical Dashboard build artifact',
    `Built at: ${new Date().toISOString()}`,
    'Run with: node src/server.js (from project root or copied artifact)'
  ].join('\n'),
  'utf8'
);

console.log(`Build complete. Output directory: ${outDir}`);
