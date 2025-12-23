# Automated Page Consistency Audit System

## Overview

This automated audit system ensures all public pages maintain consistent UI/UX patterns based on the CompetitiePage reference design. It scans pages, compares them against a baseline configuration, and generates detailed reports with parity scores and auto-fix suggestions.

## System Components

### 1. Baseline Configuration
**File:** `.audit/baseline-config.json`

Captures the reference design patterns from CompetitiePage:
- Spacing requirements (`space-y-6` for main containers)
- Typography hierarchy (`h2 text-2xl font-semibold`)
- Design token requirements (no hardcoded colors)
- Component patterns (Card with `bg-transparent`, PageHeader on mobile)
- Accessibility requirements (ARIA landmarks)

### 2. Audit Script
**File:** `scripts/audit-pages.js`

Main audit engine that:
- Scans all public page files
- Extracts spacing, typography, colors, components, and accessibility patterns
- Compares against baseline configuration
- Calculates parity scores (0-100%)
- Generates JSON and Markdown reports

### 3. Auto-Fix Suggestions
**File:** `scripts/auto-fix-suggestions.js`

Generates safe auto-fix suggestions based on audit results:
- Spacing corrections
- Color token replacements
- Component pattern fixes
- Typography corrections

### 4. CI/CD Integration
**File:** `.github/workflows/audit-pages.yml`

GitHub Actions workflow that:
- Runs audit on PRs and pushes to main/develop
- Fails CI if any page scores below 95%
- Uploads audit reports as artifacts

## Usage

### Run Audit Locally

```bash
# From project root
node scripts/audit-pages.js
```

**Output:**
- Console summary with scores
- JSON report: `.audit/reports/audit-{timestamp}.json`
- Markdown report: `.audit/reports/consistency-report.md`

### Generate Auto-Fix Suggestions

```bash
node scripts/auto-fix-suggestions.js
```

**Output:**
- JSON file: `.audit/reports/auto-fix-suggestions.json`
- Console list of suggestions by page

### CI/CD Integration

The audit runs automatically on:
- Pull requests affecting public pages
- Pushes to main/develop branches
- Manual workflow dispatch

**Exit Codes:**
- `0`: All pages pass (≥95%)
- `1`: One or more pages fail (<95%)

## Scoring System

Each page is scored out of 100 points:

| Category | Points | Description |
|----------|--------|-------------|
| Spacing | 20 | Main container and grid spacing |
| Typography | 25 | Heading hierarchy and CardTitle usage |
| Colors | 25 | Design token usage and forbidden patterns |
| Components | 15 | Card transparency and PageHeader usage |
| Accessibility | 15 | ARIA landmarks on sections |

**Threshold:** ≥95% to pass

## Baseline Patterns

### Spacing
- Main container: `space-y-6` (24px)
- Grid gaps: `gap-4` (16px)

### Typography
- Main heading: `<h2 className="text-2xl font-semibold">`
- Card titles: Default `CardTitle` (no size override)
- Descriptions: `text-muted-foreground`

### Colors
- **Required tokens:** `bg-card`, `text-card-foreground`, `bg-transparent`, `text-muted-foreground`, `text-foreground`, `text-destructive`, `bg-muted`, `border-border`
- **Forbidden:** `text-purple-*`, `bg-purple-*`, `border-purple-*`, `badge-purple`, hardcoded hex colors

### Components
- Cards: `CardContent` and `CardHeader` must use `bg-transparent`
- PageHeader: Required on mobile, inline header on desktop

### Accessibility
- All major sections: `role="region"` with `aria-labelledby`
- Proper heading hierarchy (h2, h3)

## Report Structure

### JSON Report
```json
{
  "timestamp": "ISO date",
  "baseline": { ... },
  "results": [
    {
      "page": "PageName",
      "parity": {
        "score": 95,
        "maxScore": 100,
        "percentage": 95,
        "passed": true
      },
      "issues": { ... }
    }
  ],
  "summary": { ... }
}
```

### Markdown Report
Human-readable report with:
- Summary statistics
- Detailed results per page
- Parity breakdown by category
- Issues found with suggestions

## Auto-Fix Suggestions

The system generates safe suggestions for:
1. **Spacing:** Replace incorrect spacing classes
2. **Colors:** Replace hardcoded colors with design tokens
3. **Components:** Add missing `bg-transparent` to cards
4. **Typography:** Remove forbidden CardTitle size overrides

**Safety:** All suggestions are marked as "safe" when they can be applied automatically without risk.

## Updating Baseline

When design patterns change:

1. Update CompetitiePage to reflect new patterns
2. Update `.audit/baseline-config.json` accordingly
3. Re-run audit to verify alignment
4. Update other pages to match new baseline

## Example Output

```
🔍 Starting page consistency audit...

📄 Auditing AlgemeenPage...
📄 Auditing ReglementPage...
📄 Auditing CompetitiePage...
📄 Auditing PublicBekerPage...
📄 Auditing PlayOffPage...

✅ JSON report saved: .audit/reports/audit-1234567890.json
✅ Markdown report saved: .audit/reports/consistency-report.md

📊 Audit Summary:
   Total pages: 5
   Passed (≥95%): 4
   Failed (<95%): 1
   Average score: 94%

📈 Individual Scores:
   ✅ AlgemeenPage: 98%
   ✅ ReglementPage: 100%
   ✅ CompetitiePage: 100%
   ✅ PublicBekerPage: 97%
   ❌ PlayOffPage: 92%
```

## Troubleshooting

### Low Scores

If pages score below 95%:

1. Check the markdown report for specific issues
2. Review auto-fix suggestions
3. Apply fixes manually or via codemod
4. Re-run audit to verify

### False Positives

The audit uses regex patterns that may occasionally:
- Miss patterns in complex JSX structures
- Flag acceptable variations

If you encounter false positives:
1. Review the baseline configuration
2. Adjust detection patterns in `audit-pages.js`
3. Update baseline if pattern is acceptable

## Future Enhancements

Potential improvements:
- AST-based parsing for more accurate detection
- Visual regression testing integration
- Automated fix application (codemod)
- Historical trend tracking
- Custom baseline per page type

