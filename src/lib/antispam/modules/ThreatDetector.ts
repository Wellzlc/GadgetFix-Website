/**
 * ThreatDetector - Immediate threat detection module
 * Analyzes form submissions for known threat patterns
 */

import { FormSubmission, Threat, ThreatType } from '../types';

export class ThreatDetector {
  private cryptoPatterns = {
    bitcoinAddress: /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}\b/gi,
    ethereumAddress: /\b0x[a-fA-F0-9]{40}\b/gi,
    cryptoKeywords: /\b(bitcoin|btc|ethereum|eth|crypto|wallet|transfer|activation|blockchain|usdt|usdc|binance|coinbase)\b/gi,
    scamPhrases: [
      /activate.{0,20}(transfer|payment|funds?)/gi,
      /confirm.{0,20}(transfer|transaction)/gi,
      /pending.{0,20}(transfer|withdrawal)/gi,
      /release.{0,20}funds?/gi,
      /verify.{0,20}wallet/gi,
      /claim.{0,20}(bitcoin|crypto|reward)/gi,
      /minimum.{0,20}(deposit|transfer)/gi
    ]
  };

  private suspiciousUrlPatterns = {
    urlShorteners: /\b(bit\.ly|tinyurl|goo\.gl|ow\.ly|t\.co|short\.link|rebrand\.ly)\//gi,
    suspiciousTLDs: /\.(tk|ml|ga|cf|click|download|review|top|loan|work|men|date|party|racing|win|stream|gdn)\b/gi,
    ipAddresses: /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/gi,
    punycode: /xn--/gi,
    homoglyphs: /[а-яА-Я]/, // Cyrillic characters that look like Latin
    excessiveSubdomains: /([a-z0-9-]+\.){4,}/gi
  };

  private socialEngineeringPatterns = {
    urgency: /\b(urgent|immediate|expire|deadline|limited time|act now|don't wait|hurry|last chance|ending soon)\b/gi,
    authority: /\b(official|authorized|certified|guaranteed|approved by|endorsed by|government|federal|irs|fbi)\b/gi,
    fear: /\b(suspend|terminate|close|delete|lock|freeze|illegal|arrest|lawsuit|legal action|prosecute)\b/gi,
    tooGood: /\b(free money|easy money|congratulations you won|winner|million|prize|reward|gift card|claim now)\b/gi,
    emotional: /\b(help me|desperate|emergency|life or death|dying|sick child|tragedy|disaster)\b/gi
  };

  private technicalThreats = {
    xss: /<script|javascript:|onerror=|onload=|onclick=/gi,
    sqlInjection: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript)\b.*\b(from|where|table|database)\b)|(--)|(;.*\b(select|union|insert|update|delete|drop)\b)/gi,
    commandInjection: /[;&|`$]|\$\(.*\)|\bsh\b|\bbash\b|\bcmd\b/gi,
    pathTraversal: /\.\.[\/\\]|\.\.%2[fF]|\.\.%5[cC]/gi
  };

  async analyze(submission: FormSubmission): Promise<{ threats: Threat[]; confidence: number }> {
    const threats: Threat[] = [];
    let maxConfidence = 0;

    // Analyze each field
    for (const [fieldName, fieldValue] of Object.entries(submission.fields)) {
      if (typeof fieldValue !== 'string') continue;

      // Check for cryptocurrency scams
      threats.push(...this.detectCryptoScams(fieldName, fieldValue));
      
      // Check for field content mismatch
      threats.push(...this.detectFieldMismatch(fieldName, fieldValue));
      
      // Check for suspicious URLs
      threats.push(...this.detectSuspiciousUrls(fieldName, fieldValue));
      
      // Check for social engineering
      threats.push(...this.detectSocialEngineering(fieldName, fieldValue));
      
      // Check for technical threats
      threats.push(...this.detectTechnicalThreats(fieldName, fieldValue));
    }

    // Cross-field analysis
    threats.push(...this.performCrossFieldAnalysis(submission));

    // Calculate overall confidence
    if (threats.length > 0) {
      maxConfidence = Math.min(1, threats.reduce((max, t) => Math.max(max, t.confidence), 0));
    }

    return { threats, confidence: maxConfidence };
  }

  private detectCryptoScams(field: string, value: string): Threat[] {
    const threats: Threat[] = [];

    // Check for Bitcoin addresses
    if (this.cryptoPatterns.bitcoinAddress.test(value)) {
      threats.push({
        type: ThreatType.BITCOIN_ADDRESS,
        field,
        pattern: 'Bitcoin address detected',
        confidence: 0.95,
        description: 'Bitcoin wallet address found in submission',
        evidence: [value.match(this.cryptoPatterns.bitcoinAddress)?.[0] || ''],
        severity: 'high'
      });
    }

    // Check for Ethereum addresses
    if (this.cryptoPatterns.ethereumAddress.test(value)) {
      threats.push({
        type: ThreatType.CRYPTO_SCAM,
        field,
        pattern: 'Ethereum address detected',
        confidence: 0.95,
        description: 'Ethereum wallet address found in submission',
        evidence: [value.match(this.cryptoPatterns.ethereumAddress)?.[0] || ''],
        severity: 'high'
      });
    }

    // Check for crypto keywords
    const cryptoMatches = value.match(this.cryptoPatterns.cryptoKeywords);
    if (cryptoMatches && cryptoMatches.length > 2) {
      threats.push({
        type: ThreatType.CRYPTO_SCAM,
        field,
        pattern: 'Multiple cryptocurrency keywords',
        confidence: Math.min(0.3 + (cryptoMatches.length * 0.15), 0.9),
        description: 'Multiple cryptocurrency-related terms detected',
        evidence: cryptoMatches.slice(0, 5),
        severity: 'medium'
      });
    }

    // Check for scam phrases
    for (const pattern of this.cryptoPatterns.scamPhrases) {
      if (pattern.test(value)) {
        threats.push({
          type: ThreatType.ACTIVATION_SCHEME,
          field,
          pattern: 'Activation/transfer scam pattern',
          confidence: 0.85,
          description: 'Common cryptocurrency scam phrase detected',
          evidence: [value.match(pattern)?.[0] || ''],
          severity: 'high'
        });
      }
    }

    return threats;
  }

  private detectFieldMismatch(field: string, value: string): Threat[] {
    const threats: Threat[] = [];

    // URL in name field
    if ((field.toLowerCase().includes('name') || field.toLowerCase().includes('firstname') || 
         field.toLowerCase().includes('lastname')) && /https?:\/\//i.test(value)) {
      threats.push({
        type: ThreatType.URL_IN_NAME,
        field,
        pattern: 'URL in name field',
        confidence: 0.9,
        description: 'URL detected in a name field - common spam tactic',
        evidence: [value],
        severity: 'high'
      });
    }

    // Email in non-email field
    if (!field.toLowerCase().includes('email') && /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(value)) {
      const emailCount = (value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi) || []).length;
      if (emailCount > 1 || field.toLowerCase().includes('name')) {
        threats.push({
          type: ThreatType.FIELD_MISMATCH,
          field,
          pattern: 'Email in unexpected field',
          confidence: 0.7,
          description: 'Email address found in non-email field',
          evidence: [value.substring(0, 100)],
          severity: 'medium'
        });
      }
    }

    // Phone number in non-phone field
    if (!field.toLowerCase().includes('phone') && !field.toLowerCase().includes('mobile') && 
        /(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g.test(value)) {
      const phoneMatches = value.match(/(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g) || [];
      if (phoneMatches.length > 1) {
        threats.push({
          type: ThreatType.FIELD_MISMATCH,
          field,
          pattern: 'Phone numbers in unexpected field',
          confidence: 0.6,
          description: 'Multiple phone numbers found in non-phone field',
          evidence: phoneMatches.slice(0, 3),
          severity: 'medium'
        });
      }
    }

    return threats;
  }

  private detectSuspiciousUrls(field: string, value: string): Threat[] {
    const threats: Threat[] = [];
    const urlMatches = value.match(/https?:\/\/[^\s]+/gi) || [];

    if (urlMatches.length > 0) {
      // Check for URL shorteners
      if (this.suspiciousUrlPatterns.urlShorteners.test(value)) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          field,
          pattern: 'URL shortener detected',
          confidence: 0.8,
          description: 'URL shortener service detected - often used in phishing',
          evidence: urlMatches.filter(url => this.suspiciousUrlPatterns.urlShorteners.test(url)),
          severity: 'high'
        });
      }

      // Check for suspicious TLDs
      if (this.suspiciousUrlPatterns.suspiciousTLDs.test(value)) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          field,
          pattern: 'Suspicious TLD',
          confidence: 0.7,
          description: 'URL with suspicious top-level domain',
          evidence: urlMatches.filter(url => this.suspiciousUrlPatterns.suspiciousTLDs.test(url)),
          severity: 'medium'
        });
      }

      // Check for IP addresses as URLs
      if (this.suspiciousUrlPatterns.ipAddresses.test(value)) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          field,
          pattern: 'IP address URL',
          confidence: 0.85,
          description: 'URL using IP address instead of domain name',
          evidence: urlMatches.filter(url => this.suspiciousUrlPatterns.ipAddresses.test(url)),
          severity: 'high'
        });
      }

      // Check for punycode (internationalized domain names often used in phishing)
      if (this.suspiciousUrlPatterns.punycode.test(value)) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          field,
          pattern: 'Punycode URL',
          confidence: 0.75,
          description: 'Internationalized domain name detected - potential phishing',
          evidence: urlMatches.filter(url => this.suspiciousUrlPatterns.punycode.test(url)),
          severity: 'medium'
        });
      }

      // Check for excessive URLs
      if (urlMatches.length > 3) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          field,
          pattern: 'Too many URLs',
          confidence: Math.min(0.4 + (urlMatches.length * 0.1), 0.9),
          description: `${urlMatches.length} URLs detected in submission`,
          evidence: urlMatches.slice(0, 5),
          severity: 'medium'
        });
      }
    }

    // Calculate URL entropy (randomness)
    for (const url of urlMatches) {
      const entropy = this.calculateEntropy(url);
      if (entropy > 4.5) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          field,
          pattern: 'High entropy URL',
          confidence: Math.min(0.5 + ((entropy - 4.5) * 0.2), 0.9),
          description: 'URL contains suspicious random-looking characters',
          evidence: [url],
          severity: 'medium'
        });
      }
    }

    return threats;
  }

  private detectSocialEngineering(field: string, value: string): Threat[] {
    const threats: Threat[] = [];

    // Check for urgency language
    const urgencyMatches = value.match(this.socialEngineeringPatterns.urgency);
    if (urgencyMatches && urgencyMatches.length > 1) {
      threats.push({
        type: ThreatType.URGENCY_LANGUAGE,
        field,
        pattern: 'Urgency tactics',
        confidence: Math.min(0.4 + (urgencyMatches.length * 0.2), 0.85),
        description: 'Multiple urgency-inducing phrases detected',
        evidence: urgencyMatches.slice(0, 3),
        severity: 'medium'
      });
    }

    // Check for authority claims
    if (this.socialEngineeringPatterns.authority.test(value)) {
      threats.push({
        type: ThreatType.AUTHORITY_CLAIM,
        field,
        pattern: 'False authority',
        confidence: 0.7,
        description: 'Claims of authority or official status',
        evidence: [value.match(this.socialEngineeringPatterns.authority)?.[0] || ''],
        severity: 'medium'
      });
    }

    // Check for fear tactics
    if (this.socialEngineeringPatterns.fear.test(value)) {
      threats.push({
        type: ThreatType.FEAR_TACTIC,
        field,
        pattern: 'Fear-based manipulation',
        confidence: 0.75,
        description: 'Fear-inducing language detected',
        evidence: [value.match(this.socialEngineeringPatterns.fear)?.[0] || ''],
        severity: 'high'
      });
    }

    // Check for too-good-to-be-true offers
    if (this.socialEngineeringPatterns.tooGood.test(value)) {
      threats.push({
        type: ThreatType.TOO_GOOD_TO_BE_TRUE,
        field,
        pattern: 'Unrealistic offer',
        confidence: 0.8,
        description: 'Unrealistic promises or offers detected',
        evidence: [value.match(this.socialEngineeringPatterns.tooGood)?.[0] || ''],
        severity: 'high'
      });
    }

    // Check for emotional manipulation
    if (this.socialEngineeringPatterns.emotional.test(value)) {
      threats.push({
        type: ThreatType.EMOTIONAL_MANIPULATION,
        field,
        pattern: 'Emotional appeal',
        confidence: 0.65,
        description: 'Emotional manipulation tactics detected',
        evidence: [value.match(this.socialEngineeringPatterns.emotional)?.[0] || ''],
        severity: 'medium'
      });
    }

    return threats;
  }

  private detectTechnicalThreats(field: string, value: string): Threat[] {
    const threats: Threat[] = [];

    // Check for XSS attempts
    if (this.technicalThreats.xss.test(value)) {
      threats.push({
        type: ThreatType.XSS_ATTEMPT,
        field,
        pattern: 'XSS payload',
        confidence: 0.95,
        description: 'Cross-site scripting attempt detected',
        evidence: [value.match(this.technicalThreats.xss)?.[0] || ''],
        severity: 'critical'
      });
    }

    // Check for SQL injection
    if (this.technicalThreats.sqlInjection.test(value)) {
      threats.push({
        type: ThreatType.SQL_INJECTION,
        field,
        pattern: 'SQL injection',
        confidence: 0.9,
        description: 'SQL injection attempt detected',
        evidence: [value.substring(0, 100)],
        severity: 'critical'
      });
    }

    // Check for command injection
    if (this.technicalThreats.commandInjection.test(value)) {
      threats.push({
        type: ThreatType.COMMAND_INJECTION,
        field,
        pattern: 'Command injection',
        confidence: 0.85,
        description: 'Command injection attempt detected',
        evidence: [value.match(this.technicalThreats.commandInjection)?.[0] || ''],
        severity: 'critical'
      });
    }

    // Check for path traversal
    if (this.technicalThreats.pathTraversal.test(value)) {
      threats.push({
        type: ThreatType.PATH_TRAVERSAL,
        field,
        pattern: 'Path traversal',
        confidence: 0.9,
        description: 'Path traversal attempt detected',
        evidence: [value.match(this.technicalThreats.pathTraversal)?.[0] || ''],
        severity: 'critical'
      });
    }

    return threats;
  }

  private performCrossFieldAnalysis(submission: FormSubmission): Threat[] {
    const threats: Threat[] = [];
    const allText = Object.values(submission.fields).join(' ');

    // Check for suspicious keyword density
    const suspiciousKeywords = [
      'bitcoin', 'crypto', 'wallet', 'transfer', 'urgent', 'click', 
      'verify', 'suspend', 'expire', 'confirm', 'activate'
    ];
    
    let keywordCount = 0;
    for (const keyword of suspiciousKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = allText.match(regex);
      if (matches) keywordCount += matches.length;
    }

    const wordCount = allText.split(/\s+/).length;
    const keywordDensity = keywordCount / Math.max(wordCount, 1);

    if (keywordDensity > 0.1) {
      threats.push({
        type: ThreatType.SUSPICIOUS_KEYWORDS,
        pattern: 'High suspicious keyword density',
        confidence: Math.min(0.5 + (keywordDensity * 2), 0.95),
        description: `Suspicious keyword density: ${(keywordDensity * 100).toFixed(1)}%`,
        evidence: [`${keywordCount} suspicious keywords in ${wordCount} words`],
        severity: 'high'
      });
    }

    // Check for inconsistent data (e.g., US phone with foreign email domain)
    const email = submission.fields.email;
    const phone = submission.fields.phone;
    
    if (email && phone) {
      // Simple geo consistency check
      if (typeof email === 'string' && typeof phone === 'string') {
        const emailDomain = email.split('@')[1];
        if (emailDomain) {
          const isUSPhone = /^\+?1/.test(phone) || /^\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(phone);
          const isForeignEmail = /\.(ru|cn|tk|ml|ga|cf)$/i.test(emailDomain);
          
          if (isUSPhone && isForeignEmail) {
            threats.push({
              type: ThreatType.GEO_INCONSISTENCY,
              pattern: 'Geographic data mismatch',
              confidence: 0.7,
              description: 'US phone number with suspicious foreign email domain',
              evidence: [`Phone: ${phone.substring(0, 20)}, Email domain: ${emailDomain}`],
              severity: 'medium'
            });
          }
        }
      }
    }

    return threats;
  }

  private calculateEntropy(str: string): number {
    const freq: Record<string, number> = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = str.length;
    
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }
}