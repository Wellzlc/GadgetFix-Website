/**
 * SpamGuard Configuration
 * Adjust these settings to fine-tune the anti-spam system
 */

export interface SpamConfig {
  // Confidence thresholds
  blockThreshold: number;      // Block submissions above this confidence
  quarantineThreshold: number; // Quarantine submissions above this confidence
  
  // Rate limiting
  maxSubmissionsPerMinute: number;
  maxSubmissionsPerHour: number;
  maxSubmissionsPerDay: number;
  
  // Module enable/disable
  modules: {
    threatDetector: boolean;
    behavioralAnalyzer: boolean;
    mlClassifier: boolean;
    ruleEngine: boolean;
    threatIntelligence: boolean;
  };
  
  // Behavioral thresholds
  minSubmissionTime: number;    // Minimum time in ms to fill form
  maxSubmissionTime: number;    // Maximum reasonable time in ms
  minMouseMovements: number;     // Minimum mouse movements expected
  minKeystrokes: number;         // Minimum keystrokes for text length
  
  // Quarantine settings
  quarantineExpiryDays: number;
  maxQuarantineItems: number;
  autoRejectExpired: boolean;
  
  // Learning mode
  learningMode: boolean;        // Log but don't block
  strictMode: boolean;          // More aggressive blocking
  
  // Notifications
  notifications: {
    enabled: boolean;
    email?: string;
    slackWebhook?: string;
    quarantineAlerts: boolean;
    criticalThreatsOnly: boolean;
  };
  
  // Whitelists
  whitelistedIPs: string[];
  whitelistedEmails: string[];
  trustedDomains: string[];
  
  // Blacklists (in addition to threat feeds)
  blacklistedIPs: string[];
  blacklistedEmails: string[];
  blacklistedDomains: string[];
  
  // Custom patterns
  customBlockPatterns: string[];
  customAllowPatterns: string[];
}

// Default configuration
export const DEFAULT_CONFIG: SpamConfig = {
  // Thresholds - Start conservative, adjust based on results
  blockThreshold: 0.9,          // 90% confidence = definite spam
  quarantineThreshold: 0.7,     // 70% confidence = needs review
  
  // Rate limiting
  maxSubmissionsPerMinute: 3,
  maxSubmissionsPerHour: 10,
  maxSubmissionsPerDay: 50,
  
  // All modules enabled by default
  modules: {
    threatDetector: true,
    behavioralAnalyzer: true,
    mlClassifier: true,
    ruleEngine: true,
    threatIntelligence: true
  },
  
  // Behavioral thresholds
  minSubmissionTime: 3000,      // 3 seconds minimum
  maxSubmissionTime: 3600000,   // 1 hour maximum
  minMouseMovements: 5,          // At least 5 mouse movements
  minKeystrokes: 10,             // At least 10 keystrokes
  
  // Quarantine
  quarantineExpiryDays: 7,
  maxQuarantineItems: 1000,
  autoRejectExpired: true,
  
  // Modes
  learningMode: false,          // Production mode by default
  strictMode: false,             // Normal mode by default
  
  // Notifications (configure these!)
  notifications: {
    enabled: false,              // Enable after configuring
    email: '',                   // Add your email
    slackWebhook: '',           // Add Slack webhook URL
    quarantineAlerts: true,
    criticalThreatsOnly: false
  },
  
  // Whitelists (add trusted sources)
  whitelistedIPs: [
    // Add your office/home IPs here
    // '192.168.1.1'
  ],
  whitelistedEmails: [
    // Add trusted email addresses
    // 'admin@gadgetfix.com'
  ],
  trustedDomains: [
    'gadgetfix.com',
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com'
  ],
  
  // Blacklists (known bad actors)
  blacklistedIPs: [
    // Will be populated by threat feeds
  ],
  blacklistedEmails: [
    // Add known spam emails
  ],
  blacklistedDomains: [
    // Add known spam domains
  ],
  
  // Custom patterns
  customBlockPatterns: [
    // Add custom regex patterns to block
    // 'viagra|cialis|pharmacy'
  ],
  customAllowPatterns: [
    // Add patterns that should always be allowed
    // 'gadgetfix|phone repair|screen replacement'
  ]
};

// Environment-specific overrides
export function getConfig(): SpamConfig {
  const config = { ...DEFAULT_CONFIG };
  
  // Development mode adjustments
  if (import.meta.env.DEV) {
    config.learningMode = true;  // Don't block in dev
    config.blockThreshold = 0.99; // Higher threshold in dev
    config.notifications.enabled = false;
  }
  
  // Production mode adjustments
  if (import.meta.env.PROD) {
    config.strictMode = true;     // More aggressive in production
    config.modules.threatIntelligence = true; // Use threat feeds
  }
  
  // Load from environment variables if available
  if (import.meta.env.SPAM_BLOCK_THRESHOLD) {
    config.blockThreshold = parseFloat(import.meta.env.SPAM_BLOCK_THRESHOLD);
  }
  
  if (import.meta.env.SPAM_QUARANTINE_THRESHOLD) {
    config.quarantineThreshold = parseFloat(import.meta.env.SPAM_QUARANTINE_THRESHOLD);
  }
  
  if (import.meta.env.SPAM_NOTIFICATION_EMAIL) {
    config.notifications.email = import.meta.env.SPAM_NOTIFICATION_EMAIL;
    config.notifications.enabled = true;
  }
  
  if (import.meta.env.SPAM_SLACK_WEBHOOK) {
    config.notifications.slackWebhook = import.meta.env.SPAM_SLACK_WEBHOOK;
    config.notifications.enabled = true;
  }
  
  return config;
}

// Helper to update config at runtime
export class ConfigManager {
  private static instance: ConfigManager;
  private config: SpamConfig;
  
  private constructor() {
    this.config = getConfig();
  }
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  getConfig(): SpamConfig {
    return this.config;
  }
  
  updateConfig(updates: Partial<SpamConfig>) {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }
  
  private saveConfig() {
    // In production, save to database or file
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('spamguard_config', JSON.stringify(this.config));
    }
  }
  
  loadConfig() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('spamguard_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.config = { ...this.config, ...parsed };
        } catch (error) {
          console.error('Failed to load saved config:', error);
        }
      }
    }
  }
  
  resetToDefaults() {
    this.config = getConfig();
    this.saveConfig();
  }
  
  // Convenience methods
  isWhitelisted(type: 'ip' | 'email', value: string): boolean {
    switch (type) {
      case 'ip':
        return this.config.whitelistedIPs.includes(value);
      case 'email':
        const domain = value.split('@')[1];
        return this.config.whitelistedEmails.includes(value) ||
               this.config.trustedDomains.includes(domain);
      default:
        return false;
    }
  }
  
  isBlacklisted(type: 'ip' | 'email' | 'domain', value: string): boolean {
    switch (type) {
      case 'ip':
        return this.config.blacklistedIPs.includes(value);
      case 'email':
        return this.config.blacklistedEmails.includes(value);
      case 'domain':
        return this.config.blacklistedDomains.includes(value);
      default:
        return false;
    }
  }
  
  addToWhitelist(type: 'ip' | 'email' | 'domain', value: string) {
    switch (type) {
      case 'ip':
        if (!this.config.whitelistedIPs.includes(value)) {
          this.config.whitelistedIPs.push(value);
        }
        break;
      case 'email':
        if (!this.config.whitelistedEmails.includes(value)) {
          this.config.whitelistedEmails.push(value);
        }
        break;
      case 'domain':
        if (!this.config.trustedDomains.includes(value)) {
          this.config.trustedDomains.push(value);
        }
        break;
    }
    this.saveConfig();
  }
  
  removeFromWhitelist(type: 'ip' | 'email' | 'domain', value: string) {
    switch (type) {
      case 'ip':
        this.config.whitelistedIPs = this.config.whitelistedIPs.filter(ip => ip !== value);
        break;
      case 'email':
        this.config.whitelistedEmails = this.config.whitelistedEmails.filter(email => email !== value);
        break;
      case 'domain':
        this.config.trustedDomains = this.config.trustedDomains.filter(domain => domain !== value);
        break;
    }
    this.saveConfig();
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();