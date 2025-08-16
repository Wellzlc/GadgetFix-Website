# Issue Tracker
> Real-time tracking of all problems encountered in the GadgetFix Website project
> Established: January 16, 2025

## 📋 Issue Status Legend
- 🔴 **Open** - Issue identified, not yet addressed
- 🟡 **In Progress** - Currently being worked on
- 🟢 **Resolved** - Fixed and validated
- ⚫ **Closed** - No longer relevant or duplicate
- 🔄 **Recurring** - Issue that has appeared multiple times

## 🚨 Active Issues

### ISSUE-2025-01-16-002
**Timestamp**: 2025-01-16 15:00:00
**Severity**: Critical
**Category**: Security
**Description**: Third security incident - .vercel build directory with 364 files exposed in Git repository
**Error Message**: "Hardcoded admin password detected in build artifacts"
**Files Affected**: 
- `.vercel/` directory (364 files) - REMOVED
- Contains hardcoded password "Lc9401765@#$"
- Build artifacts with potential sensitive data
**Status**: 🟢 Resolved
**Related Issues**: Previous security incidents (admin password, private keys)
**Resolution Time**: 30 minutes
**Fix Applied**: FIX-2025-01-16-002
**Notes**: Pattern of recurring security breaches. Implemented comprehensive prevention with pre-commit hooks and security scanning.

### ISSUE-2025-01-16-001
**Timestamp**: 2025-01-16 13:00:00
**Severity**: High
**Category**: SEO
**Description**: Multiple aggregateRating schema violations causing Google Search Console errors
**Error Message**: "Either 'offers', 'review', or 'aggregateRating' should be specified"
**Files Affected**: 
- `/src/layouts/Layout.astro` (global schema) - FIXED
- `/public/js/schema.js` (outdated duplicate) - DELETED
- Multiple service pages with duplicate ratings - RESOLVED
**Status**: 🟢 Resolved
**Related Issues**: None
**Resolution Time**: 45 minutes
**Fix Applied**: FIX-2025-01-16-001
**Notes**: Triple schema injection discovered - Layout.astro, schema.js, and page-level. All duplicates removed, validation script created.

---

## 📊 Issue Statistics

| Status | Count |
|--------|-------|
| 🔴 Open | 0 |
| 🟡 In Progress | 0 |
| 🟢 Resolved | 2 |
| ⚫ Closed | 0 |
| 🔄 Recurring | 0 |

## 📈 Issue Categories

| Category | Open | Resolved | Total |
|----------|------|----------|-------|
| SEO | 0 | 1 | 1 |
| Security | 0 | 1 | 1 |
| Performance | 0 | 0 | 0 |
| UI/UX | 0 | 0 | 0 |
| Backend | 0 | 0 | 0 |
| Forms | 0 | 0 | 0 |
| Build | 0 | 0 | 0 |

## 🔄 Recurring Issues Pattern

*(No recurring patterns identified yet)*

## 📝 Issue Template

```markdown
### ISSUE-YYYY-MM-DD-XXX
**Timestamp**: YYYY-MM-DD HH:MM:SS
**Severity**: Critical/High/Medium/Low
**Category**: SEO/Security/Performance/UI/Backend/Forms/Build
**Description**: Clear description of the problem
**Error Message**: Any error output or console messages
**Files Affected**: List of files with paths
**Status**: 🔴 Open / 🟡 In Progress / 🟢 Resolved / ⚫ Closed
**Related Issues**: Links to related problems
**Notes**: Additional context or observations
```

## 🎯 Resolution Tracking

### Issues by Resolution Time
- **< 1 hour**: 0
- **1-4 hours**: 0
- **4-24 hours**: 0
- **> 24 hours**: 0
- **Unresolved**: 1

## 🔍 Search Tags

#aggregateRating #schema #SEO #GoogleSearchConsole #duplicate-schema

---

*Update this document immediately upon discovering any issue. Cross-reference with FIX_REGISTRY.md when resolved.*