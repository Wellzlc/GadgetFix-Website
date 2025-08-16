# Schema Violation Prevention Strategies

## Automated Prevention

### 1. Pre-Commit Hook for Schema Validation
Create `.husky/pre-commit`:
```bash
#!/bin/sh
# Check for duplicate aggregateRating
if grep -q "aggregateRating" src/layouts/Layout.astro; then
  echo "ERROR: aggregateRating found in Layout.astro!"
  echo "This will cause duplicate ratings on all pages."
  echo "Move aggregateRating to individual pages only."
  exit 1
fi
```

### 2. Build-Time Schema Validation Script
Create `scripts/validate-schema.js`:
```javascript
const fs = require('fs');
const path = require('path');

// Check Layout.astro doesn't have aggregateRating
const layoutPath = path.join(__dirname, '../src/layouts/Layout.astro');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

if (layoutContent.includes('aggregateRating')) {
  console.error('❌ ERROR: Layout.astro contains aggregateRating');
  console.error('This creates duplicate ratings across all pages');
  process.exit(1);
}

console.log('✅ Schema validation passed');
```

Add to package.json:
```json
"scripts": {
  "prebuild": "node scripts/validate-schema.js",
  "build": "astro build"
}
```

### 3. Automated Testing with Playwright
Create `tests/schema.spec.js`:
```javascript
import { test, expect } from '@playwright/test';

test('no duplicate aggregateRating on pages', async ({ page }) => {
  await page.goto('/virus-removal-service');
  
  // Get all schema scripts
  const schemas = await page.$$eval('script[type="application/ld+json"]', 
    scripts => scripts.map(s => s.textContent)
  );
  
  // Count aggregateRating occurrences
  let count = 0;
  schemas.forEach(schema => {
    if (schema.includes('aggregateRating')) count++;
  });
  
  expect(count).toBeLessThanOrEqual(1);
});
```

## Manual Prevention Checklist

### Before Every Deployment
- [ ] Run `grep -r "aggregateRating" src/layouts/` - should return NOTHING
- [ ] Run `npm run build` - should complete without errors
- [ ] Test one page with Rich Results Test
- [ ] Check Google Search Console for new errors

### Weekly Reviews
- [ ] Audit Google Search Console > Enhancements > Review snippets
- [ ] Check for structured data errors or warnings
- [ ] Validate 5 random pages with schema validator

### Monthly Audits
- [ ] Full site crawl with Screaming Frog for schema issues
- [ ] Review all aggregateRating implementations
- [ ] Update review content to match current services
- [ ] Check competitor schema for best practices

## Code Review Guidelines

### What to Check in PRs

#### ❌ REJECT if PR contains:
1. `aggregateRating` in any layout or component file
2. Reviews mentioning services not offered (phone repair, hardware)
3. Multiple schema blocks of same @type on one page
4. Nested LocalBusiness in reviews
5. Future-dated reviews

#### ✅ APPROVE if PR contains:
1. Page-specific aggregateRating only
2. Reviews matching actual services
3. Unique ratings per page
4. Valid schema structure
5. Realistic review dates

### PR Template Addition
Add to `.github/pull_request_template.md`:
```markdown
## Schema Checklist
- [ ] No aggregateRating in Layout.astro or shared components
- [ ] Reviews match current services (computer, not phone)
- [ ] Tested with Rich Results Test
- [ ] No duplicate schema types on same page
```

## Monitoring & Alerts

### Set Up Google Search Console Alerts
1. Go to Settings > Email preferences
2. Enable "Review snippets issues detected"
3. Set frequency to "As it happens"

### Create Uptime Robot Monitor
Monitor for schema presence:
```
URL: https://gadgetfixllc.com/api/schema-check
Alert if: Response doesn't contain valid schema
Check every: 60 minutes
```

### Weekly Schema Report Script
Create `scripts/weekly-schema-report.js`:
```javascript
const pages = [
  '/virus-removal-service',
  '/password-reset-service',
  '/emergency-computer-service',
  // ... add all pages
];

async function checkPage(url) {
  const response = await fetch(`https://gadgetfixllc.com${url}`);
  const html = await response.text();
  const aggregateCount = (html.match(/aggregateRating/g) || []).length;
  
  if (aggregateCount > 1) {
    console.error(`❌ ${url}: ${aggregateCount} aggregateRatings found`);
  } else if (aggregateCount === 1) {
    console.log(`✅ ${url}: Valid (1 aggregateRating)`);
  } else {
    console.log(`⚠️ ${url}: No aggregateRating`);
  }
}

// Run weekly via cron job
pages.forEach(checkPage);
```

## Training & Documentation

### Developer Onboarding
1. Read SCHEMA_GUIDELINES.md
2. Review FIX_REGISTRY.md for past issues
3. Complete schema validation tutorial
4. Shadow review 3 PRs with schema changes

### Regular Training
- Monthly: Review latest Google guidelines
- Quarterly: Schema best practices workshop
- Annually: Full schema audit training

## Emergency Response Plan

### If Google Manual Action Detected

#### Immediate (Within 1 Hour):
1. Check Search Console for specific violation
2. Run full site schema audit
3. Identify all affected pages
4. Create incident ticket

#### Short-term (Within 4 Hours):
1. Remove all violating schema
2. Deploy fix to production
3. Document changes in FIX_REGISTRY.md
4. Submit reconsideration request

#### Follow-up (Within 24 Hours):
1. Validate all pages with Rich Results Test
2. Monitor Search Console for updates
3. Implement prevention measures
4. Post-mortem meeting

### Escalation Path
1. **Level 1**: Developer on-call
2. **Level 2**: Technical Lead
3. **Level 3**: SEO Consultant
4. **Level 4**: Google Support (if available)

## Tools & Resources

### Essential Tools
- [Schema Validator](https://validator.schema.org/) - Primary validation
- [Rich Results Test](https://search.google.com/test/rich-results) - Google's tool
- [Structured Data Testing Tool](https://developers.google.com/search/docs/appearance/structured-data) - Documentation
- [JSON-LD Playground](https://json-ld.org/playground/) - Debug complex schema

### Browser Extensions
- SEO META in 1 CLICK - Quick schema check
- Structured Data Helper - Visual validation
- Schema Builder - Generate valid schema

### Monitoring Services
- Google Search Console - Primary monitoring
- Screaming Frog - Bulk validation
- Schema App - Advanced testing
- Botify - Enterprise monitoring

## Success Metrics

### KPIs to Track
1. **Schema Error Rate**: Target < 1% of pages
2. **Rich Snippet Appearance**: Target > 80% eligible pages
3. **Manual Actions**: Target = 0
4. **Fix Time**: Target < 4 hours for critical issues

### Monthly Reporting
- Total pages with schema: X
- Pages with valid schema: X (%)
- Pages with errors: X
- Average rating displayed: X.X
- CTR improvement from rich snippets: X%

---

**Document Created**: 2025-08-16
**Last Updated**: 2025-08-16
**Review Schedule**: Monthly
**Owner**: Technical SEO Team