# GadgetFix Anti-Spam System Documentation

## Overview
This document provides comprehensive documentation for the multi-layered anti-spam system implemented on the GadgetFix website. The system protects contact forms from spam, scams, and automated bot submissions while ensuring legitimate customers can easily reach you.

## System Architecture

### Core Components

1. **SpamGuard** (`src/lib/antispam/SpamGuard.ts`)
   - Main orchestrator for all anti-spam operations
   - Coordinates multiple detection layers
   - Makes final allow/block/quarantine decisions

2. **Detection Modules**
   - **ThreatDetector**: Immediate threat detection (crypto scams, suspicious URLs)
   - **BehavioralAnalyzer**: Analyzes user interaction patterns
   - **MLClassifier**: Machine learning-based classification
   - **RuleEngine**: Custom rule processing
   - **ThreatIntelligence**: IP reputation and blacklist checking

3. **Support Systems**
   - **QuarantineManager**: Handles borderline submissions
   - **Analytics**: Tracks system performance
   - **ConfigManager**: Centralized configuration

## Configuration

### Location
`src/lib/antispam/config.ts`

### Key Settings

```typescript
{
  blockThreshold: 0.9,        // Confidence > 90% = block
  quarantineThreshold: 0.7,   // Confidence > 70% = quarantine
  strictMode: false,           // When true, quarantines medium threats
  learningMode: true,          // Enables ML learning from feedback
  communitySharing: false,     // Share threat data with community
}
```

### Adjusting Thresholds

1. **Blocking Too Much Legitimate Traffic?**
   - Increase `blockThreshold` to 0.95
   - Decrease `quarantineThreshold` to 0.6
   - Set `strictMode` to false

2. **Too Much Spam Getting Through?**
   - Decrease `blockThreshold` to 0.85
   - Increase `quarantineThreshold` to 0.75
   - Enable `strictMode`

## Admin Dashboard

### Accessing the Dashboard
- URL: `/admin/antispam`
- Password: `Lc9401765@#$`

### Dashboard Features
- Real-time spam statistics
- Recent activity log
- Threat level indicator
- System performance metrics
- Configuration management

### Changing Admin Password

1. Open `src/pages/admin/antispam.astro`
2. Find line with `const ADMIN_PASSWORD = `
3. Update with new password
4. Clear browser localStorage to reset session

## Form Integration

### Protected Forms
1. **Contact Form** (`/contact`)
   - General inquiries
   - Phone repair requests

2. **Computer Support Form** (`/contact-computer`)
   - Computer troubleshooting requests
   - Additional device/issue type fields

### How Forms Work

1. User fills out form
2. JavaScript tracks behavioral metrics:
   - Typing speed
   - Mouse movements
   - Time spent on form
   - Field focus order

3. On submission:
   - Data sent to `/api/antispam/validate`
   - SpamGuard analyzes submission
   - Returns: allow/block/quarantine decision

4. If allowed:
   - Form sends email via FormSubmit.co
   - User sees success message

## Threat Detection Layers

### Layer 1: Immediate Threats
- Bitcoin/crypto scam keywords
- Suspicious URLs in unexpected fields
- Known spam patterns
- Honeypot field detection

### Layer 2: Behavioral Analysis
- Form filled too quickly (< 3 seconds)
- No mouse movement detected
- Copy-paste only submission
- Unusual field navigation

### Layer 3: Machine Learning
- Pattern recognition
- Historical data analysis
- Adaptive learning from feedback

### Layer 4: Rule Engine
- Custom business rules
- Field validation
- Cross-field consistency checks

### Layer 5: Threat Intelligence
- IP reputation checking
- Email domain validation
- Known attacker databases

## Managing Spam

### Viewing Blocked Submissions
Check server logs for entries marked `[SPAM BLOCKED]`:
```
[SPAM BLOCKED] IP: xxx.xxx.xxx.xxx, Confidence: 0.95, Threats: CRYPTO_SCAM, BOT_BEHAVIOR
```

### Handling Quarantined Submissions
Quarantined emails arrive with:
- Subject prefix: `[QUARANTINE]`
- Quarantine ID in message body
- Confidence score

Review these manually and provide feedback to improve the system.

### Whitelisting/Blacklisting

Add to `src/lib/antispam/config.ts`:

```typescript
whitelist: {
  emails: ['trusted@customer.com'],
  ips: ['192.168.1.1'],
  domains: ['trustedcompany.com']
}

blacklist: {
  emails: ['spammer@spam.com'],
  ips: ['123.456.789.0'],
  domains: ['spamsite.com']
}
```

## Troubleshooting

### Issue: Legitimate Customers Blocked

**Symptoms**: Customers report they can't submit forms

**Solutions**:
1. Check spam confidence in logs
2. Reduce `blockThreshold` 
3. Add customer to whitelist
4. Disable specific detection modules if causing false positives

### Issue: Too Much Spam in Quarantine

**Symptoms**: Many quarantined emails that are obvious spam

**Solutions**:
1. Lower `quarantineThreshold`
2. Enable `strictMode`
3. Add patterns to ThreatDetector rules

### Issue: Forms Not Submitting

**Check**:
1. Browser console for JavaScript errors
2. Network tab for failed API calls
3. Server logs for validation errors
4. FormSubmit.co service status

### Issue: Emails Not Arriving

**Verify**:
1. Forms show success message
2. Check spam/junk folder
3. Verify email address in FormSubmit configuration
4. Test FormSubmit.co directly

## Maintenance

### Daily Tasks
- Review quarantined submissions
- Check dashboard for unusual activity
- Monitor threat level trends

### Weekly Tasks
- Review blocked submission logs
- Update whitelist/blacklist as needed
- Check system performance metrics

### Monthly Tasks
- Analyze false positive/negative rates
- Adjust thresholds based on performance
- Update threat detection rules
- Review and clean up quarantine

## API Endpoints

### `/api/antispam/validate` (POST)
Validates form submissions for spam.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "message": "Message content",
  "formType": "contact",
  "submissionTime": 5000,
  "keystrokes": 150,
  "mouseMovements": 200
}
```

**Response**:
```json
{
  "success": true,
  "action": "allow|block|quarantine",
  "message": "Status message",
  "confidence": 0.85
}
```

### `/api/antispam/dashboard` (GET)
Returns dashboard statistics.

### `/api/antispam/config` (GET/POST)
Get or update system configuration.

## Security Considerations

1. **Never expose**:
   - Admin password in client-side code
   - Internal API endpoints publicly
   - Detailed spam detection logic

2. **Regularly update**:
   - Threat detection patterns
   - IP blacklists
   - Admin password

3. **Monitor for**:
   - Bypass attempts
   - Unusual traffic patterns
   - Performance degradation

## Performance Optimization

### If Forms Are Slow

1. **Reduce Detection Layers**:
   ```typescript
   modules: {
     threatDetector: true,
     behavioralAnalyzer: true,
     mlClassifier: false,  // Disable if slow
     ruleEngine: true,
     threatIntelligence: false  // Disable if slow
   }
   ```

2. **Optimize Threat Feeds**:
   - Reduce update frequency
   - Use cached results
   - Limit feed size

3. **Adjust Timeouts**:
   - Increase API timeout values
   - Implement request caching

## Extending the System

### Adding New Threat Patterns

Edit `src/lib/antispam/modules/ThreatDetector.ts`:

```typescript
const THREAT_PATTERNS = {
  // Add new pattern
  NEW_SCAM_TYPE: {
    patterns: [/pattern1/gi, /pattern2/gi],
    weight: 0.8,
    description: 'Description of threat'
  }
};
```

### Creating Custom Rules

Edit `src/lib/antispam/modules/RuleEngine.ts`:

```typescript
// Add custom rule
if (submission.fields.phone && !isValidPhoneNumber(submission.fields.phone)) {
  threats.push({
    type: 'INVALID_PHONE',
    confidence: 0.7,
    description: 'Invalid phone number format'
  });
}
```

### Integrating with Other Services

The system can be extended to:
- Send alerts via email/SMS
- Log to external services
- Integrate with CRM systems
- Connect to threat intelligence APIs

## Support

For issues or questions:
1. Check this documentation
2. Review server logs
3. Test in development environment
4. Contact system administrator

## Version History

- **v1.0.0** (Current): Initial implementation
  - Multi-layered threat detection
  - Admin dashboard
  - FormSubmit.co integration
  - Quarantine system

## Future Enhancements

Planned improvements:
- Advanced ML models
- Real-time threat sharing
- Mobile app for admin management
- Automated threat response
- A/B testing for thresholds
- Custom reporting dashboard