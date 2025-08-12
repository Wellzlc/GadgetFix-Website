/**
 * BehavioralAnalyzer - Analyzes user behavior patterns
 * Detects bot-like behavior and suspicious interaction patterns
 */

import { FormSubmission, Threat, ThreatType, SessionContext } from '../types';

interface RateLimitEntry {
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  submissions: string[];
}

export class BehavioralAnalyzer {
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private ipGeocache: Map<string, any> = new Map();
  private suspiciousUserAgents = [
    /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
    /python/i, /java/i, /ruby/i, /perl/i, /php/i,
    /headless/i, /phantom/i, /selenium/i, /puppeteer/i
  ];
  
  private vpnASNs = new Set([
    '13335', // Cloudflare
    '16509', // Amazon AWS
    '15169', // Google
    '8075',  // Microsoft Azure
    '20473', // Choopa (Vultr)
    '16276', // OVH
    '24940', // Hetzner
    '14061', // DigitalOcean
  ]);

  async analyze(
    submission: FormSubmission,
    context: SessionContext
  ): Promise<{ threats: Threat[]; confidence: number }> {
    const threats: Threat[] = [];
    let maxConfidence = 0;

    // Check submission velocity
    threats.push(...await this.checkSubmissionVelocity(submission));

    // Check for bot behavior
    threats.push(...this.detectBotBehavior(submission));

    // Check timing anomalies
    threats.push(...this.analyzeTimingPatterns(submission));

    // Check geographic inconsistencies
    threats.push(...await this.checkGeographicConsistency(submission, context));

    // Check browser fingerprint anomalies
    threats.push(...this.analyzeBrowserFingerprint(submission));

    // Check for honeypot triggers
    threats.push(...this.checkHoneypotFields(submission));

    // Check user agent
    threats.push(...this.analyzeUserAgent(submission));

    // Calculate overall confidence
    if (threats.length > 0) {
      maxConfidence = Math.min(1, threats.reduce((max, t) => Math.max(max, t.confidence), 0));
    }

    return { threats, confidence: maxConfidence };
  }

  private async checkSubmissionVelocity(submission: FormSubmission): Promise<Threat[]> {
    const threats: Threat[] = [];
    const key = submission.ip;
    const now = new Date();
    
    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
        submissions: [submission.id]
      });
    } else {
      const entry = this.rateLimits.get(key)!;
      entry.count++;
      entry.lastSeen = now;
      entry.submissions.push(submission.id);

      // Check for rapid submissions
      const timeDiff = now.getTime() - entry.firstSeen.getTime();
      const minutes = timeDiff / 60000;

      // More than 3 submissions per minute
      if (entry.count > 3 && minutes < 1) {
        threats.push({
          type: ThreatType.RAPID_SUBMISSION,
          pattern: 'Rapid submission rate',
          confidence: Math.min(0.6 + (entry.count - 3) * 0.1, 0.95),
          description: `${entry.count} submissions in ${minutes.toFixed(1)} minutes`,
          evidence: [`IP: ${submission.ip}`, `Count: ${entry.count}`],
          severity: 'high'
        });
      }

      // More than 10 submissions per hour
      if (entry.count > 10 && minutes < 60) {
        threats.push({
          type: ThreatType.RAPID_SUBMISSION,
          pattern: 'High submission volume',
          confidence: Math.min(0.5 + (entry.count - 10) * 0.05, 0.9),
          description: `${entry.count} submissions in ${(minutes / 60).toFixed(1)} hours`,
          evidence: [`IP: ${submission.ip}`, `Count: ${entry.count}`],
          severity: 'medium'
        });
      }
    }

    // Clean old entries (older than 24 hours)
    for (const [k, v] of this.rateLimits.entries()) {
      if (now.getTime() - v.lastSeen.getTime() > 86400000) {
        this.rateLimits.delete(k);
      }
    }

    return threats;
  }

  private detectBotBehavior(submission: FormSubmission): Threat[] {
    const threats: Threat[] = [];
    const metadata = submission.metadata;

    // Check submission time (too fast)
    if (metadata.submissionTime < 3000) { // Less than 3 seconds
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: 'Form filled too quickly',
        confidence: Math.min(0.9 - (metadata.submissionTime / 10000), 0.95),
        description: `Form submitted in ${metadata.submissionTime}ms`,
        evidence: [`Submission time: ${metadata.submissionTime}ms`],
        severity: 'high'
      });
    }

    // Check for no mouse movements
    if (metadata.mouseMovements === 0 && metadata.submissionTime > 1000) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: 'No mouse movement detected',
        confidence: 0.8,
        description: 'Form submitted without any mouse movement',
        evidence: ['Mouse movements: 0'],
        severity: 'high'
      });
    }

    // Check for no keystrokes (but has text input)
    const hasTextInput = Object.values(submission.fields).some(
      v => typeof v === 'string' && v.length > 10
    );
    if (hasTextInput && (!metadata.keystrokes || metadata.keystrokes === 0)) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: 'Text without keystrokes',
        confidence: 0.85,
        description: 'Text input detected without keyboard events',
        evidence: ['Keystrokes: 0'],
        severity: 'high'
      });
    }

    // Check for linear field focus (bots often fill fields in order)
    if (metadata.fieldFocusOrder) {
      const expectedOrder = Object.keys(submission.fields);
      const actualOrder = metadata.fieldFocusOrder;
      
      if (JSON.stringify(expectedOrder) === JSON.stringify(actualOrder)) {
        threats.push({
          type: ThreatType.BOT_BEHAVIOR,
          pattern: 'Linear field completion',
          confidence: 0.6,
          description: 'Fields completed in exact DOM order',
          evidence: ['Perfect linear field order'],
          severity: 'medium'
        });
      }
    }

    // Check for excessive copy-paste (bots often paste content)
    if (metadata.copyPasteEvents && metadata.copyPasteEvents > 3) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: 'Excessive paste events',
        confidence: Math.min(0.4 + (metadata.copyPasteEvents * 0.1), 0.8),
        description: `${metadata.copyPasteEvents} paste events detected`,
        evidence: [`Paste events: ${metadata.copyPasteEvents}`],
        severity: 'medium'
      });
    }

    // Check for missing browser features
    if (!metadata.plugins || metadata.plugins.length === 0) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: 'No browser plugins',
        confidence: 0.5,
        description: 'Browser reports no plugins - possible headless browser',
        evidence: ['Plugins: 0'],
        severity: 'low'
      });
    }

    // Check screen resolution
    if (metadata.screenResolution === '0x0' || !metadata.screenResolution) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: 'Invalid screen resolution',
        confidence: 0.9,
        description: 'No valid screen resolution - likely headless browser',
        evidence: [`Resolution: ${metadata.screenResolution || 'undefined'}`],
        severity: 'high'
      });
    }

    return threats;
  }

  private analyzeTimingPatterns(submission: FormSubmission): Threat[] {
    const threats: Threat[] = [];
    const hour = submission.timestamp.getHours();
    const dayOfWeek = submission.timestamp.getDay();

    // Check for submissions at unusual hours (2 AM - 5 AM local time)
    if (hour >= 2 && hour <= 5) {
      threats.push({
        type: ThreatType.SUSPICIOUS_TIMING,
        pattern: 'Unusual submission hour',
        confidence: 0.4,
        description: `Submission at ${hour}:00 local time`,
        evidence: [`Time: ${submission.timestamp.toLocaleTimeString()}`],
        severity: 'low'
      });
    }

    // Check for patterns in submission timing (exact intervals)
    // This would need historical data to be effective
    // For now, check if submission is at exact minute mark
    if (submission.timestamp.getSeconds() === 0 && submission.timestamp.getMilliseconds() < 100) {
      threats.push({
        type: ThreatType.SUSPICIOUS_TIMING,
        pattern: 'Exact timing pattern',
        confidence: 0.3,
        description: 'Submission at exact minute mark',
        evidence: [`Timestamp: ${submission.timestamp.toISOString()}`],
        severity: 'low'
      });
    }

    return threats;
  }

  private async checkGeographicConsistency(
    submission: FormSubmission,
    context: SessionContext
  ): Promise<Threat[]> {
    const threats: Threat[] = [];

    // Check for VPN/Proxy usage
    const vpnCheck = await this.detectVPNOrProxy(submission.ip);
    if (vpnCheck.isVPN) {
      threats.push({
        type: ThreatType.VPN_DETECTED,
        pattern: 'VPN/Proxy detected',
        confidence: vpnCheck.confidence,
        description: 'Submission from VPN or proxy server',
        evidence: [`IP: ${submission.ip}`, `ASN: ${vpnCheck.asn}`],
        severity: 'medium'
      });
    }

    // Check for Tor exit nodes
    if (await this.isTorExitNode(submission.ip)) {
      threats.push({
        type: ThreatType.TOR_DETECTED,
        pattern: 'Tor exit node',
        confidence: 0.95,
        description: 'Submission from Tor network',
        evidence: [`IP: ${submission.ip}`],
        severity: 'high'
      });
    }

    // Check timezone consistency
    if (submission.metadata.timezone && context.timezone) {
      if (submission.metadata.timezone !== context.timezone) {
        threats.push({
          type: ThreatType.GEO_INCONSISTENCY,
          pattern: 'Timezone mismatch',
          confidence: 0.6,
          description: 'Browser timezone differs from expected',
          evidence: [
            `Browser: ${submission.metadata.timezone}`,
            `Expected: ${context.timezone}`
          ],
          severity: 'medium'
        });
      }
    }

    // Check language consistency
    if (submission.metadata.language && context.language) {
      if (!submission.metadata.language.startsWith(context.language.substring(0, 2))) {
        threats.push({
          type: ThreatType.GEO_INCONSISTENCY,
          pattern: 'Language mismatch',
          confidence: 0.5,
          description: 'Browser language differs from expected',
          evidence: [
            `Browser: ${submission.metadata.language}`,
            `Expected: ${context.language}`
          ],
          severity: 'low'
        });
      }
    }

    return threats;
  }

  private analyzeBrowserFingerprint(submission: FormSubmission): Threat[] {
    const threats: Threat[] = [];
    const metadata = submission.metadata;

    // Check for inconsistent fingerprints
    if (metadata.canvas && metadata.canvas === 'blocked') {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: 'Canvas fingerprinting blocked',
        confidence: 0.7,
        description: 'Canvas fingerprinting is blocked - possible privacy tool or bot',
        evidence: ['Canvas: blocked'],
        severity: 'medium'
      });
    }

    // Check for WebGL inconsistencies
    if (metadata.webgl && metadata.webgl === 'blocked') {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: 'WebGL blocked',
        confidence: 0.6,
        description: 'WebGL is blocked - possible privacy tool or bot',
        evidence: ['WebGL: blocked'],
        severity: 'medium'
      });
    }

    // Check for suspicious platform combinations
    if (metadata.platform) {
      const ua = submission.userAgent.toLowerCase();
      const platform = metadata.platform.toLowerCase();
      
      // Check for mismatched platform
      if ((platform.includes('win') && ua.includes('mac')) ||
          (platform.includes('mac') && ua.includes('windows')) ||
          (platform.includes('linux') && (ua.includes('windows') || ua.includes('mac')))) {
        threats.push({
          type: ThreatType.BOT_BEHAVIOR,
          pattern: 'Platform mismatch',
          confidence: 0.8,
          description: 'Browser platform does not match user agent',
          evidence: [`Platform: ${platform}`, `UserAgent: ${ua.substring(0, 50)}`],
          severity: 'high'
        });
      }
    }

    // Check color depth (unusual values might indicate bots)
    if (metadata.colorDepth && ![8, 16, 24, 32].includes(metadata.colorDepth)) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: 'Unusual color depth',
        confidence: 0.6,
        description: 'Browser reports unusual color depth',
        evidence: [`Color depth: ${metadata.colorDepth}`],
        severity: 'medium'
      });
    }

    return threats;
  }

  private checkHoneypotFields(submission: FormSubmission): Threat[] {
    const threats: Threat[] = [];
    
    // Check for common honeypot field names
    const honeypotFields = ['website', 'url', 'honey', 'trap', 'bot-field', 'email2', 'name2'];
    
    for (const field of honeypotFields) {
      if (submission.fields[field] && submission.fields[field] !== '') {
        threats.push({
          type: ThreatType.HONEYPOT_TRIGGERED,
          pattern: 'Honeypot field filled',
          confidence: 0.95,
          description: `Hidden honeypot field "${field}" was filled`,
          evidence: [`Field: ${field}`, `Value: ${String(submission.fields[field]).substring(0, 50)}`],
          severity: 'critical'
        });
      }
    }

    return threats;
  }

  private analyzeUserAgent(submission: FormSubmission): Threat[] {
    const threats: Threat[] = [];
    const ua = submission.userAgent;

    // Check for suspicious user agents
    for (const pattern of this.suspiciousUserAgents) {
      if (pattern.test(ua)) {
        threats.push({
          type: ThreatType.BOT_BEHAVIOR,
          pattern: 'Suspicious user agent',
          confidence: 0.8,
          description: 'User agent indicates automated tool',
          evidence: [`UserAgent: ${ua.substring(0, 100)}`],
          severity: 'high'
        });
        break;
      }
    }

    // Check for missing or very short user agent
    if (!ua || ua.length < 20) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: 'Invalid user agent',
        confidence: 0.9,
        description: 'Missing or invalid user agent string',
        evidence: [`UserAgent: ${ua || 'empty'}`],
        severity: 'high'
      });
    }

    // Check for outdated browsers (often used by bots)
    const oldBrowsers = [
      /MSIE [6-8]\./i,
      /Firefox\/[1-3]\d\./i,
      /Chrome\/[1-3]\d\./i,
      /Safari\/[1-4]\d{2}\./i
    ];

    for (const pattern of oldBrowsers) {
      if (pattern.test(ua)) {
        threats.push({
          type: ThreatType.BOT_BEHAVIOR,
          pattern: 'Outdated browser',
          confidence: 0.7,
          description: 'Very outdated browser version detected',
          evidence: [`UserAgent: ${ua.substring(0, 100)}`],
          severity: 'medium'
        });
        break;
      }
    }

    return threats;
  }

  private async detectVPNOrProxy(ip: string): Promise<{ isVPN: boolean; confidence: number; asn?: string }> {
    // In production, this would query an IP intelligence API
    // For now, we'll do basic ASN checking
    
    // Simple check: private IP ranges
    if (this.isPrivateIP(ip)) {
      return { isVPN: false, confidence: 0 };
    }

    // Check against known VPN ASNs
    // In production, get ASN from IP intelligence service
    const asn = await this.getASN(ip);
    if (asn && this.vpnASNs.has(asn)) {
      return { isVPN: true, confidence: 0.8, asn };
    }

    return { isVPN: false, confidence: 0 };
  }

  private async isTorExitNode(ip: string): Promise<boolean> {
    // In production, check against Tor exit node list
    // https://check.torproject.org/torbulkexitlist
    
    // For now, return false
    return false;
  }

  private isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;

    return (
      // 10.0.0.0 - 10.255.255.255
      parts[0] === 10 ||
      // 172.16.0.0 - 172.31.255.255
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      // 192.168.0.0 - 192.168.255.255
      (parts[0] === 192 && parts[1] === 168) ||
      // 127.0.0.0 - 127.255.255.255 (loopback)
      parts[0] === 127
    );
  }

  private async getASN(ip: string): Promise<string | null> {
    // In production, query IP intelligence service
    // For now, return null
    return null;
  }
}