#!/usr/bin/env node

/**
 * Page Consistency Audit Script
 * 
 * Scans all public pages and compares them against the baseline configuration
 * from CompetitiePage. Generates a diff report with parity scores and fix suggestions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASELINE_CONFIG_PATH = path.join(__dirname, '../.audit/baseline-config.json');
const PAGES_DIR = path.join(__dirname, '../src/components/pages/public');
const OUTPUT_DIR = path.join(__dirname, '../.audit/reports');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load baseline configuration
const baseline = JSON.parse(fs.readFileSync(BASELINE_CONFIG_PATH, 'utf8'));

/**
 * Extract spacing classes from file content
 */
function extractSpacing(content) {
  const spacing = {
    mainContainer: null,
    sections: [],
    grids: []
  };

  // Main container spacing - look for the main component return statement
  // Pattern: return ( <div className="space-y-X animate-slide-up">
  // Try to find the main component's return statement
  const mainComponentMatch = content.match(/const\s+\w+Page[^=]*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\};/);
  if (mainComponentMatch) {
    const componentBody = mainComponentMatch[1];
    // Look for return statement in component body
    const returnMatch = componentBody.match(/return\s*\([\s\S]*?<div[^>]*className="[^"]*space-y-(\d+)[^"]*"/);
    if (returnMatch) {
      spacing.mainContainer = `space-y-${returnMatch[1]}`;
    }
  }
  
  // Fallback: look for any div with space-y and animate-slide-up near the end (likely main container)
  if (!spacing.mainContainer) {
    const fallbackMatch = content.match(/<div[^>]*className="[^"]*space-y-(\d+)[^"]*animate-slide-up[^"]*"/);
    if (fallbackMatch) {
      spacing.mainContainer = `space-y-${fallbackMatch[1]}`;
    }
  }
  
  // Last resort: find space-y in the main return area
  if (!spacing.mainContainer) {
    const lastResortMatch = content.match(/return\s*\([\s\S]{0,500}<div[^>]*className="[^"]*space-y-(\d+)[^"]*"/);
    if (lastResortMatch) {
      spacing.mainContainer = `space-y-${lastResortMatch[1]}`;
    }
  }

  // Section spacing
  const sectionMatches = content.matchAll(/<section[^>]*className="[^"]*space-y-(\d+)[^"]*"/g);
  for (const match of sectionMatches) {
    spacing.sections.push(`space-y-${match[1]}`);
  }

  // Grid gaps - more specific pattern
  const gridMatches = content.matchAll(/className="[^"]*grid[^"]*gap-(\d+)[^"]*"/g);
  for (const match of gridMatches) {
    spacing.grids.push(`gap-${match[1]}`);
  }

  return spacing;
}

/**
 * Extract typography patterns
 */
function extractTypography(content) {
  const typography = {
    mainHeading: null,
    sectionHeadings: [],
    cardTitles: [],
    descriptions: []
  };

  // Main heading (h1 or h2 in main container)
  const mainHeadingMatch = content.match(/<(h[12])[^>]*className="[^"]*text-(2xl|3xl)[^"]*font-(semibold|bold)[^"]*">/);
  if (mainHeadingMatch) {
    typography.mainHeading = {
      element: mainHeadingMatch[1],
      classes: [mainHeadingMatch[2], mainHeadingMatch[3]]
    };
  }

  // Section headings
  const sectionHeadingMatches = content.matchAll(/<(h[23])[^>]*className="[^"]*text-(2xl|xl|lg)[^"]*font-(semibold|bold)[^"]*">/g);
  for (const match of sectionHeadingMatches) {
    typography.sectionHeadings.push({
      element: match[1],
      classes: [match[2], match[3]]
    });
  }

  // Card titles with size overrides
  const cardTitleMatches = content.matchAll(/<CardTitle[^>]*className="[^"]*text-(lg|xl|sm)[^"]*"/g);
  for (const match of cardTitleMatches) {
    typography.cardTitles.push({
      forbidden: true,
      class: `text-${match[1]}`
    });
  }

  // Descriptions
  const descMatches = content.matchAll(/className="[^"]*text-muted-foreground[^"]*"/g);
  typography.descriptions = Array.from(descMatches).length;

  return typography;
}

/**
 * Extract color token usage
 */
function extractColors(content) {
  const colors = {
    requiredTokens: [],
    forbiddenPatterns: [],
    suggestions: []
  };

  // Check for required tokens (more lenient - just check if token appears anywhere)
  baseline.colors.requiredTokens.forEach(token => {
    // Escape special regex chars but allow for className="..." or other contexts
    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedToken, 'g');
    if (regex.test(content)) {
      colors.requiredTokens.push(token);
    }
  });

  // Check for forbidden patterns (more specific - in className attributes)
  baseline.colors.forbiddenPatterns.forEach(pattern => {
    // Look for pattern in className attributes specifically
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`className="[^"]*${escapedPattern}[^"]*"`, 'g');
    const matches = content.match(regex);
    if (matches) {
      colors.forbiddenPatterns.push({
        pattern,
        occurrences: matches.length,
        matches: matches.slice(0, 5) // Limit to first 5
      });
    }
  });

  // Generate suggestions based on token mappings
  Object.entries(baseline.colors.tokenMappings).forEach(([old, replacement]) => {
    const escapedOld = old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`className="[^"]*${escapedOld}[^"]*"`, 'g');
    if (regex.test(content)) {
      colors.suggestions.push({
        old,
        replacement,
        type: 'color-token'
      });
    }
  });

  return colors;
}

/**
 * Extract component patterns
 */
function extractComponents(content) {
  const components = {
    cards: {
      withTransparent: 0,
      withoutTransparent: 0
    },
    pageHeader: {
      hasMobile: false,
      hasDesktop: false
    }
  };

  // Check CardContent components - count those with bg-transparent
  const cardContentWithTransparent = content.matchAll(/<CardContent[^>]*className="[^"]*bg-transparent[^"]*"/g);
  components.cards.withTransparent = Array.from(cardContentWithTransparent).length;

  // Count all CardContent with className (to find those without bg-transparent)
  const cardContentAll = content.matchAll(/<CardContent[^>]*className="[^"]*"/g);
  const allCardContents = Array.from(cardContentAll);
  components.cards.withoutTransparent = allCardContents.filter(match => 
    !match[0].includes('bg-transparent')
  ).length;

  // Also check CardHeader
  const cardHeaderWithTransparent = content.matchAll(/<CardHeader[^>]*className="[^"]*bg-transparent[^"]*"/g);
  const cardHeaderAll = content.matchAll(/<CardHeader[^>]*className="[^"]*"/g);
  const allCardHeaders = Array.from(cardHeaderAll);
  const headersWithoutTransparent = allCardHeaders.filter(match => 
    !match[0].includes('bg-transparent')
  ).length;
  
  components.cards.withoutTransparent += headersWithoutTransparent;

  // Check PageHeader usage - look for conditional rendering pattern
  components.pageHeader.hasMobile = /PageHeader/.test(content) && /useIsMobile/.test(content) && /isMobile\s*\?/.test(content);
  components.pageHeader.hasDesktop = /<h2[^>]*text-2xl[^>]*font-semibold/.test(content) || /<h2[^>]*className="[^"]*text-2xl[^"]*font-semibold[^"]*"/.test(content);

  return components;
}

/**
 * Extract accessibility features
 */
function extractAccessibility(content) {
  const accessibility = {
    sections: {
      withRole: 0,
      withAriaLabelledby: 0,
      total: 0
    },
    headings: {
      h2: 0,
      h3: 0,
      total: 0
    }
  };

  // Count sections
  const sectionMatches = content.matchAll(/<section[^>]*>/g);
  accessibility.sections.total = Array.from(sectionMatches).length;

  const roleMatches = content.matchAll(/role="region"/g);
  accessibility.sections.withRole = Array.from(roleMatches).length;

  const ariaMatches = content.matchAll(/aria-labelledby/g);
  accessibility.sections.withAriaLabelledby = Array.from(ariaMatches).length;

  // Count headings
  const h2Matches = content.matchAll(/<h2/g);
  accessibility.headings.h2 = Array.from(h2Matches).length;

  const h3Matches = content.matchAll(/<h3/g);
  accessibility.headings.h3 = Array.from(h3Matches).length;

  accessibility.headings.total = accessibility.headings.h2 + accessibility.headings.h3;

  return accessibility;
}

/**
 * Calculate parity score
 */
function calculateParityScore(audit, pageName) {
  let score = 0;
  let maxScore = 0;
  const details = [];

  // Spacing (20 points)
  maxScore += 20;
  if (audit.spacing.mainContainer === baseline.spacing.mainContainer.required) {
    score += 10;
    details.push({ category: 'spacing', item: 'mainContainer', status: 'pass', points: 10 });
  } else {
    details.push({ category: 'spacing', item: 'mainContainer', status: 'fail', points: 0, expected: baseline.spacing.mainContainer.required, actual: audit.spacing.mainContainer });
  }

  if (audit.spacing.grids.every(g => baseline.spacing.gridGaps.alternatives.includes(g) || g === baseline.spacing.gridGaps.required)) {
    score += 10;
    details.push({ category: 'spacing', item: 'gridGaps', status: 'pass', points: 10 });
  } else {
    details.push({ category: 'spacing', item: 'gridGaps', status: 'fail', points: 0, expected: baseline.spacing.gridGaps.required, actual: audit.spacing.grids });
  }

  // Typography (25 points)
  maxScore += 25;
  if (audit.typography.mainHeading && audit.typography.mainHeading.element === baseline.typography.mainHeading.element) {
    score += 10;
    details.push({ category: 'typography', item: 'mainHeading', status: 'pass', points: 10 });
  } else {
    details.push({ category: 'typography', item: 'mainHeading', status: 'fail', points: 0 });
  }

  if (audit.typography.cardTitles.length === 0) {
    score += 15;
    details.push({ category: 'typography', item: 'cardTitles', status: 'pass', points: 15 });
  } else {
    score += Math.max(0, 15 - (audit.typography.cardTitles.length * 5));
    details.push({ category: 'typography', item: 'cardTitles', status: 'fail', points: Math.max(0, 15 - (audit.typography.cardTitles.length * 5)), issues: audit.typography.cardTitles.length });
  }

  // Colors (25 points)
  maxScore += 25;
  // More lenient scoring - if at least 5/8 required tokens are present, give full points
  const requiredTokensRatio = audit.colors.requiredTokens.length / baseline.colors.requiredTokens.length;
  const tokenScore = requiredTokensRatio >= 0.625 ? 15 : Math.floor(requiredTokensRatio * 15);
  score += tokenScore;
  details.push({ category: 'colors', item: 'requiredTokens', status: tokenScore >= 12 ? 'pass' : 'partial', points: tokenScore, ratio: requiredTokensRatio, found: audit.colors.requiredTokens.length, total: baseline.colors.requiredTokens.length });

  const forbiddenCount = audit.colors.forbiddenPatterns.reduce((sum, p) => sum + p.occurrences, 0);
  const forbiddenScore = Math.max(0, 10 - (forbiddenCount * 2));
  score += forbiddenScore;
  details.push({ category: 'colors', item: 'forbiddenPatterns', status: forbiddenCount === 0 ? 'pass' : 'fail', points: forbiddenScore, issues: forbiddenCount });

  // Components (15 points)
  maxScore += 15;
  if (audit.components.cards.withoutTransparent === 0 && audit.components.cards.withTransparent > 0) {
    score += 8;
    details.push({ category: 'components', item: 'cardTransparent', status: 'pass', points: 8 });
  } else {
    score += Math.max(0, 8 - audit.components.cards.withoutTransparent);
    details.push({ category: 'components', item: 'cardTransparent', status: 'fail', points: Math.max(0, 8 - audit.components.cards.withoutTransparent), issues: audit.components.cards.withoutTransparent });
  }

  if (audit.components.pageHeader.hasMobile && audit.components.pageHeader.hasDesktop) {
    score += 7;
    details.push({ category: 'components', item: 'pageHeader', status: 'pass', points: 7 });
  } else {
    details.push({ category: 'components', item: 'pageHeader', status: 'fail', points: 0, hasMobile: audit.components.pageHeader.hasMobile, hasDesktop: audit.components.pageHeader.hasDesktop });
  }

  // Accessibility (15 points)
  maxScore += 15;
  if (audit.accessibility.sections.total > 0) {
    const roleRatio = audit.accessibility.sections.withRole / audit.accessibility.sections.total;
    const ariaRatio = audit.accessibility.sections.withAriaLabelledby / audit.accessibility.sections.total;
    const a11yScore = Math.floor((roleRatio + ariaRatio) / 2 * 15);
    score += a11yScore;
    details.push({ category: 'accessibility', item: 'ariaLandmarks', status: a11yScore >= 12 ? 'pass' : 'partial', points: a11yScore, roleRatio, ariaRatio });
  } else {
    details.push({ category: 'accessibility', item: 'ariaLandmarks', status: 'fail', points: 0 });
  }

  const percentage = Math.round((score / maxScore) * 100);

  return {
    score,
    maxScore,
    percentage,
    details,
    threshold: 95,
    passed: percentage >= 95
  };
}

/**
 * Audit a single page file
 */
function auditPage(filePath, pageName) {
  const content = fs.readFileSync(filePath, 'utf8');

  const audit = {
    page: pageName,
    file: filePath,
    spacing: extractSpacing(content),
    typography: extractTypography(content),
    colors: extractColors(content),
    components: extractComponents(content),
    accessibility: extractAccessibility(content)
  };

  const parity = calculateParityScore(audit, pageName);

  return {
    ...audit,
    parity
  };
}

/**
 * Main audit function
 */
function runAudit() {
  console.log('🔍 Starting page consistency audit...\n');

  const pages = [
    { name: 'AlgemeenPage', file: 'information/AlgemeenPage.tsx' },
    { name: 'ReglementPage', file: 'information/ReglementPage.tsx' },
    { name: 'CompetitiePage', file: 'competition/CompetitiePage.tsx' },
    { name: 'PublicBekerPage', file: 'competition/PublicBekerPage.tsx' },
    { name: 'PlayOffPage', file: 'competition/PlayOffPage.tsx' }
  ];

  const results = [];

  pages.forEach(({ name, file }) => {
    const filePath = path.join(PAGES_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`📄 Auditing ${name}...`);
      const result = auditPage(filePath, name);
      results.push(result);
    } else {
      console.warn(`⚠️  File not found: ${filePath}`);
    }
  });

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    baseline: baseline.baseline,
    results: results.map(r => ({
      page: r.page,
      parity: r.parity,
      issues: {
        spacing: r.spacing.mainContainer !== baseline.spacing.mainContainer.required ? {
          expected: baseline.spacing.mainContainer.required,
          actual: r.spacing.mainContainer
        } : null,
        typography: r.typography.cardTitles.length > 0 ? {
          forbiddenCardTitles: r.typography.cardTitles
        } : null,
        colors: r.colors.forbiddenPatterns.length > 0 ? {
          forbiddenPatterns: r.colors.forbiddenPatterns,
          suggestions: r.colors.suggestions
        } : null,
        components: r.components.cards.withoutTransparent > 0 ? {
          cardsWithoutTransparent: r.components.cards.withoutTransparent
        } : null,
        accessibility: r.accessibility.sections.withRole < r.accessibility.sections.total ? {
          missingAria: r.accessibility.sections.total - r.accessibility.sections.withRole
        } : null
      }
    })),
    summary: {
      totalPages: results.length,
      passed: results.filter(r => r.parity.passed).length,
      failed: results.filter(r => !r.parity.passed).length,
      averageScore: Math.round(results.reduce((sum, r) => sum + r.parity.percentage, 0) / results.length)
    }
  };

  // Save JSON report
  const jsonReportPath = path.join(OUTPUT_DIR, `audit-${Date.now()}.json`);
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ JSON report saved: ${jsonReportPath}`);

  // Generate markdown report
  generateMarkdownReport(report);

  // Print summary
  console.log('\n📊 Audit Summary:');
  console.log(`   Total pages: ${report.summary.totalPages}`);
  console.log(`   Passed (≥95%): ${report.summary.passed}`);
  console.log(`   Failed (<95%): ${report.summary.failed}`);
  console.log(`   Average score: ${report.summary.averageScore}%`);

  // Print individual scores
  console.log('\n📈 Individual Scores:');
  results.forEach(r => {
    const status = r.parity.passed ? '✅' : '❌';
    console.log(`   ${status} ${r.page}: ${r.parity.percentage}%`);
  });

  // Exit with error code if any failed
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report) {
  const mdReportPath = path.join(OUTPUT_DIR, 'consistency-report.md');
  
  let markdown = `# Page Consistency Audit Report\n\n`;
  markdown += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n`;
  markdown += `**Baseline:** ${report.baseline.referencePage} (${report.baseline.referenceFile})\n\n`;
  
  markdown += `## Summary\n\n`;
  markdown += `- **Total Pages:** ${report.summary.totalPages}\n`;
  markdown += `- **Passed (≥95%):** ${report.summary.passed}\n`;
  markdown += `- **Failed (<95%):** ${report.summary.failed}\n`;
  markdown += `- **Average Score:** ${report.summary.averageScore}%\n\n`;

  markdown += `## Detailed Results\n\n`;

  report.results.forEach(result => {
    const status = result.parity.passed ? '✅' : '❌';
    markdown += `### ${status} ${result.page} - ${result.parity.percentage}%\n\n`;
    
    markdown += `**Score:** ${result.parity.score}/${result.parity.maxScore} points\n\n`;
    
    markdown += `#### Parity Breakdown:\n\n`;
    result.parity.details.forEach(detail => {
      const icon = detail.status === 'pass' ? '✅' : detail.status === 'partial' ? '⚠️' : '❌';
      markdown += `- ${icon} **${detail.category}/${detail.item}**: ${detail.points} points`;
      if (detail.expected) {
        markdown += ` (Expected: ${detail.expected}, Actual: ${detail.actual})`;
      }
      if (detail.issues) {
        markdown += ` (${detail.issues} issues)`;
      }
      markdown += `\n`;
    });

    // Issues section
    const hasIssues = Object.values(result.issues).some(issue => issue !== null);
    if (hasIssues) {
      markdown += `\n#### Issues Found:\n\n`;
      
      if (result.issues.spacing) {
        markdown += `- **Spacing**: Expected \`${result.issues.spacing.expected}\`, found \`${result.issues.spacing.actual}\`\n`;
      }
      
      if (result.issues.typography) {
        markdown += `- **Typography**: Found ${result.issues.typography.forbiddenCardTitles.length} CardTitle(s) with forbidden size overrides\n`;
      }
      
      if (result.issues.colors) {
        markdown += `- **Colors**: Found ${result.issues.colors.forbiddenPatterns.length} forbidden color pattern(s)\n`;
        if (result.issues.colors.suggestions.length > 0) {
          markdown += `  - **Auto-fix suggestions:**\n`;
          result.issues.colors.suggestions.forEach(s => {
            markdown += `    - Replace \`${s.old}\` → \`${s.replacement}\`\n`;
          });
        }
      }
      
      if (result.issues.components) {
        markdown += `- **Components**: ${result.issues.components.cardsWithoutTransparent} Card(s) missing \`bg-transparent\`\n`;
      }
      
      if (result.issues.accessibility) {
        markdown += `- **Accessibility**: ${result.issues.accessibility.missingAria} section(s) missing ARIA landmarks\n`;
      }
    }

    markdown += `\n---\n\n`;
  });

  fs.writeFileSync(mdReportPath, markdown);
  console.log(`✅ Markdown report saved: ${mdReportPath}`);
}

// Run audit
runAudit();

export { runAudit, auditPage };

