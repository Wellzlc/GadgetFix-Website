# Schema Markup Prevention Guide
**Last Updated:** January 16, 2025  
**Purpose:** Prevent future schema conflicts and Google Search Console errors

## Critical Rules - NEVER BREAK THESE

### Rule 1: NO aggregateRating in Layout.astro
**Why:** Layout.astro is used by EVERY page. Any schema here gets duplicated.
**Impact:** Google sees multiple conflicting ratings = SEO penalty
**Fix:** Only add aggregateRating to specific service/product pages

### Rule 2: NO External Schema JavaScript Files
**Why:** Deferred loading creates duplicate schemas
**Files to avoid:**
- `/js/schema.js`
- `/js/structured-data.js`
- Any JS that injects schema after page load

### Rule 3: ONE aggregateRating Per Page Maximum
**Check before adding:**
```javascript
// Run in browser console
document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
  if (s.textContent.includes('aggregateRating')) {
    console.log('Page already has aggregateRating!');
  }
});
```

## Development Workflow

### Before Adding Schema:

1. **Check Layout.astro First**
   ```bash
   grep -n "aggregateRating" src/layouts/Layout.astro
   ```
   If found, STOP - it's already on every page!

2. **Run Validation Script**
   ```bash
   node scripts/validate-schema.cjs
   ```
   Must show "VALIDATION PASSED" before proceeding

3. **Test with Google Rich Results**
   - Go to: https://search.google.com/test/rich-results
   - Test your localhost URL
   - Fix any errors before committing

## Schema Registry

Track ALL schema implementations here:

| Page | Schema Type | Has Rating? | Rating Value | Last Updated |
|------|------------|-------------|--------------|--------------|
| Layout.astro | ComputerStore | NO | - | 2025-01-16 |
| services.astro | Service | YES | 4.8 (267) | 2025-01-16 |
| networking-cabling.astro | Service | YES | 4.9 (47) | 2025-01-16 |
| virus-removal-service.astro | Service | NO | - | 2025-01-16 |
| password-reset-service.astro | Service | NO | - | 2025-01-16 |

## Common Mistakes & How to Avoid

### Mistake 1: Adding Schema via JavaScript
```javascript
// ❌ WRONG - Creates duplicate
setTimeout(() => {
  const schema = document.createElement('script');
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({...});
  document.head.appendChild(schema);
}, 2000);
```

```html
<!-- ✅ CORRECT - Inline in HTML -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  ...
}
</script>
```

### Mistake 2: Nested LocalBusiness in Reviews
```json
// ❌ WRONG
{
  "@type": "Review",
  "itemReviewed": {
    "@type": "LocalBusiness",  // Don't nest business in review!
    "name": "GadgetFix"
  }
}
```

```json
// ✅ CORRECT
{
  "@type": "Review",
  "itemReviewed": {
    "@type": "Service",  // Reference the service, not business
    "name": "Computer Repair Service"
  }
}
```

### Mistake 3: Multiple Business Types
```json
// ❌ WRONG - Conflicting types
{
  "@type": ["ComputerStore", "MobilePhoneStore"],  // Pick ONE!
}
```

```json
// ✅ CORRECT - Single primary type
{
  "@type": "ComputerStore",
  "additionalType": ["MobileService", "OnSiteService"]
}
```

## Testing Checklist

### Local Testing:
- [ ] Run `node scripts/validate-schema.cjs`
- [ ] Check browser console for duplicate schemas
- [ ] View page source - search for "aggregateRating"
- [ ] Count `<script type="application/ld+json">` tags

### Google Testing:
- [ ] Rich Results Test: https://search.google.com/test/rich-results
- [ ] Schema Validator: https://validator.schema.org/
- [ ] Google Search Console > Enhancements > Review snippets

### Common Commands:
```bash
# Find all aggregateRating instances
grep -r "aggregateRating" src/ --include="*.astro"

# Count schema scripts in a file
grep -c "application/ld+json" src/layouts/Layout.astro

# Find old phone numbers
grep -r "402-416-6942" src/ public/

# Validate all schemas
node scripts/validate-schema.cjs
```

## Emergency Fixes

### If Google Shows Errors:

1. **Immediate Action:**
   ```bash
   # Check for duplicates
   node scripts/validate-schema.cjs
   
   # Remove aggregateRating from Layout if present
   # Lines to delete: usually around 256-262
   ```

2. **Quick Fix Script:**
   ```bash
   # Remove all aggregateRating from Layout.astro
   sed -i '/"aggregateRating"/,/},/d' src/layouts/Layout.astro
   ```

3. **Verify Fix:**
   - Deploy to staging
   - Test with Rich Results Tool
   - Request revalidation in Search Console

## Monitoring

### Weekly Checks:
1. Google Search Console > Enhancements
2. Check for new schema errors
3. Run validation script
4. Update this registry

### Monthly Audit:
1. Full schema validation
2. Check all service pages
3. Verify phone numbers are current
4. Test random pages with Rich Results

## Contact for Schema Issues

**Primary:** Development team
**Escalation:** SEO specialist
**Emergency:** If Google manual action, notify immediately

## Automated Validation

Add to CI/CD pipeline:
```yaml
# .github/workflows/schema-check.yml
name: Schema Validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: node scripts/validate-schema.cjs
```

## Key Takeaways

1. **Layout.astro = Global** - Never put page-specific schema here
2. **One Rating Per Page** - Multiple ratings confuse Google
3. **Test Before Deploy** - Use Rich Results Tool
4. **Document Everything** - Update this registry
5. **Monitor Weekly** - Catch issues early

---

**Remember:** Schema errors can take 2-4 weeks to clear from Google Search Console even after fixing. Be patient and monitor progress.