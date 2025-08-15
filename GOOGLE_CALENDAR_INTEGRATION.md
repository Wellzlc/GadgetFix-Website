# Google Calendar Integration Documentation

## Overview

This document provides comprehensive instructions for setting up and using the Google Calendar API integration for the GadgetFix website. The integration displays real-time availability while maintaining enterprise-level security.

## Features

### ✅ Core Functionality
- **Real-time Availability Display**: Shows available appointment slots from Google Calendar
- **Multiple View Modes**: Summary view and full calendar grid
- **Automatic Time Zone Handling**: Dallas/Fort Worth (America/Chicago) timezone
- **Business Hours Filtering**: Configurable business hours and days
- **Smart Slot Generation**: Configurable appointment duration and buffer times

### 🛡️ Security Measures
- **Rate Limiting**: Prevents API abuse (5 requests/minute per IP)
- **IP Filtering**: Block/allow specific IP addresses
- **Bot Detection**: Identifies and blocks automated requests
- **CAPTCHA Integration**: Cloudflare Turnstile support
- **Request Validation**: Comprehensive input sanitization
- **Security Logging**: Real-time monitoring of threats

### ⚡ Performance Features
- **Intelligent Caching**: 5-minute cache for API responses
- **CDN-Friendly**: Proper cache headers for optimal performance
- **Error Handling**: Graceful degradation with user-friendly messages
- **Monitoring Dashboard**: Real-time API health and security monitoring

## Installation & Setup

### Step 1: Google Cloud Console Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Note your project ID

2. **Enable Google Calendar API**
   ```bash
   # Navigate to APIs & Services > Library
   # Search for "Google Calendar API"
   # Click "Enable"
   ```

3. **Create Service Account**
   ```bash
   # Go to IAM & Admin > Service Accounts
   # Click "Create Service Account"
   # Name: "calendar-api-service"
   # Description: "Service account for GadgetFix calendar integration"
   ```

4. **Generate Service Account Key**
   ```bash
   # Click on the created service account
   # Go to "Keys" tab
   # Click "Add Key" > "Create new key"
   # Choose "JSON" format
   # Download the JSON file (keep it secure!)
   ```

### Step 2: Google Calendar Setup

1. **Share Calendar with Service Account**
   ```bash
   # Open Google Calendar
   # Go to calendar settings
   # In "Share with specific people" section
   # Add the service account email with "Make changes to events" permission
   ```

2. **Get Calendar ID**
   ```bash
   # In calendar settings, find "Calendar ID"
   # For personal calendar: your-email@gmail.com
   # For shared calendar: random-string@group.calendar.google.com
   ```

### Step 3: Environment Configuration

1. **Copy Environment Template**
   ```bash
   cp .env.example .env
   ```

2. **Configure Environment Variables**
   ```bash
   # Required Variables
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
   GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com

   # Optional Security Variables
   CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAAA...
   CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAAA...
   
   # Optional Rate Limiting
   CALENDAR_RATE_LIMIT_REQUESTS=5
   CALENDAR_RATE_LIMIT_WINDOW=60000
   ```

### Step 4: Deploy and Test

1. **Install Dependencies** (Already completed)
   ```bash
   npm install googleapis node-cache express-rate-limit
   ```

2. **Test API Endpoint**
   ```bash
   # Start development server
   npm run dev
   
   # Test health endpoint
   curl http://localhost:4321/api/calendar/availability?type=health
   ```

3. **Deploy to Production**
   ```bash
   # Build and deploy
   npm run build
   # Deploy to Netlify or your hosting provider
   ```

## Usage Guide

### Adding Calendar Component to Pages

1. **Import the Component**
   ```astro
   ---
   import CalendarAvailability from '../components/CalendarAvailability.astro';
   ---
   ```

2. **Add to Page Template**
   ```astro
   <CalendarAvailability 
     showFullCalendar={false}
     maxDaysToShow={14}
     theme="light"
     size="standard"
   />
   ```

3. **Include JavaScript**
   ```astro
   <script src="/src/scripts/calendar-availability.js"></script>
   ```

### Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showFullCalendar` | boolean | false | Start with full calendar view |
| `maxDaysToShow` | number | 7 | Maximum days to display |
| `theme` | 'light' \| 'dark' | 'light' | Color theme |
| `size` | 'compact' \| 'standard' \| 'expanded' | 'standard' | Component size |

### API Endpoints

#### GET `/api/calendar/availability`

**Query Parameters:**
- `type`: 'summary' \| 'slots' \| 'next' \| 'health'
- `days`: Number of days ahead (max 30)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "nextAvailable": {
      "date": "2025-08-15",
      "time": "10:00",
      "available": true,
      "duration": 60,
      "type": "morning"
    },
    "availableToday": 3,
    "availableTomorrow": 5,
    "availableThisWeek": 25
  },
  "meta": {
    "requestType": "summary",
    "processingTimeMs": 145,
    "timestamp": "2025-08-14T15:30:00.000Z",
    "cacheMaxAge": 300
  }
}
```

#### POST `/api/calendar/availability`

**Supported Actions:**
- `clear_cache`: Clear calendar cache
- `get_security_events`: Get recent security events

## Configuration Options

### Business Hours Configuration

```typescript
businessHours: {
  start: '09:00',     // 9:00 AM
  end: '17:00',       // 5:00 PM
  days: [1, 2, 3, 4, 5] // Monday to Friday
}
```

### Appointment Settings

```typescript
slotDuration: 60,    // 1 hour appointments
bufferTime: 15       // 15 minutes between appointments
```

### Security Settings

```typescript
rateLimitConfig: {
  windowMs: 60000,     // 1 minute window
  maxRequests: 5,      // Max 5 requests per window
  skipSuccessfulRequests: false
}
```

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use separate service accounts for development/production
- Rotate service account keys regularly
- Use least-privilege principle for calendar permissions

### 2. Rate Limiting
- Monitor rate limit headers in responses
- Implement client-side caching to reduce requests
- Use exponential backoff for retries

### 3. IP Filtering
- Whitelist known IP ranges if possible
- Monitor security events for suspicious activity
- Update blocked IP lists regularly

### 4. CAPTCHA Integration
- Enable CAPTCHA for high-risk requests
- Use Cloudflare Turnstile for best UX
- Monitor CAPTCHA failure rates

## Monitoring & Troubleshooting

### Monitoring Dashboard

Access the monitoring dashboard at `/admin/calendar-monitor` to view:
- API health status
- Request statistics
- Security events
- Performance metrics
- Recent activity log

### Common Issues

#### 1. Authentication Errors
```bash
Error: "Missing required Google Calendar credentials"
```
**Solution:** Verify environment variables are set correctly

#### 2. Calendar Permission Errors
```bash
Error: "Insufficient Permission"
```
**Solution:** Ensure service account has calendar access

#### 3. Rate Limit Exceeded
```bash
Error: "Rate limit exceeded"
```
**Solution:** Wait for rate limit reset or implement caching

#### 4. Invalid Calendar ID
```bash
Error: "Calendar not found"
```
**Solution:** Verify calendar ID and permissions

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG_CALENDAR=true
```

### Health Check Endpoint

Monitor API health:
```bash
curl https://your-domain.com/api/calendar/availability?type=health
```

## Testing Procedures

### 1. Unit Tests
```bash
npm run test:unit
```

### 2. Integration Tests
```bash
npm run test:integration
```

### 3. Security Tests
```bash
# Test rate limiting
for i in {1..10}; do
  curl -w "%{http_code}\n" https://your-domain.com/api/calendar/availability
done

# Test bot detection
curl -H "User-Agent: bot" https://your-domain.com/api/calendar/availability
```

### 4. Performance Tests
```bash
npm run test:performance
```

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review security events
   - Check API performance metrics
   - Verify calendar synchronization

2. **Monthly**
   - Rotate service account keys
   - Update blocked IP lists
   - Review and update rate limits

3. **Quarterly**
   - Security audit
   - Performance optimization review
   - Update dependencies

### Backup & Recovery

1. **Environment Variables Backup**
   - Store encrypted backups of environment variables
   - Document service account setup process

2. **Configuration Backup**
   - Backup calendar sharing settings
   - Document business hours configuration

## API Reference

### Security Headers

All API responses include security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 2025-08-14T16:00:00.000Z
```

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 403 | Access denied | Check rate limits, IP filters |
| 429 | Rate limit exceeded | Wait for reset time |
| 500 | Internal server error | Check logs, verify configuration |
| 503 | Service unavailable | Google Calendar API issue |

## Support & Troubleshooting

### Logs Location
- API logs: Server console output
- Security events: `/admin/calendar-monitor`
- Error logs: Browser developer console

### Contact Information
- Technical Support: Check project documentation
- Security Issues: Report immediately to administrators

### Emergency Procedures
1. If security breach detected:
   - Disable API endpoint
   - Rotate service account keys
   - Review access logs
   - Notify administrators

2. If API unavailable:
   - Check Google Calendar API status
   - Verify service account permissions
   - Check rate limits
   - Review error logs

## Future Enhancements

### Planned Features
- [ ] Advanced analytics dashboard
- [ ] Email notifications for security events
- [ ] Automated testing suite
- [ ] Multi-language support
- [ ] Mobile app integration
- [ ] Advanced caching strategies

### Integration Opportunities
- [ ] CRM system integration
- [ ] Payment processing integration
- [ ] SMS notifications
- [ ] Video conferencing links
- [ ] Customer feedback collection

---

*Last Updated: August 14, 2025*
*Version: 1.0.0*