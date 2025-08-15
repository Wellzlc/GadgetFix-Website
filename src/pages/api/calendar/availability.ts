/**
 * Secure Google Calendar Availability API Endpoint
 * Provides calendar availability with comprehensive security measures
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { GoogleCalendarService } from '../../../lib/calendar/GoogleCalendarService';
import { CalendarSecurity } from '../../../lib/calendar/CalendarSecurity';
import { CALENDAR_CONFIG, getCalendarConfig, getSecurityConfig } from '../../../lib/calendar/config';
import { 
  CalendarError, 
  SecurityError, 
  RateLimitError,
  createErrorResponse,
  logError,
  ErrorCode 
} from '../../../lib/calendar/errors';

// Singleton instances
let calendarService: GoogleCalendarService | null = null;
let securityService: CalendarSecurity | null = null;

/**
 * Get or create calendar service instance
 */
function getCalendarService(): GoogleCalendarService {
  if (!calendarService) {
    const config = getCalendarConfig();
    
    if (!config.calendarId || !config.serviceAccountEmail || !config.privateKey) {
      throw new CalendarError(
        ErrorCode.MISSING_CREDENTIALS,
        CALENDAR_CONFIG.ERRORS.MISSING_CREDENTIALS,
        500
      );
    }
    
    calendarService = new GoogleCalendarService(config);
  }
  return calendarService;
}

/**
 * Get or create security service instance
 */
function getSecurityService(): CalendarSecurity {
  if (!securityService) {
    securityService = new CalendarSecurity(getSecurityConfig());
  }
  return securityService;
}

/**
 * Process calendar data request
 */
async function processRequest(type: string, params: URLSearchParams): Promise<any> {
  const calendar = getCalendarService();
  
  switch (type) {
    case 'summary':
      return await calendar.getAvailabilitySummary();
    
    case 'slots':
      const daysAhead = Math.min(
        parseInt(params.get('days') || String(CALENDAR_CONFIG.API.DEFAULT_DAYS_AHEAD)),
        CALENDAR_CONFIG.API.MAX_DAYS_AHEAD
      );
      return {
        slots: await calendar.getAvailability(daysAhead),
        generated: new Date().toISOString(),
        daysAhead
      };
    
    case 'next':
      const nextSlot = await calendar.getNextAvailableSlot();
      return {
        nextAvailable: nextSlot,
        generated: new Date().toISOString()
      };
    
    case 'health':
      return await calendar.healthCheck();
    
    default:
      throw new CalendarError(
        ErrorCode.INVALID_REQUEST,
        `Invalid request type: ${type}. Supported types: summary, slots, next, health`,
        400
      );
  }
}

/**
 * Create success response with proper headers
 */
function createSuccessResponse(
  data: any,
  requestType: string,
  processingTime: number,
  security: CalendarSecurity,
  request: Request
): Response {
  const cacheMaxAge = getCacheMaxAge(requestType);
  const rateLimitStatus = security.getRateLimitStatus(extractIP(request));
  
  return new Response(
    JSON.stringify({
      success: true,
      data,
      meta: {
        requestType,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        cacheMaxAge
      }
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheMaxAge}`,
        'X-RateLimit-Limit': String(CALENDAR_CONFIG.SECURITY.RATE_LIMIT.MAX_REQUESTS),
        'X-RateLimit-Remaining': String(
          rateLimitStatus.allowed
            ? CALENDAR_CONFIG.SECURITY.RATE_LIMIT.MAX_REQUESTS - rateLimitStatus.requests
            : 0
        ),
        'X-RateLimit-Reset': new Date(rateLimitStatus.resetTime).toISOString(),
        'X-Processing-Time': String(processingTime),
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  );
}

/**
 * Get cache max age for request type
 */
function getCacheMaxAge(requestType: string): number {
  const cacheConfig: Record<string, number> = {
    summary: CALENDAR_CONFIG.CACHE.SUMMARY_TTL,
    slots: CALENDAR_CONFIG.CACHE.SLOTS_TTL,
    next: CALENDAR_CONFIG.CACHE.NEXT_SLOT_TTL,
    health: CALENDAR_CONFIG.CACHE.HEALTH_CHECK_TTL
  };
  
  return cacheConfig[requestType] || CALENDAR_CONFIG.CACHE.DEFAULT_TTL;
}

/**
 * Extract IP address from request
 */
function extractIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || clientIP || '0.0.0.0';
}

/**
 * GET endpoint handler
 */
export const GET: APIRoute = async ({ request, url }) => {
  const startTime = Date.now();
  
  try {
    // Security validation
    const security = getSecurityService();
    const securityResult = await security.validateRequest(request);
    
    if (!securityResult.allowed) {
      logError('SECURITY_BLOCK', securityResult);
      
      if (securityResult.reason === 'Rate limit exceeded') {
        const ip = extractIP(request);
        const status = security.getRateLimitStatus(ip);
        throw new RateLimitError(status.requests, status.resetTime);
      }
      
      throw new SecurityError(
        securityResult.reason || CALENDAR_CONFIG.ERRORS.SECURITY_BLOCK,
        securityResult.riskLevel
      );
    }
    
    // Process request
    const requestType = url.searchParams.get('type') || 'summary';
    const responseData = await processRequest(requestType, url.searchParams);
    
    // Return success response
    const processingTime = Date.now() - startTime;
    return createSuccessResponse(
      responseData,
      requestType,
      processingTime,
      security,
      request
    );
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError('CALENDAR_API', error);
    return createErrorResponse(error);
  }
};

/**
 * POST endpoint handler (administrative actions)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Stricter security for POST requests
    const postSecurity = new CalendarSecurity({
      ...getSecurityConfig(),
      enableCaptchaVerification: true,
      rateLimitConfig: {
        windowMs: CALENDAR_CONFIG.SECURITY.RATE_LIMIT.WINDOW_MS,
        maxRequests: CALENDAR_CONFIG.SECURITY.RATE_LIMIT.MAX_POST_REQUESTS,
        skipSuccessfulRequests: false
      }
    });
    
    const securityResult = await postSecurity.validateRequest(request);
    if (!securityResult.allowed) {
      throw new SecurityError(
        'CAPTCHA verification required for this request',
        securityResult.riskLevel
      );
    }
    
    // Parse request body
    const body = await request.json();
    const action = body.action;
    
    // Process action
    const result = await processPostAction(action, postSecurity);
    
    return new Response(
      JSON.stringify({
        success: true,
        ...result
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );
    
  } catch (error) {
    logError('CALENDAR_API_POST', error);
    return createErrorResponse(error);
  }
};

/**
 * Process POST action
 */
async function processPostAction(action: string, security: CalendarSecurity): Promise<any> {
  switch (action) {
    case 'clear_cache':
      const calendar = getCalendarService();
      calendar.clearCache();
      return {
        message: CALENDAR_CONFIG.MESSAGES.CACHE_CLEARED
      };
    
    case 'get_security_events':
      const events = security.getSecurityEvents();
      return {
        data: events.slice(0, 50) // Last 50 events
      };
    
    default:
      throw new CalendarError(
        ErrorCode.INVALID_REQUEST,
        `Invalid action: ${action}. Supported actions: clear_cache, get_security_events`,
        400
      );
  }
}