/**
 * Calendar Configuration Module
 * Centralized configuration for Google Calendar integration
 */

export const CALENDAR_CONFIG = {
  // Cache Configuration
  CACHE: {
    DEFAULT_TTL: 300, // 5 minutes in seconds
    CHECK_PERIOD: 60, // Check for expired keys every minute
    SUMMARY_TTL: 300,
    SLOTS_TTL: 300,
    NEXT_SLOT_TTL: 180,
    HEALTH_CHECK_TTL: 60,
  },

  // Business Hours Configuration
  BUSINESS: {
    TIME_ZONE: 'America/Chicago',
    START_HOUR: '09:00',
    END_HOUR: '17:00',
    WORKING_DAYS: [1, 2, 3, 4, 5], // Monday to Friday
    SLOT_DURATION: 60, // minutes
    BUFFER_TIME: 15, // minutes between appointments
  },

  // API Configuration
  API: {
    MAX_RESULTS: 250,
    DEFAULT_DAYS_AHEAD: 14,
    MAX_DAYS_AHEAD: 30,
  },

  // Security Configuration
  SECURITY: {
    RATE_LIMIT: {
      WINDOW_MS: 60000, // 1 minute
      MAX_REQUESTS: parseInt(process.env.CALENDAR_RATE_LIMIT_REQUESTS || '5'),
      MAX_POST_REQUESTS: 2,
    },
    BLOCKED_USER_AGENTS: [
      'bot', 'crawler', 'spider', 'scraper', 'wget', 'curl',
      'python-requests', 'java', 'go-http-client', 'okhttp'
    ],
    BLOCKED_IP_RANGES: [
      '0.0.0.0/8', '127.0.0.0/8', '169.254.0.0/16', '224.0.0.0/4'
    ],
  },

  // Error Messages
  ERRORS: {
    MISSING_CREDENTIALS: 'Missing required Google Calendar credentials',
    CALENDAR_UNAVAILABLE: 'Calendar service unavailable',
    INITIALIZATION_FAILED: 'Calendar service initialization failed',
    FETCH_FAILED: 'Failed to fetch calendar availability',
    EVENTS_FETCH_FAILED: 'Failed to fetch calendar events',
    SECURITY_BLOCK: 'Your request has been blocked for security reasons',
    INVALID_REQUEST: 'Invalid request type',
    INTERNAL_ERROR: 'An error occurred while processing your request',
  },

  // Success Messages
  MESSAGES: {
    INITIALIZED: 'Google Calendar API initialized successfully',
    CACHE_CLEARED: 'Calendar cache cleared successfully',
    SECURITY_PASSED: 'Security validation passed',
  },
} as const;

// Type definitions for configuration
export interface CalendarConfig {
  calendarId: string;
  serviceAccountEmail: string;
  privateKey: string;
  timeZone?: string;
  businessHours?: {
    start: string;
    end: string;
    days: number[];
  };
  slotDuration?: number;
  bufferTime?: number;
}

export interface SecurityConfig {
  enableIPFiltering?: boolean;
  enableRateLimit?: boolean;
  enableBotDetection?: boolean;
  enableCaptchaVerification?: boolean;
  blockedUserAgents?: string[];
  allowedIPs?: string[];
  blockedIPs?: string[];
  rateLimitConfig?: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
  };
}

// Environment variable helpers
export function getCalendarConfig(): CalendarConfig {
  return {
    calendarId: process.env.GOOGLE_CALENDAR_ID || '',
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    privateKey: process.env.GOOGLE_PRIVATE_KEY || '',
    timeZone: CALENDAR_CONFIG.BUSINESS.TIME_ZONE,
    businessHours: {
      start: CALENDAR_CONFIG.BUSINESS.START_HOUR,
      end: CALENDAR_CONFIG.BUSINESS.END_HOUR,
      days: CALENDAR_CONFIG.BUSINESS.WORKING_DAYS,
    },
    slotDuration: CALENDAR_CONFIG.BUSINESS.SLOT_DURATION,
    bufferTime: CALENDAR_CONFIG.BUSINESS.BUFFER_TIME,
  };
}

export function getSecurityConfig(): SecurityConfig {
  const blockedIPs = process.env.CALENDAR_BLOCKED_IPS?.split(',').map(ip => ip.trim()) || [];
  const allowedIPs = process.env.CALENDAR_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [];

  return {
    enableIPFiltering: process.env.CALENDAR_ENABLE_IP_FILTERING !== 'false',
    enableRateLimit: process.env.CALENDAR_ENABLE_RATE_LIMIT !== 'false',
    enableBotDetection: process.env.CALENDAR_ENABLE_BOT_DETECTION !== 'false',
    enableCaptchaVerification: process.env.CALENDAR_ENABLE_CAPTCHA === 'true',
    blockedUserAgents: CALENDAR_CONFIG.SECURITY.BLOCKED_USER_AGENTS,
    blockedIPs: [...CALENDAR_CONFIG.SECURITY.BLOCKED_IP_RANGES, ...blockedIPs],
    allowedIPs,
    rateLimitConfig: {
      windowMs: CALENDAR_CONFIG.SECURITY.RATE_LIMIT.WINDOW_MS,
      maxRequests: CALENDAR_CONFIG.SECURITY.RATE_LIMIT.MAX_REQUESTS,
      skipSuccessfulRequests: false,
    },
  };
}