# Page Consistency Audit System

Automated consistency audit for all public pages using CompetitiePage as the baseline reference.

## Overview

This audit system ensures all public pages maintain consistent:
- Spacing patterns (`space-y-6` for main containers)
- Typography hierarchy (`h2 text-2xl font-semibold` for main headings)
- Design token usage (no hardcoded colors)
- Component patterns (Card with `bg-transparent`, PageHeader on mobile)
- Accessibility features (ARIA landmarks on sections)

## Files

- `baseline-config.json` - Baseline configuration extracted from CompetitiePage
- `reports/` - Directory containing generated audit reports
- `../scripts/audit-pages.js` - Main audit script

## Usage

### Run Audit

```bash
# From project root
node scripts/audit-pages.js
```

### CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Page Consistency Audit
  run: node scripts/audit-pages.js
```

The script exits with code 1 if any page scores below 95%, making it suitable for CI/CD.

## Baseline Configuration

The baseline is defined in `.audit/baseline-config.json` and includes:

- **Spacing**: Required spacing classes for containers and grids
- **Typography**: Heading hierarchy and CardTitle requirements
- **Colors**: Required design tokens and forbidden hardcoded patterns
- **Components**: Card and PageHeader patterns
- **Accessibility**: ARIA landmark requirements

## Audit Scoring

Each page is scored out of 100 points:

- **Spacing** (20 points): Main container and grid spacing
- **Typography** (25 points): Heading hierarchy and CardTitle usage
- **Colors** (25 points): Design token usage and forbidden patterns
- **Components** (15 points): Card transparency and PageHeader usage
- **Accessibility** (15 points): ARIA landmarks on sections

**Threshold**: ≥95% to pass

## Reports

Reports are generated in `.audit/reports/`:

- `audit-{timestamp}.json` - Machine-readable JSON report
- `consistency-report.md` - Human-readable Markdown report

## Auto-Fix Suggestions

The audit provides auto-fix suggestions for:
- Color token replacements (e.g., `text-purple-800` → `text-foreground`)
- Spacing corrections
- Missing ARIA attributes

## Updating Baseline

To update the baseline after design changes:

1. Update CompetitiePage to reflect new patterns
2. Update `.audit/baseline-config.json` accordingly
3. Re-run audit to verify all pages align

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
   Passed (≥95%): 5
   Failed (<95%): 0
   Average score: 98%

📈 Individual Scores:
   ✅ AlgemeenPage: 98%
   ✅ ReglementPage: 97%
   ✅ CompetitiePage: 100%
   ✅ PublicBekerPage: 98%
   ✅ PlayOffPage: 97%
```

