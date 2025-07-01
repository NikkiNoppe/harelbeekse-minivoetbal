#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      updateImportsInFile(fullPath);
    }
  });
}

console.log('🔄 Updating import paths...');
walkDirectory('src');
console.log('✅ Import path update complete!');

console.log('\n📋 Manual updates needed:');
console.log('1. Check any dynamic imports');
console.log('2. Update test files if present');  
console.log('3. Update any config files');
console.log('4. Run npm run build to verify'); 