/**
 * Calendar Error Handling Module
 * Unified error handling for calendar integration
 */

export enum ErrorCode {
  MISSING_CREDENTIALS = 'MISSING_CREDENTIALS',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  CALENDAR_ERROR = 'CALENDAR_ERROR',
  SECURITY_BLOCK = 'SECURITY_BLOCK',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  CAPTCHA_REQUIRED = 'CAPTCHA_REQUIRED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export class CalendarError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'CalendarError';
  }
}

export class SecurityError extends CalendarError {
  constructor(
    message: string,
    public riskLevel: 'low' | 'medium' | 'high',
    details?: any
  ) {
    super(ErrorCode.SECURITY_BLOCK, message, 403, details);
    this.name = 'SecurityError';
  }
}

export class RateLimitError extends CalendarError {
  constructor(
    public remaining: number,
    public resetTime: number
  ) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded. Please try again later.',
      429,
      { remaining, resetTime }
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Error response factory
 */
export function createErrorResponse(error: unknown): Response {
  let statusCode = 500;
  let errorCode = ErrorCode.INTERNAL_ERROR;
  let message = 'An unexpected error occurred';
  let details = {};

  if (error instanceof CalendarError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details || {};
  } else if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      errorCode = ErrorCode.NETWORK_ERROR;
      message = 'Calendar service temporarily unavailable';
      statusCode = 503;
    } else {
      message = 'An error occurred while processing your request';
    }
    
    // Log the actual error for debugging
    console.error('[CALENDAR_ERROR]', error);
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      code: errorCode,
      timestamp: new Date().toISOString(),
      ...details,
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    }
  );
}

/**
 * Safely log errors without exposing sensitive information
 */
export function logError(context: string, error: unknown): void {
  const timestamp = new Date().toISOString();
  const safeError = error instanceof Error ? {
    message: error.message,
    name: error.name,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  } : { error: String(error) };

  console.error(`[${context}] ${timestamp}`, safeError);
}

/**
 * Create a safe error message for client consumption
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof CalendarError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Don't expose internal error details to client
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    if (error.message.includes('credentials') || error.message.includes('auth')) {
      return 'Service configuration error. Please contact support.';
    }
  }
  
  return 'An unexpected error occurred. Please try again later.';
}