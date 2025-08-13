# FAQ Schema Deployment Pipeline

A comprehensive 3-phase deployment pipeline for rolling out FAQ schema to 80+ location pages in the GadgetFix website with automated validation, monitoring, and rollback capabilities.

## Overview

This pipeline implements a safe, phased approach to deploying FAQ schema markup across location pages:

- **Phase 1**: 10 pilot pages (12.5%) with extensive monitoring
- **Phase 2**: 40 additional pages (50% total) after validation 
- **Phase 3**: Remaining 30 pages (100% total) for complete rollout

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Phase 1       │───▶│   Validation     │───▶│   Phase 2       │
│   (10 pages)    │    │   & Monitoring   │    │   (40 pages)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Health Checks  │    │   Phase 3       │
                       │   SEO Validation │    │   (30 pages)    │
                       │   Performance    │    │   Complete      │
                       └──────────────────┘    └─────────────────┘
```

## Features

### 🚀 Automated Deployment
- Target page selection with smart sampling
- Automated FAQ schema injection
- Validation at each step
- Comprehensive error handling

### 📊 Monitoring & Validation
- Real-time health checks
- SEO impact validation  
- Performance monitoring
- Schema markup validation

### 🔄 Rollback Capability
- Automatic safety backups
- One-click rollback
- Git state preservation
- Integrity validation

### 📋 Reporting
- Comprehensive deployment reports
- Multiple output formats (JSON, HTML, Markdown)
- Performance metrics
- SEO impact analysis

## Quick Start

### Prerequisites

1. Node.js 18+ installed
2. Git repository initialized
3. Netlify CLI configured (for deployment)
4. Required environment variables set

### Installation

```bash
cd scripts/deployment
npm install
```

### Basic Usage

```bash
# Run Phase 1 deployment
npm run deploy:phase1

# Validate schema implementation
npm run validate:schema

# Check deployment health
npm run health:check

# Generate deployment report
npm run report:generate -- --deployment-id=your-deployment-id --phase=phase1
```

## Deployment Process

### Phase 1: Pilot Deployment

Deploy to 10 representative pages across different counties:

```bash
# 1. Preview what will be deployed (dry run)
npm run dry-run:phase1

# 2. Create backup and deploy
npm run deploy:phase1

# 3. Validate deployment
npm run validate:schema phase1
npm run validate:seo phase1

# 4. Monitor health
npm run health:check

# 5. Generate report
npm run report:generate -- --deployment-id=<deployment-id> --phase=phase1
```

**Success Criteria:**
- 95% deployment success rate
- All validation checks pass
- No performance degradation
- SEO score maintained/improved

### Phase 2: Expanded Deployment

Deploy to 50% of total pages after Phase 1 validation:

```bash
# 1. Verify Phase 1 success
npm run validate:schema phase1

# 2. Deploy Phase 2
npm run deploy:phase2

# 3. Comprehensive validation
npm run validate:schema phase2
npm run validate:seo phase2
npm run health:check

# 4. Generate report
npm run report:generate -- --deployment-id=<deployment-id> --phase=phase2
```

**Success Criteria:**
- 90% deployment success rate  
- SEO metrics stable or improved
- Performance within thresholds
- No critical errors

### Phase 3: Complete Rollout

Deploy to all remaining pages:

```bash
# 1. Verify Phase 2 success
npm run validate:schema phase2

# 2. Deploy Phase 3
npm run deploy:phase3

# 3. Final validation
npm run validate:schema phase3
npm run validate:seo phase3
npm run health:check

# 4. Generate final report
npm run report:generate -- --deployment-id=<deployment-id> --phase=phase3
```

## GitHub Actions Workflow

### Manual Trigger

```yaml
# Trigger deployment via GitHub Actions
gh workflow run faq-schema-deployment.yml \
  -f phase=phase1 \
  -f target_branch=main
```

### Automated Validation Gates

Each phase includes automated validation:

1. **Pre-deployment validation**
   - Project structure check
   - Dependency validation
   - Target page identification

2. **Deployment validation**
   - Schema implementation check
   - Content validation
   - Syntax validation

3. **Post-deployment validation**
   - Health checks
   - SEO validation
   - Performance checks

## Rollback Procedures

### Emergency Rollback

```bash
# List available backups
npm run list:backups

# Rollback to previous state
npm run rollback -- --deployment-id=<deployment-id> --phase=<phase>

# Validate rollback
npm run validate:schema
npm run health:check
```

### Automatic Rollback Triggers

- Critical error rate > 10%
- Performance degradation > 20%
- SEO score drop > 15%
- Validation failure

## Monitoring & Alerts

### Health Check Monitoring

```bash
# Continuous monitoring
npm run monitor:deployment -- --deployment-id=<deployment-id> --duration=24h

# One-time health check
npm run health:check -- --url=https://gadgetfixllc.com --phase=phase1
```

### Key Metrics Monitored

- **Performance**: Page load time, Core Web Vitals
- **SEO**: Schema validation, search console metrics
- **Technical**: Error rates, console errors
- **User Experience**: Page accessibility, mobile usability

## Configuration

### Deployment Configuration

Edit `deployment-config.json` to customize:

```json
{
  "phases": {
    "phase1": {
      "percentage": 12.5,
      "strategy": "mixed_sample",
      "rollback_trigger": {
        "error_rate": 10,
        "performance_degradation": 20
      }
    }
  }
}
```

### Environment Variables

```bash
# Netlify deployment
NETLIFY_AUTH_TOKEN=your_token
NETLIFY_SITE_ID=your_site_id

# Monitoring (optional)
MONITORING_WEBHOOK_URL=your_webhook
SLACK_WEBHOOK_URL=your_slack_webhook
```

## Scripts Reference

### Core Deployment Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `get-target-pages.js` | Identify target pages for each phase | `node get-target-pages.js phase1` |
| `apply-faq-schema.js` | Apply FAQ schema to target pages | `node apply-faq-schema.js --phase=phase1` |
| `validate-schema.js` | Validate schema implementation | `node validate-schema.js phase1` |
| `health-checks.js` | Run comprehensive health checks | `node health-checks.js --url=https://site.com` |
| `seo-validation.js` | Validate SEO impact | `node seo-validation.js --url=https://site.com` |

### Backup & Rollback Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `create-backup.js` | Create deployment backup | `node create-backup.js deployment-id` |
| `rollback.js` | Rollback deployment | `node rollback.js --deployment-id=id --phase=phase1` |

### Monitoring & Reporting

| Script | Purpose | Usage |
|--------|---------|-------|
| `generate-report.js` | Generate deployment report | `node generate-report.js --deployment-id=id` |
| `monitor-deployment.js` | Continuous monitoring | `node monitor-deployment.js --duration=24h` |

## Command Line Options

### Common Options

- `--deployment-id=<id>`: Unique deployment identifier
- `--phase=<phase>`: Deployment phase (phase1, phase2, phase3)
- `--dry-run`: Preview changes without applying
- `--force`: Continue despite warnings
- `--url=<url>`: Target URL for validation

### Validation Options

- `--retries=<n>`: Number of retry attempts (default: 3)
- `--timeout=<ms>`: Request timeout (default: 30000)
- `--production=<bool>`: Production environment flag

## Troubleshooting

### Common Issues

**Deployment fails with validation errors:**
```bash
# Check specific validation issues
npm run validate:schema phase1 -- --verbose

# Fix issues and retry
npm run deploy:phase1
```

**Performance degradation detected:**
```bash
# Check performance metrics
npm run health:check -- --url=https://gadgetfixllc.com

# Rollback if necessary
npm run rollback -- --deployment-id=<id> --phase=phase1
```

**Schema markup not appearing:**
```bash
# Validate schema structure
npm run validate:schema phase1

# Check console for errors
# Verify component imports
```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=true npm run deploy:phase1

# Dry run to preview changes
npm run dry-run:phase1
```

## Best Practices

### Pre-Deployment

1. **Always run dry-run first**
2. **Verify backup creation**
3. **Check target page selection**
4. **Validate current site health**

### During Deployment

1. **Monitor health checks**
2. **Watch for validation failures**
3. **Check deployment logs**
4. **Verify schema rendering**

### Post-Deployment

1. **Run comprehensive validation**
2. **Generate deployment report**
3. **Monitor for 24-48 hours**
4. **Update monitoring dashboards**

## Support

### Logs Location

- Deployment logs: `logs/deployment/`
- Backup metadata: `.deployment-backups/`
- Reports: `.deployment-reports/`
- Status files: `.deployment-status/`

### Getting Help

1. Check deployment logs for errors
2. Run validation scripts to identify issues
3. Use `--dry-run` to preview changes
4. Generate reports for detailed analysis

## Advanced Features

### Custom Validation Rules

Create custom validation in `validate-schema.js`:

```javascript
// Add custom FAQ validation
function validateCustomFAQ(content) {
  // Your custom validation logic
  return { isValid: true, errors: [] };
}
```

### Custom Monitoring

Extend monitoring in `health-checks.js`:

```javascript
// Add custom health checks
async function customHealthCheck() {
  // Your custom monitoring logic
}
```

### Integration with External Tools

- **Google Search Console**: Monitor rich snippet performance
- **PageSpeed Insights**: Automated performance testing
- **Schema.org Validator**: Automated schema validation

## License

MIT License - see LICENSE file for details.

---

**Next Steps:**
1. Review and customize configuration files
2. Test with dry-run deployments
3. Set up monitoring dashboards
4. Schedule regular health checks
5. Plan post-deployment analysis