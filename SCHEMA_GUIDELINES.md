# Schema Markup Guidelines

## CRITICAL RULES - MUST FOLLOW

### 1. ONE aggregateRating Per Page ONLY
**NEVER** put aggregateRating in Layout.astro or any shared component that gets included on multiple pages.

**Why**: Google explicitly states that a page should describe only ONE thing. Multiple aggregateRatings violate this and can trigger manual penalties.

**Correct Implementation**:
- Each service page can have its own unique aggregateRating
- Each location page can have its own unique aggregateRating
- Homepage should NOT have aggregateRating if using Layout.astro schema

### 2. Reviews Must Match Current Services
All review content must reflect the current business model (computer services), not legacy services (phone repair).

**Bad Example** (DO NOT USE):
```json
"reviewBody": "Amazing service! My iPhone 14 screen was cracked..."
```

**Good Example**:
```json
"reviewBody": "Fast virus removal service! They came to my office..."
```

### 3. No Nested LocalBusiness in Reviews
Never nest a LocalBusiness type inside itemReviewed for reviews.

**Wrong**:
```json
"review": {
  "@type": "Review",
  "itemReviewed": {
    "@type": "LocalBusiness",  // WRONG - causes duplication
    "name": "GadgetFix"
  }
}
```

**Correct**:
```json
"review": {
  "@type": "Review",
  // No itemReviewed needed when review is part of LocalBusiness
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5"
  }
}
```

## Implementation Strategy

### For Layout.astro
- Include ONLY business information (name, address, phone, services)
- NO aggregateRating
- NO reviews

### For Individual Pages
Each page can include its own:
- aggregateRating specific to that service/location
- Reviews relevant to that specific service
- Unique review counts and ratings

### Example Structure

**Layout.astro** (Shared across all pages):
```json
{
  "@context": "https://schema.org",
  "@type": "ComputerStore",
  "name": "GadgetFix LLC",
  "telephone": "+1-469-430-8607",
  "address": { ... },
  "hasOfferCatalog": { ... }
  // NO aggregateRating here!
  // NO reviews here!
}
```

**Service Page** (e.g., virus-removal-service.astro):
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Virus Removal Service",
  "provider": {
    "@type": "ComputerStore",
    "name": "GadgetFix LLC"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "156"
  },
  "review": [ ... ]  // Service-specific reviews
}
```

## Testing & Validation

### Before Deployment Checklist
1. **Build Test**: Run `npm run build` - should complete without errors
2. **Schema Validation**: Use https://validator.schema.org/
3. **Rich Results Test**: Use https://search.google.com/test/rich-results
4. **Duplicate Check**: Search codebase for "aggregateRating" - ensure no duplicates on same page

### Command to Check for Duplicates
```bash
# Find all files with aggregateRating
grep -r "aggregateRating" src/ --include="*.astro"
```

## Common Violations to Avoid

### ❌ DON'T DO THIS:
1. Multiple aggregateRating blocks on one page
2. AggregateRating in shared components/layouts
3. Reviews mentioning services you don't offer
4. Inconsistent rating values across the site
5. Review dates in the future
6. Generic/templated review text

### ✅ DO THIS INSTEAD:
1. One aggregateRating per unique page
2. Page-specific ratings only
3. Reviews that match actual services
4. Consistent but unique ratings per service
5. Realistic review dates
6. Authentic, specific review content

## Google Penalties

### What Can Happen
- **Manual Action**: Site-wide ranking penalty
- **Loss of Rich Snippets**: Stars disappear from search results
- **Reduced CTR**: Lower click-through rates without rich results
- **De-indexing**: Severe cases can lead to removal from search

### Recovery Process
If penalized:
1. Fix all schema violations immediately
2. Request review in Google Search Console
3. Wait 2-4 weeks for response
4. Monitor Search Console for errors

## Monitoring

### Weekly Checks
- Google Search Console > Enhancements > Review Snippets
- Check for new errors or warnings
- Validate sample pages with Rich Results Test

### Monthly Audit
- Full site schema validation
- Review all aggregateRating implementations
- Update review content if needed

## Resources
- [Google Structured Data Guidelines](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Schema.org Validator](https://validator.schema.org/)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Google Search Console](https://search.google.com/search-console)

---

**Last Updated**: 2025-08-16
**Critical Fix Applied**: Removed duplicate aggregateRating from Layout.astro
**Next Review Date**: 2025-08-23