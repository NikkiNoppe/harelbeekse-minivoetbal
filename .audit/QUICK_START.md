# Quick Start Guide - Page Consistency Audit

## Run Audit

```bash
node scripts/audit-pages.js
```

## View Results

1. **Console Output:** Immediate summary with scores
2. **Markdown Report:** `.audit/reports/consistency-report.md` - Human-readable
3. **JSON Report:** `.audit/reports/audit-{timestamp}.json` - Machine-readable

## Get Auto-Fix Suggestions

```bash
node scripts/auto-fix-suggestions.js
```

View suggestions in: `.audit/reports/auto-fix-suggestions.json`

## CI/CD

The audit runs automatically on PRs. To run manually:

```bash
# In CI/CD pipeline
node scripts/audit-pages.js
# Exit code 1 = failure (pages below 95%)
# Exit code 0 = success (all pages ≥95%)
```

## Fix Issues

1. Review the markdown report for specific issues
2. Check auto-fix suggestions for safe replacements
3. Apply fixes manually
4. Re-run audit to verify

## Threshold

- **Pass:** ≥95% parity score
- **Fail:** <95% parity score

