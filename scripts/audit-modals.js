import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = path.join(__dirname, '../src/components');
const REPORTS_DIR = path.join(__dirname, '../.audit/reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Modal patterns to detect
const MODAL_PATTERNS = {
  appModal: /AppModal|AppAlertModal/,
  dialog: /Dialog[^P]|DialogContent|DialogHeader|DialogTitle|DialogFooter/,
  alertDialog: /AlertDialog[^P]|AlertDialogContent|AlertDialogHeader|AlertDialogTitle|AlertDialogFooter/,
};

// Token patterns
const TOKEN_PATTERNS = {
  bgCard: /bg-card/,
  textCardForeground: /text-card-foreground/,
  shadow: /shadow-\[var\(--shadow-elevation-3\)\]|shadow-\[var\(--shadow-elevation/,
};

// Hardcoded color patterns
const HARDCODED_COLOR_PATTERNS = [
  /bg-purple-\d+/,
  /bg-red-\d+/,
  /bg-blue-\d+/,
  /bg-gray-\d+/,
  /bg-white/,
  /bg-black/,
];

// Button patterns in modals
const BUTTON_PATTERNS = {
  legacy: /btn--primary|btn--secondary|btn--danger|btn-dark|btn--outline/,
  component: /variant=["'](default|destructive|secondary|outline)/,
  hardcoded: /bg-(purple|red|blue|gray)-\d+|bg-white|bg-black/,
};

function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', '.next', 'dist', 'build'].includes(item.name)) {
        files.push(...findFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => item.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractModalInfo(content, filePath) {
  const modals = [];
  const lines = content.split('\n');
  
  // Detect modal type
  let modalType = null;
  let needsMigration = false;
  
  if (MODAL_PATTERNS.appModal.test(content)) {
    modalType = 'AppModal';
    if (MODAL_PATTERNS.appModal.test(content) && (MODAL_PATTERNS.dialog.test(content) || MODAL_PATTERNS.alertDialog.test(content))) {
      modalType = 'Mixed';
      needsMigration = true;
    }
  } else if (MODAL_PATTERNS.dialog.test(content)) {
    modalType = 'Dialog';
    needsMigration = true;
  } else if (MODAL_PATTERNS.alertDialog.test(content)) {
    modalType = 'AlertDialog';
    needsMigration = true;
  }
  
  if (!modalType) return null;
  
  // Extract component name from file path
  const componentName = path.basename(filePath, path.extname(filePath));
  
  // Check token coverage
  const tokenCoverage = {
    bgCard: TOKEN_PATTERNS.bgCard.test(content),
    textCardForeground: TOKEN_PATTERNS.textCardForeground.test(content),
    shadow: TOKEN_PATTERNS.shadow.test(content),
  };
  
  // Find hardcoded colors
  const hardcodedColors = [];
  HARDCODED_COLOR_PATTERNS.forEach(pattern => {
    const matches = content.match(new RegExp(pattern.source, 'g'));
    if (matches) {
      hardcodedColors.push(...matches);
    }
  });
  const uniqueHardcodedColors = [...new Set(hardcodedColors)];
  
  // Check modal background
  let modalBackground = 'present';
  if (!tokenCoverage.bgCard && !content.includes('app-modal')) {
    modalBackground = 'missing';
  } else if (uniqueHardcodedColors.length > 0) {
    modalBackground = 'hardcoded';
  }
  
  // Extract button patterns
  const buttonsFound = [];
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for legacy button classes
    if (BUTTON_PATTERNS.legacy.test(line)) {
      const match = line.match(/(btn--\w+|btn-dark|btn--outline)/);
      if (match) {
        buttonsFound.push({
          type: 'legacy',
          classes: match[0],
          location: `line ${lineNum}`,
          recommended: match[0].replace('btn--', '').replace('dark', 'primary'),
        });
      }
    }
    
    // Check for Button component variants
    if (BUTTON_PATTERNS.component.test(line)) {
      const match = line.match(/variant=["'](\w+)["']/);
      if (match) {
        buttonsFound.push({
          type: 'component',
          classes: `variant="${match[1]}"`,
          location: `line ${lineNum}`,
          recommended: match[1] === 'default' ? 'primary' : match[1],
        });
      }
    }
    
    // Check for hardcoded button colors
    if (BUTTON_PATTERNS.hardcoded.test(line) && line.includes('button') || line.includes('Button') || line.includes('onClick')) {
      const colorMatches = line.match(/bg-\w+-\d+|bg-white|bg-black/g);
      if (colorMatches) {
        buttonsFound.push({
          type: 'hardcoded',
          classes: colorMatches.join(' '),
          location: `line ${lineNum}`,
          recommended: colorMatches.some(c => c.includes('red')) ? 'btn--danger' : 
                      colorMatches.some(c => c.includes('purple') || c.includes('blue')) ? 'btn--primary' : 
                      'btn--secondary',
        });
      }
    }
  });
  
  // Determine recommended button variants
  const recommendedVariants = [];
  const hasPrimary = buttonsFound.some(b => b.recommended === 'primary' || b.classes.includes('primary'));
  const hasSecondary = buttonsFound.some(b => b.recommended === 'secondary' || b.classes.includes('secondary'));
  const hasDanger = buttonsFound.some(b => b.recommended === 'danger' || b.classes.includes('danger'));
  
  if (!hasPrimary && !hasSecondary && !hasDanger) {
    recommendedVariants.push('primary', 'secondary');
  } else {
    if (!hasPrimary && !hasDanger) recommendedVariants.push('primary');
    if (!hasSecondary) recommendedVariants.push('secondary');
  }
  
  return {
    component: componentName,
    file: filePath.replace(path.join(__dirname, '../'), ''),
    type: modalType,
    needs_migration: needsMigration,
    modal_background: modalBackground,
    hardcoded_colors: uniqueHardcodedColors,
    token_coverage: tokenCoverage,
    buttons_found: buttonsFound,
    recommended_variants: recommendedVariants,
  };
}

function auditModals() {
  console.log('🔍 Starting modal audit...\n');
  
  const files = findFiles(COMPONENTS_DIR);
  const modals = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const modalInfo = extractModalInfo(content, file);
      
      if (modalInfo) {
        modals.push(modalInfo);
        console.log(`📄 Found modal: ${modalInfo.component} (${modalInfo.type})`);
      }
    } catch (error) {
      console.error(`❌ Error reading ${file}:`, error.message);
    }
  }
  
  // Generate summary
  const summary = {
    total_modals: modals.length,
    migrated_modals: modals.filter(m => !m.needs_migration).length,
    legacy_modals: modals.filter(m => m.needs_migration).length,
    modals_with_hardcoded_colors: modals.filter(m => m.hardcoded_colors.length > 0).length,
    modals_missing_tokens: modals.filter(m => !m.token_coverage.bgCard || !m.token_coverage.textCardForeground).length,
  };
  
  const auditResult = {
    timestamp: new Date().toISOString(),
    modals,
    summary,
  };
  
  // Save JSON report
  const jsonPath = path.join(REPORTS_DIR, 'modal-audit.json');
  fs.writeFileSync(jsonPath, JSON.stringify(auditResult, null, 2));
  console.log(`\n✅ JSON report saved: ${jsonPath}`);
  
  // Generate markdown summary
  const mdPath = path.join(REPORTS_DIR, 'modal-audit.md');
  let mdContent = '# Modal Audit Report\n\n';
  mdContent += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  mdContent += `## Summary\n\n`;
  mdContent += `- **Total Modals:** ${summary.total_modals}\n`;
  mdContent += `- **Migrated (AppModal/AppAlertModal):** ${summary.migrated_modals}\n`;
  mdContent += `- **Legacy (Dialog/AlertDialog):** ${summary.legacy_modals}\n`;
  mdContent += `- **With Hardcoded Colors:** ${summary.modals_with_hardcoded_colors}\n`;
  mdContent += `- **Missing Tokens:** ${summary.modals_missing_tokens}\n\n`;
  
  mdContent += `## Modals Requiring Migration\n\n`;
  const legacyModals = modals.filter(m => m.needs_migration);
  if (legacyModals.length === 0) {
    mdContent += `✅ All modals are using AppModal/AppAlertModal!\n\n`;
  } else {
    legacyModals.forEach(modal => {
      mdContent += `### ${modal.component}\n\n`;
      mdContent += `- **File:** \`${modal.file}\`\n`;
      mdContent += `- **Type:** ${modal.type}\n`;
      mdContent += `- **Background:** ${modal.modal_background}\n`;
      if (modal.hardcoded_colors.length > 0) {
        mdContent += `- **Hardcoded Colors:** ${modal.hardcoded_colors.join(', ')}\n`;
      }
      mdContent += `- **Token Coverage:**\n`;
      mdContent += `  - bg-card: ${modal.token_coverage.bgCard ? '✅' : '❌'}\n`;
      mdContent += `  - text-card-foreground: ${modal.token_coverage.textCardForeground ? '✅' : '❌'}\n`;
      mdContent += `  - shadow: ${modal.token_coverage.shadow ? '✅' : '❌'}\n`;
      if (modal.buttons_found.length > 0) {
        mdContent += `- **Buttons Found:** ${modal.buttons_found.length}\n`;
      }
      mdContent += `\n`;
    });
  }
  
  fs.writeFileSync(mdPath, mdContent);
  console.log(`✅ Markdown report saved: ${mdPath}`);
  
  console.log(`\n📊 Audit Summary:`);
  console.log(`   Total modals: ${summary.total_modals}`);
  console.log(`   Migrated: ${summary.migrated_modals}`);
  console.log(`   Legacy: ${summary.legacy_modals}`);
  console.log(`   With hardcoded colors: ${summary.modals_with_hardcoded_colors}`);
  console.log(`   Missing tokens: ${summary.modals_missing_tokens}`);
}

auditModals();

