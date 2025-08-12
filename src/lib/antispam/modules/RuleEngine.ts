/**
 * RuleEngine - Flexible rule-based threat detection
 * Allows dynamic creation and modification of detection rules
 */

import { FormSubmission, Threat, Rule, RuleCondition, ThreatType } from '../types';

export class RuleEngine {
  private rules: Map<string, Rule> = new Map();
  private customPatterns: Map<string, RegExp> = new Map();
  
  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Crypto scam rule
    this.addRule({
      id: 'crypto_transfer_scam',
      name: 'Cryptocurrency Transfer Scam',
      conditions: [
        { field: 'any', operator: 'contains', value: 'bitcoin' },
        { field: 'any', operator: 'contains', value: 'transfer' },
        { field: 'any', operator: 'matches', value: /\b(activate|confirm|release|pending)\b/i }
      ],
      action: 'block',
      priority: 100,
      enabled: true,
      description: 'Blocks cryptocurrency transfer scam attempts',
      createdAt: new Date(),
      updatedAt: new Date(),
      hitCount: 0
    });

    // URL in name field rule
    this.addRule({
      id: 'url_in_name',
      name: 'URL in Name Field',
      conditions: [
        { field: 'name', operator: 'matches', value: /https?:\/\//i }
      ],
      action: 'quarantine',
      priority: 90,
      enabled: true,
      description: 'Quarantines submissions with URLs in name fields',
      createdAt: new Date(),
      updatedAt: new Date(),
      hitCount: 0
    });

    // Excessive URLs rule
    this.addRule({
      id: 'excessive_urls',
      name: 'Too Many URLs',
      conditions: [
        { field: 'any', operator: 'matches', value: /(https?:\/\/[^\s]+.*){4,}/i }
      ],
      action: 'quarantine',
      priority: 80,
      enabled: true,
      description: 'Quarantines submissions with 4+ URLs',
      createdAt: new Date(),
      updatedAt: new Date(),
      hitCount: 0
    });

    // Known spam phrases
    this.addRule({
      id: 'spam_phrases',
      name: 'Known Spam Phrases',
      conditions: [
        { field: 'any', operator: 'matches', value: /\b(click here now|limited time offer|act now|congratulations you won|claim your prize)\b/i }
      ],
      action: 'block',
      priority: 85,
      enabled: true,
      description: 'Blocks known spam phrases',
      createdAt: new Date(),
      updatedAt: new Date(),
      hitCount: 0
    });

    // Disposable email domains
    this.addRule({
      id: 'disposable_email',
      name: 'Disposable Email Service',
      conditions: [
        { field: 'email', operator: 'matches', value: /@(mailinator|guerrillamail|10minutemail|tempmail|throwaway\.email|trashemail)\./i }
      ],
      action: 'quarantine',
      priority: 70,
      enabled: true,
      description: 'Quarantines submissions from disposable email services',
      createdAt: new Date(),
      updatedAt: new Date(),
      hitCount: 0
    });

    // SQL injection attempt
    this.addRule({
      id: 'sql_injection',
      name: 'SQL Injection Attempt',
      conditions: [
        { field: 'any', operator: 'matches', value: /(\bUNION\b.*\bSELECT\b|\bDROP\s+TABLE\b|\bINSERT\s+INTO\b.*\bVALUES\b)/i }
      ],
      action: 'block',
      priority: 100,
      enabled: true,
      description: 'Blocks SQL injection attempts',
      createdAt: new Date(),
      updatedAt: new Date(),
      hitCount: 0
    });

    // XSS attempt
    this.addRule({
      id: 'xss_attempt',
      name: 'Cross-Site Scripting Attempt',
      conditions: [
        { field: 'any', operator: 'matches', value: /<script|javascript:|onerror=|onclick=|<iframe/i }
      ],
      action: 'block',
      priority: 100,
      enabled: true,
      description: 'Blocks XSS attempts',
      createdAt: new Date(),
      updatedAt: new Date(),
      hitCount: 0
    });

    // Phone number spam pattern
    this.addRule({
      id: 'phone_spam',
      name: 'Multiple Phone Numbers',
      conditions: [
        { field: 'any', operator: 'matches', value: /(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}.*(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}.*(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g }
      ],
      action: 'quarantine',
      priority: 60,
      enabled: true,
      description: 'Quarantines submissions with 3+ phone numbers',
      createdAt: new Date(),
      updatedAt: new Date(),
      hitCount: 0
    });
  }

  async evaluate(
    submission: FormSubmission,
    existingThreats: Threat[]
  ): Promise<{ additionalThreats: Threat[]; confidence: number }> {
    const additionalThreats: Threat[] = [];
    let maxConfidence = 0;

    // Sort rules by priority (higher priority first)
    const sortedRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.evaluateRule(rule, submission)) {
        // Rule matched
        rule.hitCount++;
        rule.lastHit = new Date();

        const confidence = this.calculateRuleConfidence(rule);
        maxConfidence = Math.max(maxConfidence, confidence);

        additionalThreats.push({
          type: this.mapRuleToThreatType(rule),
          pattern: rule.name,
          confidence,
          description: rule.description,
          evidence: this.extractEvidence(rule, submission),
          severity: this.mapActionToSeverity(rule.action)
        });

        // If this is a blocking rule, no need to check further
        if (rule.action === 'block') {
          break;
        }
      }
    }

    return { additionalThreats, confidence: maxConfidence };
  }

  private evaluateRule(rule: Rule, submission: FormSubmission): boolean {
    // All conditions must be met (AND logic)
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, submission)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(condition: RuleCondition, submission: FormSubmission): boolean {
    let value: string;

    if (condition.field === 'any') {
      // Check all fields
      value = Object.values(submission.fields)
        .filter(v => typeof v === 'string')
        .join(' ');
    } else if (condition.field) {
      // Check specific field
      const fieldValue = submission.fields[condition.field];
      if (fieldValue === undefined) return false;
      value = String(fieldValue);
    } else {
      return false;
    }

    // Apply case sensitivity
    if (!condition.caseSensitive) {
      value = value.toLowerCase();
    }

    switch (condition.operator) {
      case 'contains':
        const searchValue = condition.caseSensitive ? 
          String(condition.value) : 
          String(condition.value).toLowerCase();
        return value.includes(searchValue);

      case 'equals':
        const equalValue = condition.caseSensitive ?
          String(condition.value) :
          String(condition.value).toLowerCase();
        return value === equalValue;

      case 'matches':
        if (condition.value instanceof RegExp) {
          return condition.value.test(value);
        } else {
          return new RegExp(String(condition.value)).test(value);
        }

      case 'greater':
        return parseFloat(value) > parseFloat(String(condition.value));

      case 'less':
        return parseFloat(value) < parseFloat(String(condition.value));

      case 'in':
        if (Array.isArray(condition.value)) {
          return condition.value.some(v => {
            const checkValue = condition.caseSensitive ? String(v) : String(v).toLowerCase();
            return value.includes(checkValue);
          });
        }
        return false;

      case 'not_in':
        if (Array.isArray(condition.value)) {
          return !condition.value.some(v => {
            const checkValue = condition.caseSensitive ? String(v) : String(v).toLowerCase();
            return value.includes(checkValue);
          });
        }
        return true;

      default:
        return false;
    }
  }

  private calculateRuleConfidence(rule: Rule): number {
    // Base confidence from priority
    let confidence = rule.priority / 100;

    // Adjust based on action
    switch (rule.action) {
      case 'block':
        confidence = Math.max(confidence, 0.9);
        break;
      case 'quarantine':
        confidence = Math.max(confidence, 0.7);
        break;
      case 'flag':
        confidence = Math.max(confidence, 0.5);
        break;
    }

    // Slight reduction if rule is new (less than 24 hours old)
    const age = Date.now() - rule.createdAt.getTime();
    if (age < 86400000) {
      confidence *= 0.9;
    }

    return Math.min(confidence, 0.95);
  }

  private mapRuleToThreatType(rule: Rule): ThreatType {
    // Map rule IDs to threat types
    const mapping: Record<string, ThreatType> = {
      'crypto_transfer_scam': ThreatType.CRYPTO_SCAM,
      'url_in_name': ThreatType.URL_IN_NAME,
      'excessive_urls': ThreatType.EXCESSIVE_URLS,
      'spam_phrases': ThreatType.SUSPICIOUS_KEYWORDS,
      'disposable_email': ThreatType.DISPOSABLE_EMAIL,
      'sql_injection': ThreatType.SQL_INJECTION,
      'xss_attempt': ThreatType.XSS_ATTEMPT,
      'phone_spam': ThreatType.SUSPICIOUS_KEYWORDS
    };

    return mapping[rule.id] || ThreatType.SUSPICIOUS_KEYWORDS;
  }

  private mapActionToSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (action) {
      case 'block':
        return 'critical';
      case 'quarantine':
        return 'high';
      case 'flag':
        return 'medium';
      default:
        return 'low';
    }
  }

  private extractEvidence(rule: Rule, submission: FormSubmission): string[] {
    const evidence: string[] = [];

    for (const condition of rule.conditions) {
      let value: string;

      if (condition.field === 'any') {
        value = Object.values(submission.fields)
          .filter(v => typeof v === 'string')
          .join(' ');
      } else if (condition.field) {
        value = String(submission.fields[condition.field] || '');
      } else {
        continue;
      }

      // Extract matching portion
      if (condition.operator === 'matches' && condition.value instanceof RegExp) {
        const match = value.match(condition.value);
        if (match) {
          evidence.push(match[0].substring(0, 100));
        }
      } else if (condition.operator === 'contains') {
        const index = value.toLowerCase().indexOf(String(condition.value).toLowerCase());
        if (index !== -1) {
          const start = Math.max(0, index - 20);
          const end = Math.min(value.length, index + String(condition.value).length + 20);
          evidence.push('...' + value.substring(start, end) + '...');
        }
      }
    }

    return evidence.slice(0, 3);
  }

  addRule(rule: Rule) {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string) {
    this.rules.delete(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<Rule>) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
      rule.updatedAt = new Date();
    }
  }

  enableRule(ruleId: string) {
    this.updateRule(ruleId, { enabled: true });
  }

  disableRule(ruleId: string) {
    this.updateRule(ruleId, { enabled: false });
  }

  getRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  getRule(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  async suggestRule(feedback: string): Promise<Rule | null> {
    // Analyze feedback to suggest new rules
    // This is a simplified implementation

    const lowerFeedback = feedback.toLowerCase();

    // Check for common patterns in feedback
    if (lowerFeedback.includes('crypto') || lowerFeedback.includes('bitcoin')) {
      return {
        id: `suggested_${Date.now()}`,
        name: 'Suggested Crypto Rule',
        conditions: [
          { field: 'any', operator: 'contains', value: 'crypto' }
        ],
        action: 'quarantine',
        priority: 50,
        enabled: false,
        description: 'Suggested rule based on feedback',
        createdAt: new Date(),
        updatedAt: new Date(),
        hitCount: 0
      };
    }

    return null;
  }

  addCustomPattern(name: string, pattern: RegExp) {
    this.customPatterns.set(name, pattern);
  }

  testRule(rule: Rule, testData: Record<string, any>): boolean {
    const mockSubmission: FormSubmission = {
      id: 'test',
      sessionId: 'test',
      timestamp: new Date(),
      fields: testData,
      metadata: {} as any,
      ip: '0.0.0.0',
      userAgent: 'test'
    };

    return this.evaluateRule(rule, mockSubmission);
  }

  getStatistics() {
    const stats = {
      totalRules: this.rules.size,
      enabledRules: 0,
      totalHits: 0,
      rulesByAction: {
        block: 0,
        quarantine: 0,
        flag: 0,
        allow: 0
      },
      topRules: [] as Array<{ id: string; name: string; hits: number }>
    };

    for (const rule of this.rules.values()) {
      if (rule.enabled) stats.enabledRules++;
      stats.totalHits += rule.hitCount;
      stats.rulesByAction[rule.action]++;
    }

    // Get top 5 rules by hit count
    stats.topRules = Array.from(this.rules.values())
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 5)
      .map(r => ({ id: r.id, name: r.name, hits: r.hitCount }));

    return stats;
  }

  exportRules(): string {
    const rules = Array.from(this.rules.values());
    return JSON.stringify(rules, null, 2);
  }

  importRules(rulesJson: string) {
    try {
      const rules = JSON.parse(rulesJson) as Rule[];
      for (const rule of rules) {
        // Convert date strings back to Date objects
        rule.createdAt = new Date(rule.createdAt);
        rule.updatedAt = new Date(rule.updatedAt);
        if (rule.lastHit) rule.lastHit = new Date(rule.lastHit);
        
        // Convert regex strings back to RegExp objects
        for (const condition of rule.conditions) {
          if (condition.operator === 'matches' && typeof condition.value === 'string') {
            try {
              condition.value = new RegExp(condition.value);
            } catch {
              // Keep as string if regex is invalid
            }
          }
        }
        
        this.addRule(rule);
      }
    } catch (error) {
      console.error('Failed to import rules:', error);
      throw error;
    }
  }
}