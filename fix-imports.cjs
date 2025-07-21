// fix-imports.cjs (volledige auto-fix voor alle importpaden)
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = __dirname;
const EXTENSIONS = ['.ts', '.tsx'];
const IMPORT_PATTERNS = [
  /MINIVOETBAL\.UI\/components\/ui\//,
  /MINIVOETBAL\.SDK\//,
  /MINIVOETBAL\.SERVICES\//,
  /MINIVOETBAL\.UI\/hooks\/use-toast/
];

let missingImports = [];

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filelist);
    } else if (EXTENSIONS.includes(path.extname(file))) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

function getRelativeImport(from, to) {
  let rel = path.relative(path.dirname(from), to);
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace(/\\/g, '/');
}

function resolveImportTarget(importPath, fromFile) {
  // Strip leading ./ or ../
  let importTarget = importPath.replace(/^\.{1,2}\//, '');
  // Remove any leading project-root alias
  importTarget = importTarget
    .replace(/^@\//, 'MINIVOETBAL.UI/')
    .replace(/^MINIVOETBAL\.UI\//, 'MINIVOETBAL.UI/')
    .replace(/^MINIVOETBAL\.SERVICES\//, 'MINIVOETBAL.SERVICES/')
    .replace(/^MINIVOETBAL\.SDK\//, 'MINIVOETBAL.SDK/');
  // Try all extensions
  for (const ext of EXTENSIONS.concat(['', '/index.ts', '/index.tsx'])) {
    let absTarget = path.join(PROJECT_ROOT, importTarget + ext);
    if (fs.existsSync(absTarget)) return absTarget;
  }
  return null;
}

function fileExistsForImport(importPath, fromFile) {
  // Relatief pad
  let absCandidate = importPath.startsWith('.')
    ? path.resolve(path.dirname(fromFile), importPath)
    : path.join(PROJECT_ROOT, importPath.replace(/^@\//, 'MINIVOETBAL.UI/'));
  for (const ext of EXTENSIONS.concat(['', '/index.ts', '/index.tsx'])) {
    if (fs.existsSync(absCandidate + ext)) return true;
  }
  return false;
}

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Regex: import ... from '...';
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  let newContent = content;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    let absTarget = null;
    let shouldFix = false;

    // 1. Project-root/alias imports of interest OR bestaande relatieve imports die naar deze paden wijzen
    if (
      IMPORT_PATTERNS.some(pattern => pattern.test(importPath)) ||
      (importPath.startsWith('.') && IMPORT_PATTERNS.some(pattern => pattern.test(importPath)))
    ) {
      absTarget = resolveImportTarget(importPath, filePath);
      shouldFix = !!absTarget;
    }
    if (shouldFix && absTarget) {
      // Herschrijf naar kortste correcte relatieve pad (zonder extensie)
      const rel = getRelativeImport(filePath, absTarget.replace(/\.tsx?$/, ''));
      newContent = newContent.replace(importPath, rel);
      changed = true;
    } else if (!fileExistsForImport(importPath, filePath)) {
      // Log missende import
      missingImports.push({
        file: filePath,
        importPath
      });
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed imports in:', filePath);
  }
}

function main() {
  const files = walk(PROJECT_ROOT);
  for (const file of files) {
    fixImportsInFile(file);
  }
  console.log('✅ Alle imports automatisch gefixt (volledige auto-fix)!');
  if (missingImports.length > 0) {
    console.log('\n❌ Missende imports gevonden:');
    missingImports.forEach(({ file, importPath }) => {
      console.log(`  In ${file}: '${importPath}'`);
    });
    console.log('\nMaak deze bestanden aan of corrigeer de importpaden!');
  } else {
    console.log('\n🎉 Geen missende imports gevonden!');
  }
}

main();