const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'dist-package');

// Папки и файлы, которые не нужны в дистрибутиве
const exclude = new Set([
  '.git',
  '.gitignore',
  'frontend/node_modules',
  'backend/node_modules', // скопируем отдельно после prune
  'desktop/node_modules',
  'electron-portable',
  'desktop/electron-dist',
  'tmp',
  'scripts',
  'Коллекции Postman',
  'backend/src',
  'frontend/src',
  'desktop/src',
  'import_collections.js',
  'backend/fix_executor.js',
  'data/apiquick.db',
  'data/getman.db',
]);

function shouldCopy(src, rel) {
  const base = path.basename(src);
  if (exclude.has(rel.replace(/\\/g, '/'))) return false;
  if (base.endsWith('.log')) return false;
  if (base === '.DS_Store' || base === 'Thumbs.db') return false;
  return true;
}

function copyDir(src, dst, rel = '') {
  if (!shouldCopy(src, rel)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyDir(path.join(src, entry), path.join(dst, entry), rel ? `${rel}/${entry}` : entry);
    }
  } else {
    fs.copyFileSync(src, dst);
  }
}

// Удаляем старую сборку
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true });
}
fs.mkdirSync(outDir, { recursive: true });

// Копируем корневые элементы
for (const entry of fs.readdirSync(root)) {
  if (entry === 'dist-package' || entry === '.git') continue;
  const src = path.join(root, entry);
  const dst = path.join(outDir, entry);
  const rel = entry;
  if (!shouldCopy(src, rel)) continue;
  copyDir(src, dst, rel);
}

// Копируем backend/node_modules отдельно (production-зависимости)
const backendModulesSrc = path.join(root, 'backend', 'node_modules');
const backendModulesDst = path.join(outDir, 'backend', 'node_modules');
if (fs.existsSync(backendModulesSrc)) {
  fs.mkdirSync(path.join(outDir, 'backend'), { recursive: true });
  copyDir(backendModulesSrc, backendModulesDst, 'backend/node_modules');
}

// Создаём пустую базу данных если нужно
const dataDir = path.join(outDir, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Подсчёт размера
function getSize(dir) {
  let size = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) size += getSize(p);
    else size += fs.statSync(p).size;
  }
  return size;
}

const totalBytes = getSize(outDir);
const totalMB = (totalBytes / 1024 / 1024).toFixed(1);

console.log(`✅ Дистрибутив собран в: ${outDir}`);
console.log(`📦 Размер: ${totalMB} MB`);
