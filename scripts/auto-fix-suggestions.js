#!/usr/bin/env node

/**
 * Auto-Fix Suggestions Generator
 * 
 * Generates safe auto-fix suggestions based on audit results.
 * These can be applied manually or via codemod tools.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load baseline config
const BASELINE_CONFIG_PATH = path.join(__dirname, '../.audit/baseline-config.json');
const baseline = JSON.parse(fs.readFileSync(BASELINE_CONFIG_PATH, 'utf8'));

/**
 * Generate auto-fix suggestions for a file based on issues
 */
function generateAutoFixSuggestions(filePath, result) {
  const content = fs.readFileSync(filePath, 'utf8');
  const suggestions = [];
  const issues = result.issues || {};

  // Spacing fixes
  if (issues.spacing) {
    const currentSpacing = issues.spacing.actual;
    const expectedSpacing = issues.spacing.expected;
    
    if (currentSpacing && expectedSpacing) {
      suggestions.push({
        type: 'spacing',
        description: `Replace main container spacing: ${currentSpacing} → ${expectedSpacing}`,
        find: new RegExp(`space-y-${currentSpacing.replace('space-y-', '')}`, 'g'),
        replace: expectedSpacing,
        safe: true,
        example: `Find: className="...${currentSpacing}..."\nReplace: className="...${expectedSpacing}..."`
      });
    }
  }

  // Color token fixes (from suggestions in issues)
  if (issues.colors && issues.colors.suggestions) {
    issues.colors.suggestions.forEach(suggestion => {
      suggestions.push({
        type: 'color-token',
        description: `Replace hardcoded color: ${suggestion.old} → ${suggestion.replacement}`,
        find: suggestion.old,
        replace: suggestion.replacement,
        safe: true,
        example: `Find: className="...${suggestion.old}..."\nReplace: className="...${suggestion.replacement}..."`
      });
    });
  }

  // Card transparency fixes
  if (issues.components && issues.components.cardsWithoutTransparent) {
    suggestions.push({
      type: 'component',
      description: `Add bg-transparent to ${issues.components.cardsWithoutTransparent} CardContent/CardHeader component(s)`,
      find: 'CardContent/CardHeader without bg-transparent',
      replace: 'Add bg-transparent to className',
      safe: true,
      example: `Find: <CardContent className="...">\nReplace: <CardContent className="... bg-transparent">`
    });
  }

  // CardTitle size fixes
  if (issues.typography && issues.typography.forbiddenCardTitles) {
    issues.typography.forbiddenCardTitles.forEach(cardTitle => {
      suggestions.push({
        type: 'typography',
        description: `Remove forbidden size override: ${cardTitle.class} from CardTitle`,
        find: cardTitle.class,
        replace: 'Remove size override (use default)',
        safe: true,
        example: `Find: <CardTitle className="${cardTitle.class} ...">\nReplace: <CardTitle className="...">`
      });
    });
  }

  return suggestions;
}

/**
 * Generate fix suggestions report
 */
function generateFixReport(auditResults) {
  const report = {
    timestamp: new Date().toISOString(),
    suggestions: []
  };

  auditResults.forEach(result => {
    // Construct file path from page name
    const pageMap = {
      'AlgemeenPage': 'src/components/pages/public/information/AlgemeenPage.tsx',
      'ReglementPage': 'src/components/pages/public/information/ReglementPage.tsx',
      'CompetitiePage': 'src/components/pages/public/competition/CompetitiePage.tsx',
      'PublicBekerPage': 'src/components/pages/public/competition/PublicBekerPage.tsx',
      'PlayOffPage': 'src/components/pages/public/competition/PlayOffPage.tsx'
    };
    
    const filePath = result.file || pageMap[result.page];
    if (!filePath) {
      console.warn(`⚠️  Could not determine file path for ${result.page}, skipping...`);
      return;
    }
    
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  File not found: ${fullPath}, skipping...`);
      return;
    }
    
    const suggestions = generateAutoFixSuggestions(fullPath, result);
    
    if (suggestions.length > 0) {
      report.suggestions.push({
        page: result.page,
        file: filePath,
        suggestions: suggestions.map(s => ({
          type: s.type,
          description: s.description,
          safe: s.safe
        }))
      });
    }
  });

  return report;
}

/**
 * Main function
 */
function main() {
  // Find latest audit report
  const reportsDir = path.join(__dirname, '../.audit/reports');
  const files = fs.readdirSync(reportsDir)
    .filter(f => f.startsWith('audit-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('No audit reports found. Run audit-pages.js first.');
    process.exit(1);
  }

  const latestReport = JSON.parse(
    fs.readFileSync(path.join(reportsDir, files[0]), 'utf8')
  );

  const fixReport = generateFixReport(latestReport.results);

  // Save fix suggestions
  const outputPath = path.join(reportsDir, 'auto-fix-suggestions.json');
  fs.writeFileSync(outputPath, JSON.stringify(fixReport, null, 2));

  console.log('✅ Auto-fix suggestions generated:');
  console.log(`   ${outputPath}\n`);

  if (fixReport.suggestions.length > 0) {
    console.log('📋 Suggestions by page:');
    fixReport.suggestions.forEach(item => {
      console.log(`\n   ${item.page}:`);
      item.suggestions.forEach(s => {
        console.log(`     - [${s.type}] ${s.description} ${s.safe ? '(safe)' : '(review needed)'}`);
      });
    });
  } else {
    console.log('✨ No auto-fix suggestions needed!');
  }
}

main();

