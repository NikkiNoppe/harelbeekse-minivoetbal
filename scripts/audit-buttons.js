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

// Button patterns
const BUTTON_PATTERNS = {
  legacy: {
    primary: /btn--primary|btn-primary/,
    secondary: /btn--secondary|btn-secondary/,
    danger: /btn--danger|btn-danger/,
    dark: /btn-dark/,
    outline: /btn--outline|btn-outline/,
  },
  component: {
    default: /variant=["']default["']/,
    destructive: /variant=["']destructive["']/,
    secondary: /variant=["']secondary["']/,
    outline: /variant=["']outline["']/,
    ghost: /variant=["']ghost["']/,
    link: /variant=["']link["']/,
  },
  hardcoded: {
    purple: /bg-purple-\d+|text-purple-\d+|border-purple-\d+/,
    red: /bg-red-\d+|text-red-\d+|border-red-\d+/,
    blue: /bg-blue-\d+|text-blue-\d+|border-blue-\d+/,
    gray: /bg-gray-\d+|text-gray-\d+|border-gray-\d+/,
    white: /bg-white|text-white/,
    black: /bg-black|text-black/,
  },
};

// Standard button variants
const STANDARD_VARIANTS = ['btn--primary', 'btn--secondary', 'btn--danger'];

function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      if (!['node_modules', '.next', 'dist', 'build'].includes(item.name)) {
        files.push(...findFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => item.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractButtonInfo(content, filePath) {
  const buttons = [];
  const lines = content.split('\n');
  const componentName = path.basename(filePath, path.extname(filePath));
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    let buttonInfo = null;
    
    // Check for legacy button classes
    for (const [variant, pattern] of Object.entries(BUTTON_PATTERNS.legacy)) {
      if (pattern.test(line)) {
        const match = line.match(/(btn--?\w+|btn-dark)/);
        if (match) {
          buttonInfo = {
            component: componentName,
            file: filePath.replace(path.join(__dirname, '../'), ''),
            usage: 'legacy',
            classes: match[0],
            location: `line ${lineNum}`,
            recommended: variant === 'dark' ? 'btn--primary' : match[0],
            is_standard: STANDARD_VARIANTS.includes(match[0]) || match[0] === 'btn--primary' || match[0] === 'btn--secondary' || match[0] === 'btn--danger',
          };
          break;
        }
      }
    }
    
    // Check for Button component variants
    if (!buttonInfo) {
      for (const [variant, pattern] of Object.entries(BUTTON_PATTERNS.component)) {
        if (pattern.test(line)) {
          buttonInfo = {
            component: componentName,
            file: filePath.replace(path.join(__dirname, '../'), ''),
            usage: 'component',
            classes: `variant="${variant}"`,
            location: `line ${lineNum}`,
            recommended: variant === 'default' ? 'btn--primary' : 
                        variant === 'destructive' ? 'btn--danger' : 
                        variant === 'secondary' ? 'btn--secondary' : 
                        `btn--${variant}`,
            is_standard: false, // Button component needs migration to legacy classes
          };
          break;
        }
      }
    }
    
    // Check for hardcoded button colors
    if (!buttonInfo && (line.includes('button') || line.includes('Button') || line.includes('onClick'))) {
      const hardcodedColors = [];
      for (const [color, pattern] of Object.entries(BUTTON_PATTERNS.hardcoded)) {
        if (pattern.test(line)) {
          const matches = line.match(new RegExp(pattern.source, 'g'));
          if (matches) {
            hardcodedColors.push(...matches);
          }
        }
      }
      
      if (hardcodedColors.length > 0) {
        const allClasses = line.match(/className=["']([^"']+)["']/) || 
                          line.match(/className=\{([^}]+)\}/);
        const fullClasses = allClasses ? allClasses[1] : hardcodedColors.join(' ');
        
        // Determine recommended variant based on colors
        let recommended = 'btn--secondary';
        if (hardcodedColors.some(c => c.includes('red'))) {
          recommended = 'btn--danger';
        } else if (hardcodedColors.some(c => c.includes('purple') || c.includes('blue'))) {
          recommended = 'btn--primary';
        }
        
        buttonInfo = {
          component: componentName,
          file: filePath.replace(path.join(__dirname, '../'), ''),
          usage: 'hardcoded',
          classes: fullClasses,
          location: `line ${lineNum}`,
          recommended,
          is_standard: false,
        };
      }
    }
    
    if (buttonInfo) {
      buttons.push(buttonInfo);
    }
  });
  
  return buttons;
}

function auditButtons() {
  console.log('🔍 Starting button audit...\n');
  
  const files = findFiles(COMPONENTS_DIR);
  const allButtons = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const buttons = extractButtonInfo(content, file);
      
      if (buttons.length > 0) {
        allButtons.push(...buttons);
      }
    } catch (error) {
      console.error(`❌ Error reading ${file}:`, error.message);
    }
  }
  
  // Generate summary
  const summary = {
    total_buttons: allButtons.length,
    standardized_buttons: allButtons.filter(b => b.is_standard).length,
    inconsistent_buttons: allButtons.filter(b => !b.is_standard).length,
    legacy_usage: allButtons.filter(b => b.usage === 'legacy').length,
    component_usage: allButtons.filter(b => b.usage === 'component').length,
    hardcoded_usage: allButtons.filter(b => b.usage === 'hardcoded').length,
  };
  
  const auditResult = {
    timestamp: new Date().toISOString(),
    buttons: allButtons,
    summary,
  };
  
  // Save JSON report
  const jsonPath = path.join(REPORTS_DIR, 'button-audit.json');
  fs.writeFileSync(jsonPath, JSON.stringify(auditResult, null, 2));
  console.log(`✅ JSON report saved: ${jsonPath}`);
  
  // Generate markdown summary
  const mdPath = path.join(REPORTS_DIR, 'button-audit.md');
  let mdContent = '# Button Audit Report\n\n';
  mdContent += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  mdContent += `## Summary\n\n`;
  mdContent += `- **Total Buttons:** ${summary.total_buttons}\n`;
  mdContent += `- **Standardized:** ${summary.standardized_buttons}\n`;
  mdContent += `- **Inconsistent:** ${summary.inconsistent_buttons}\n`;
  mdContent += `- **Legacy CSS Classes:** ${summary.legacy_usage}\n`;
  mdContent += `- **Button Component:** ${summary.component_usage}\n`;
  mdContent += `- **Hardcoded Colors:** ${summary.hardcoded_usage}\n\n`;
  
  // Group by component
  const byComponent = {};
  allButtons.forEach(button => {
    if (!byComponent[button.component]) {
      byComponent[button.component] = [];
    }
    byComponent[button.component].push(button);
  });
  
  mdContent += `## Inconsistent Buttons by Component\n\n`;
  const inconsistentComponents = Object.entries(byComponent)
    .filter(([_, buttons]) => buttons.some(b => !b.is_standard))
    .sort((a, b) => b[1].filter(btn => !btn.is_standard).length - a[1].filter(btn => !btn.is_standard).length);
  
  if (inconsistentComponents.length === 0) {
    mdContent += `✅ All buttons are using standard variants!\n\n`;
  } else {
    inconsistentComponents.forEach(([component, buttons]) => {
      const inconsistent = buttons.filter(b => !b.is_standard);
      if (inconsistent.length > 0) {
        mdContent += `### ${component}\n\n`;
        mdContent += `- **File:** \`${buttons[0].file}\`\n`;
        mdContent += `- **Inconsistent Buttons:** ${inconsistent.length}\n\n`;
        inconsistent.slice(0, 10).forEach(button => {
          mdContent += `  - **${button.usage}** (${button.location}): \`${button.classes}\` → Recommended: \`${button.recommended}\`\n`;
        });
        if (inconsistent.length > 10) {
          mdContent += `  - ... and ${inconsistent.length - 10} more\n`;
        }
        mdContent += `\n`;
      }
    });
  }
  
  fs.writeFileSync(mdPath, mdContent);
  console.log(`✅ Markdown report saved: ${mdPath}`);
  
  console.log(`\n📊 Audit Summary:`);
  console.log(`   Total buttons: ${summary.total_buttons}`);
  console.log(`   Standardized: ${summary.standardized_buttons}`);
  console.log(`   Inconsistent: ${summary.inconsistent_buttons}`);
  console.log(`   Legacy CSS: ${summary.legacy_usage}`);
  console.log(`   Button Component: ${summary.component_usage}`);
  console.log(`   Hardcoded: ${summary.hardcoded_usage}`);
}

auditButtons();

