const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');

const toRemove = [
  'electron-portable',
  'desktop/electron-dist',
  'frontend/node_modules',
  'desktop/node_modules',
  'tmp',
];

console.log('🧹 Cleanup started...\n');

for (const item of toRemove) {
  const p = path.join(root, item);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log(`  ❌ Removed: ${item}`);
  } else {
    console.log(`  ✓ Already absent: ${item}`);
  }
}

// Оптимизируем backend/node_modules (оставляем только production)
const backendDir = path.join(root, 'backend');
const nodePath = path.join(root, 'nodejs', 'node.exe');
if (fs.existsSync(nodePath)) {
  try {
    execSync(`"${nodePath}" "${path.join(root, 'nodejs', 'npm')}" prune --production`, {
      cwd: backendDir,
      stdio: 'inherit',
    });
    console.log('  ✅ Backend dependencies pruned to production only');
  } catch (e) {
    console.log('  ⚠️  Could not prune backend dependencies (npm not found)');
  }
} else {
  console.log('  ⚠️  nodejs/node.exe not found, skipping backend prune');
}

// Подсчитаем текущий размер
function getSize(dir) {
  let size = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) size += getSize(p);
    else size += fs.statSync(p).size;
  }
  return size;
}

const totalMB = (getSize(root) / 1024 / 1024).toFixed(1);
console.log(`\n📦 Current project size (without .git): ~${totalMB} MB`);
console.log('\n💡 Tip: Use "node scripts/prepare-dist.js" to build a minimal distribution package.');
