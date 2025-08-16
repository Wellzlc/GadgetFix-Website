# Technical Decisions
> Record of architectural and technical choices for the GadgetFix Website
> Established: January 16, 2025

## 📐 Decision Record Format

Each technical decision is documented using the Architecture Decision Record (ADR) format, capturing the context, decision, and consequences.

## 🎯 Active Technical Decisions

### TD-001: Schema Markup Architecture
**Date**: 2025-01-16
**Status**: ✅ Implemented
**Category**: SEO / Frontend

#### Context
- Multiple pages showing aggregateRating schema errors in Google Search Console
- Schema markup exists in both Layout.astro (global) and individual page files
- Discovery: TRIPLE schema injection (Layout.astro + schema.js + pages)
- Google requires either 'offers', 'review', or 'aggregateRating' to be specified
- Duplicate schema causes validation errors

#### Decision
Remove ALL global aggregateRating implementations. Delete schema.js file. Keep only page-level schema implementations.

#### Rationale
1. **Single Responsibility**: Each page knows its own rating data
2. **No Duplication**: Prevents conflicts and errors
3. **Flexibility**: Different pages can have different ratings
4. **Google Compliance**: Meets Google's schema requirements
5. **Maintenance**: Easier to manage without multiple sources

#### Consequences
**Positive**:
- ✅ Eliminated all schema duplication errors
- ✅ Improved SEO compliance (validation passed)
- ✅ Allows page-specific ratings
- ✅ Removed outdated schema.js with old phone number

**Negative**:
- Each page must maintain its own schema (acceptable trade-off)

#### Implementation (COMPLETED)
- ✅ Removed aggregateRating from Layout.astro (lines 256-262)
- ✅ Deleted schema.js reference from Layout.astro (line 154)
- ✅ Deleted /public/js/schema.js file entirely
- ✅ Created validation script (validate-schema.cjs)
- ✅ Validated with Google Rich Results Test - PASSED

#### Validation Script
**Location**: `/scripts/validate-schema.cjs`
**Purpose**: Automated checking for schema conflicts
**Result**: All 89 files validated successfully

---

### TD-002: Form Protection Strategy
**Date**: 2025-01-14 (Historical)
**Status**: ✅ Implemented
**Category**: Security / UX

#### Context
- Forms receiving spam submissions
- Need to balance security with user experience
- Previous complex validation broke form input ability

#### Decision
Implement layered protection with simple validation:
1. Honeypot fields (hidden from users)
2. Rate limiting (30-second cooldown)
3. AJAX submission
4. Cloudflare Turnstile (when needed)
5. NO complex regex validation

#### Rationale
- Simple validation doesn't break user input
- Multiple light layers better than one heavy layer
- Progressive enhancement maintains accessibility

#### Consequences
**Positive**:
- Forms remain functional
- Spam significantly reduced
- User experience preserved

**Negative**:
- Not 100% spam proof
- Requires monitoring

---

### TD-003: Business Model Pivot
**Date**: 2025-01-13 (Historical)
**Status**: ✅ Implemented
**Category**: Business / Content

#### Context
- Original site focused on mobile phone repair
- Business pivoted to software-only computer services
- 90+ files contained phone repair keywords

#### Decision
Complete transformation to computer service focus:
- Replace all phone repair references with computer services
- Focus on software services only (virus removal, optimization, etc.)
- No hardware repair services

#### Rationale
- Align website with actual business model
- Improve SEO relevance
- Reduce customer confusion

#### Consequences
**Positive**:
- Clear business positioning
- Better SEO alignment
- Accurate customer expectations

**Negative**:
- Lost phone repair SEO rankings
- Required extensive content updates

---

### TD-003: Security Architecture - Prevention System
**Date**: 2025-01-16
**Status**: ✅ Implemented
**Category**: Security / Infrastructure

#### Context
- Third security incident discovered (pattern of breaches)
- .vercel build directory with 364 files exposed in Git
- Hardcoded admin password in build artifacts
- Previous incidents: admin password in source, private key exposures
- No automated security checks existed

#### Decision
Implement comprehensive security prevention system with automated checks at multiple levels.

#### Rationale
1. **Automation**: Human review insufficient - need automated blocking
2. **Defense in Depth**: Multiple layers of protection
3. **Fail-Safe**: Pre-commit hooks prevent accidents
4. **Visibility**: Regular audits catch issues early
5. **Pattern Breaking**: Stop recurring security incidents

#### Consequences
**Positive**:
- ✅ Automatic prevention of secret commits
- ✅ Build directories protected from exposure
- ✅ Security score improved from 2/10 to 8/10
- ✅ Pattern of breaches broken

**Negative**:
- Slightly slower commit process (acceptable for security)
- Must maintain security tools

#### Implementation (COMPLETED)
- ✅ Created pre-commit hook (.git/hooks/pre-commit)
- ✅ Developed security-check.cjs scanner
- ✅ Updated .gitignore with .vercel/
- ✅ Removed all exposed secrets from repository
- ✅ Documented security protocols

#### Security Tools
**Pre-commit Hook**: `.git/hooks/pre-commit`
**Scanner**: `/scripts/security-check.cjs`
**Checks**: Passwords, private keys, API keys, service accounts, .env files

---

## 🔮 Pending Decisions

### PD-001: Monitoring Stack Selection
**Category**: Infrastructure
**Options Under Consideration**:
1. Sentry + Uptime Robot + GTmetrix
2. New Relic (all-in-one)
3. Custom solution with open source tools

**Factors to Consider**:
- Cost
- Integration complexity
- Feature completeness
- Learning curve

**Target Decision Date**: 2025-02-01

---

### PD-002: Testing Framework
**Category**: Development
**Options Under Consideration**:
1. Vitest (already in package.json)
2. Jest
3. Playwright for E2E

**Factors to Consider**:
- Astro compatibility
- Test execution speed
- Feature coverage
- Team familiarity

**Target Decision Date**: 2025-01-31

---

## 📊 Decision Statistics

### By Category
| Category | Implemented | Pending | Rejected |
|----------|-------------|---------|----------|
| SEO | 0 | 1 | 0 |
| Security | 1 | 0 | 0 |
| Business | 1 | 0 | 0 |
| Infrastructure | 0 | 1 | 0 |
| Development | 0 | 1 | 0 |

### By Impact
| Impact Level | Count |
|--------------|-------|
| High | 3 |
| Medium | 2 |
| Low | 0 |

## 🚫 Rejected Decisions

*(None yet - will document alternatives that were considered but rejected)*

## 📋 Decision Template

```markdown
### TD-XXX: [Decision Title]
**Date**: YYYY-MM-DD
**Status**: 🟡 Pending / ✅ Implemented / ❌ Rejected
**Category**: Category/Subcategory

#### Context
[What is the issue we're trying to solve?]

#### Decision
[What have we decided to do?]

#### Rationale
[Why did we make this decision?]

#### Consequences
**Positive**:
- [Good outcomes]

**Negative**:
- [Trade-offs or downsides]

#### Implementation
[How will this be implemented?]

#### Alternatives Considered
[Other options that were evaluated]
```

## 🎯 Decision Principles

### Core Principles
1. **Simplicity First**: Choose simple solutions over complex ones
2. **User Experience**: Never sacrifice UX for technical elegance
3. **Maintainability**: Prefer maintainable over clever
4. **Performance**: Consider performance impact
5. **Security**: Security is not optional

### Decision Factors
When making technical decisions, consider:
- **Impact**: How many users/components affected?
- **Reversibility**: Can we easily change this later?
- **Cost**: Development time and maintenance burden
- **Risk**: What could go wrong?
- **Alignment**: Does it fit our architecture?

## 📈 Decision Review Schedule

### Monthly Review
- Review pending decisions
- Evaluate implemented decisions
- Identify new decision points

### Quarterly Review
- Assess decision outcomes
- Update principles if needed
- Archive old decisions

## 🔄 Change Management

### Changing a Decision
1. Document why change is needed
2. Assess impact of change
3. Create migration plan
4. Update this document
5. Communicate to team

### Learning from Decisions
- Document actual vs expected outcomes
- Identify patterns in good/bad decisions
- Update decision principles
- Share lessons learned

---

*Every significant technical choice should be documented here. This creates a searchable history of why things are the way they are.*