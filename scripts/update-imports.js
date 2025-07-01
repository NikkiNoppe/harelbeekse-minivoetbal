#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import mapping voor oude naar nieuwe paden
const importMappings = {
  // Shared resources
  '@/components/ui': '@shared/components/ui',
  '@/hooks/': '@shared/hooks/',
  '@/lib/': '@shared/utils/',
  '@/services/': '@shared/services/',
  '@/types/': '@shared/types/',
  '@/integrations/': '@shared/integrations/',
  '@/context/': '@shared/context/',
  '@/data/': '@shared/constants/',
  
  // Features
  '@/components/auth': '@features/auth',
  '@/components/team': '@features/teams',
  '@/components/match': '@features/matches', 
  '@/components/admin': '@features/admin',
  '@/components/user': '@features/dashboard',
  
  // App
  '@/pages/': '@app/pages/',
};

function updateImportsInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  Object.entries(importMappings).forEach(([oldPath, newPath]) => {
    const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (content.includes(oldPath)) {
      content = content.replace(regex, newPath);
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      updateImportsInFile(filePath);
    }
  });
}

console.log('🔄 Updating import paths...');
walkDirectory('./src');
console.log('✅ Import update complete!');

console.log('\n📋 Manual updates needed:');
console.log('1. Check any dynamic imports');
console.log('2. Update test files if present');  
console.log('3. Update any config files');
console.log('4. Run npm run build to verify'); 