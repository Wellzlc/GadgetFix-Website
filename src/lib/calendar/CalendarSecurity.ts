/**
 * Calendar API Security Module
 * Implements comprehensive security measures for Google Calendar API access
 */

import NodeCache from 'node-cache';
import { CALENDAR_CONFIG, type SecurityConfig } from './config';
import { logError } from './errors';

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
}


export class CalendarSecurity {
  private cache: NodeCache;
  private requestCounts: Map<string, { count: number; resetTime: number }>;
  private config: Required<SecurityConfig>;

  constructor(config?: SecurityConfig) {
    this.cache = new NodeCache({ 
      stdTTL: CALENDAR_CONFIG.CACHE.DEFAULT_TTL,
      checkperiod: CALENDAR_CONFIG.CACHE.CHECK_PERIOD
    });
    this.requestCounts = new Map();
    
    // Merge with defaults
    this.config = this.mergeConfig(config);
  }

  private mergeConfig(config?: SecurityConfig): Required<SecurityConfig> {
    return {
      enableIPFiltering: config?.enableIPFiltering ?? true,
      enableRateLimit: config?.enableRateLimit ?? true,
      enableBotDetection: config?.enableBotDetection ?? true,
      enableCaptchaVerification: config?.enableCaptchaVerification ?? false,
      blockedUserAgents: config?.blockedUserAgents || CALENDAR_CONFIG.SECURITY.BLOCKED_USER_AGENTS,
      allowedIPs: config?.allowedIPs || [],
      blockedIPs: config?.blockedIPs || CALENDAR_CONFIG.SECURITY.BLOCKED_IP_RANGES,
      rateLimitConfig: config?.rateLimitConfig || {
        windowMs: CALENDAR_CONFIG.SECURITY.RATE_LIMIT.WINDOW_MS,
        maxRequests: CALENDAR_CONFIG.SECURITY.RATE_LIMIT.MAX_REQUESTS,
        skipSuccessfulRequests: false
      }
    };
  }

  /**
   * Comprehensive security check for calendar API requests
   */
  async validateRequest(request: Request): Promise<SecurityCheckResult> {
    const ip = this.extractIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    // IP filtering check
    if (this.config.enableIPFiltering && !this.isIPAllowed(ip)) {
      this.logSecurityEvent('BLOCKED_IP', { ip, userAgent, referer });
      return {
        allowed: false,
        reason: 'IP address blocked',
        confidence: 0.95,
        riskLevel: 'high'
      };
    }

    // Rate limiting check
    if (this.config.enableRateLimit && !this.checkRateLimit(ip)) {
      this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip, userAgent, referer });
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        confidence: 0.9,
        riskLevel: 'medium'
      };
    }

    // Bot detection
    if (this.config.enableBotDetection && this.isBotRequest(userAgent, referer)) {
      this.logSecurityEvent('BOT_DETECTED', { ip, userAgent, referer });
      return {
        allowed: false,
        reason: 'Bot activity detected',
        confidence: 0.85,
        riskLevel: 'medium'
      };
    }

    // CAPTCHA verification (if enabled and required)
    if (this.config.enableCaptchaVerification) {
      const captchaResult = await this.verifyCaptcha(request);
      if (!captchaResult.valid) {
        this.logSecurityEvent('CAPTCHA_FAILED', { ip, userAgent, referer });
        return {
          allowed: false,
          reason: 'CAPTCHA verification failed',
          confidence: 0.8,
          riskLevel: 'medium'
        };
      }
    }

    // Request passed all security checks
    this.logSecurityEvent('REQUEST_ALLOWED', { ip, userAgent, referer });
    return {
      allowed: true,
      confidence: 0.1,
      riskLevel: 'low'
    };
  }

  /**
   * Extract client IP address from request
   */
  extractIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = request.headers.get('x-client-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIP || clientIP || '0.0.0.0';
  }

  /**
   * Check if IP address is allowed
   */
  private isIPAllowed(ip: string): boolean {
    // Check against blocked IPs
    for (const blockedIP of this.config.blockedIPs) {
      if (this.ipInRange(ip, blockedIP)) {
        return false;
      }
    }

    // If allowedIPs is set, only allow those IPs
    if (this.config.allowedIPs && this.config.allowedIPs.length > 0) {
      return this.config.allowedIPs.some(allowedIP => 
        this.ipInRange(ip, allowedIP)
      );
    }

    return true;
  }

  /**
   * Check if IP is in CIDR range
   */
  private ipInRange(ip: string, range: string): boolean {
    if (!range.includes('/')) {
      return ip === range;
    }

    try {
      const [rangeIP, prefixLength] = range.split('/');
      const ipNum = this.ipToNumber(ip);
      const rangeIPNum = this.ipToNumber(rangeIP);
      const mask = (~0 << (32 - parseInt(prefixLength))) >>> 0;
      
      return (ipNum & mask) === (rangeIPNum & mask);
    } catch {
      return false;
    }
  }

  /**
   * Convert IP address to number
   */
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  /**
   * Check rate limit for IP
   */
  private checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const key = `rate_limit_${ip}`;
    const existing = this.requestCounts.get(key);

    if (!existing || now > existing.resetTime) {
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + this.config.rateLimitConfig.windowMs
      });
      return true;
    }

    if (existing.count >= this.config.rateLimitConfig.maxRequests) {
      return false;
    }

    existing.count++;
    return true;
  }

  /**
   * Detect bot requests
   */
  private isBotRequest(userAgent: string, referer: string): boolean {
    const ua = userAgent.toLowerCase();
    
    // Check against known bot user agents
    for (const botUA of this.config.blockedUserAgents) {
      if (ua.includes(botUA.toLowerCase())) {
        return true;
      }
    }

    // Check for missing referer (suspicious for calendar requests)
    if (!referer && !ua.includes('mobile')) {
      return true;
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /headless/i,
      /phantom/i,
      /selenium/i,
      /webdriver/i,
      /automation/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(ua));
  }

  /**
   * Verify CAPTCHA token (Cloudflare Turnstile)
   */
  private async verifyCaptcha(request: Request): Promise<{ valid: boolean; score?: number }> {
    try {
      const body = await request.text();
      const data = JSON.parse(body);
      const token = data.captchaToken;

      if (!token) {
        return { valid: false };
      }

      const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
      if (!secretKey) {
        console.warn('CAPTCHA verification skipped: missing secret key');
        return { valid: true };
      }

      const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      });

      const result = await verifyResponse.json();
      return {
        valid: result.success === true,
        score: result.score
      };
    } catch (error) {
      logError('CAPTCHA_VERIFY', error);
      return { valid: false };
    }
  }

  /**
   * Log security events
   */
  private logSecurityEvent(event: string, data: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      ...data
    };

    // Use centralized logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CALENDAR_SECURITY] ${JSON.stringify(logEntry)}`);
    }
    
    // Store in cache for monitoring dashboard
    const cacheKey = `security_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.cache.set(cacheKey, logEntry, 3600); // Keep for 1 hour
  }

  /**
   * Get recent security events (for monitoring)
   */
  getSecurityEvents(): any[] {
    const keys = this.cache.keys();
    return keys
      .filter(key => key.startsWith('security_event_'))
      .map(key => this.cache.get(key))
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Clear rate limit for IP (for testing or manual override)
   */
  clearRateLimit(ip: string): void {
    this.requestCounts.delete(`rate_limit_${ip}`);
  }

  /**
   * Get current rate limit status for IP
   */
  getRateLimitStatus(ip: string): { requests: number; resetTime: number; allowed: boolean } {
    const key = `rate_limit_${ip}`;
    const existing = this.requestCounts.get(key);
    
    if (!existing) {
      return { requests: 0, resetTime: 0, allowed: true };
    }

    return {
      requests: existing.count,
      resetTime: existing.resetTime,
      allowed: existing.count < this.config.rateLimitConfig.maxRequests
    };
  }
}