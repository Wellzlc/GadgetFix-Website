# Anti-Spam System Integration Guide

## Overview
The SpamGuard anti-spam system is now installed in your GadgetFix website. This guide will help you integrate it with your existing forms.

## Quick Start

### 1. Replace Your Existing Contact Forms

Replace your current contact form with the spam-protected version:

```astro
---
import SpamProtectedForm from '../components/SpamProtectedForm.astro';
---

<SpamProtectedForm 
  formId="contact-form"
  formType="contact"
/>
```

### 2. For Custom Forms

If you have custom forms, you can either:

#### Option A: Use the Protected Form Component
Modify the `SpamProtectedForm.astro` component to match your fields.

#### Option B: Add Protection to Existing Forms
Add this script to your existing form pages:

```html
<script src="/js/form-protection.js"></script>
<script>
  protectForm('your-form-id');
</script>
```

### 3. API Endpoints Available

- `POST /api/antispam/validate` - Validate form submissions
- `GET /api/antispam/dashboard` - Dashboard data (admin only)
- `POST /api/antispam/quarantine/{id}` - Review quarantined items
- `GET /api/antispam/report` - Generate reports
- `POST /api/antispam/config` - Update configuration

## Configuration

### Basic Settings

Edit `/src/lib/antispam/config.ts` to adjust:

```typescript
export const SPAM_CONFIG = {
  // Confidence thresholds
  blockThreshold: 0.9,      // Block if confidence > 90%
  quarantineThreshold: 0.7, // Quarantine if confidence > 70%
  
  // Rate limiting
  maxSubmissionsPerMinute: 3,
  maxSubmissionsPerHour: 10,
  
  // Enable/disable modules
  modules: {
    threatDetector: true,
    behavioralAnalyzer: true,
    mlClassifier: true,
    ruleEngine: true,
    threatIntelligence: true
  }
};
```

## Admin Dashboard

Access the admin dashboard to monitor and manage the anti-spam system:

1. Create an admin page:

```astro
---
// src/pages/admin/antispam.astro
import Layout from '../../layouts/Layout.astro';
import SpamGuardDashboard from '../../components/admin/SpamGuardDashboard.astro';

// Add authentication check here
---

<Layout title="Anti-Spam Dashboard">
  <SpamGuardDashboard />
</Layout>
```

2. Visit `/admin/antispam` to access the dashboard

## Testing the System

### Test Spam Detection

Try these test patterns to verify the system is working:

1. **Bitcoin Scam Test**: Include "bitcoin wallet address: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
2. **URL in Name Field**: Put "https://example.com" in the name field
3. **Rapid Submission**: Submit form in less than 3 seconds
4. **No Mouse Movement**: Submit without moving mouse (bot behavior)

### Monitor Results

Check the admin dashboard to see:
- Blocked submissions
- Quarantined items for review
- Threat detection patterns
- Performance metrics

## Customization

### Add Custom Rules

```typescript
// In your initialization code
spamGuard.ruleEngine.addRule({
  id: 'custom_rule_1',
  name: 'Block Specific Domain',
  conditions: [
    { field: 'email', operator: 'contains', value: 'spamdomain.com' }
  ],
  action: 'block',
  priority: 100,
  enabled: true,
  description: 'Block emails from spamdomain.com'
});
```

### Whitelist Trusted Sources

```typescript
// Add to whitelist
spamGuard.addToWhitelist('ip', '192.168.1.1');
spamGuard.addToWhitelist('email', 'trusted@domain.com');
```

## Handling Quarantined Items

When submissions are quarantined:

1. Admin receives notification (configure email/Slack)
2. Review in dashboard or via API
3. Approve or reject with one click
4. System learns from decisions

## Performance Optimization

For high-traffic sites:

1. **Enable Redis caching** (optional):
```typescript
// Add Redis for caching threat intelligence
import Redis from 'ioredis';
const redis = new Redis();
spamGuard.setCache(redis);
```

2. **Adjust processing modules**:
```typescript
// Disable heavy modules for speed
config.modules.mlClassifier = false; // Disable ML for faster processing
```

## Monitoring & Alerts

Set up monitoring:

1. **Email Alerts**:
```typescript
spamGuard.on('threat.critical', (threat) => {
  sendEmail('admin@gadgetfix.com', 'Critical threat detected', threat);
});
```

2. **Webhook Integration**:
```typescript
spamGuard.on('quarantine.new', async (entry) => {
  await fetch('https://hooks.slack.com/your-webhook', {
    method: 'POST',
    body: JSON.stringify({
      text: `New quarantine item: ${entry.id}`
    })
  });
});
```

## Troubleshooting

### Forms Not Being Protected

1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check form has correct class: `spam-protected-form`

### Too Many False Positives

1. Lower the thresholds in config
2. Review blocked submissions in dashboard
3. Add legitimate patterns to whitelist

### System Not Catching Spam

1. Enable learning mode to gather data
2. Review quarantine queue for patterns
3. Add custom rules for specific spam types

## Support

For issues or questions:
1. Check dashboard logs
2. Review `/api/antispam/diagnostics`
3. Export data for analysis

## Next Steps

1. ✅ Replace existing forms with SpamProtectedForm component
2. ✅ Set up admin dashboard page with authentication
3. ✅ Configure email/Slack notifications
4. ✅ Test with sample spam patterns
5. ✅ Monitor for first 24-48 hours
6. ✅ Adjust thresholds based on results