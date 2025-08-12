/**
 * Type definitions for the SpamGuard anti-spam system
 */

export interface FormSubmission {
  id: string;
  sessionId: string;
  timestamp: Date;
  fields: Record<string, any>;
  metadata: SubmissionMetadata;
  ip: string;
  userAgent: string;
  referrer?: string;
  origin?: string;
}

export interface SubmissionMetadata {
  formId: string;
  formType: string;
  submissionTime: number; // Time taken to fill form in ms
  keystrokes?: number;
  mouseMovements?: number;
  fieldFocusOrder?: string[];
  copyPasteEvents?: number;
  timezone?: string;
  language?: string;
  screenResolution?: string;
  colorDepth?: number;
  platform?: string;
  plugins?: string[];
  fonts?: string[];
  canvas?: string; // Canvas fingerprint
  webgl?: string; // WebGL fingerprint
  audio?: string; // Audio fingerprint
}

export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ValidationResult {
  valid: boolean;
  threats: Threat[];
  confidence: number;
  threatLevel: ThreatLevel;
  action: 'allow' | 'quarantine' | 'block';
  message: string;
  quarantineId?: string;
  suggestions?: string[];
}

export interface Threat {
  type: ThreatType;
  field?: string;
  pattern?: string;
  confidence: number;
  description: string;
  evidence: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigations?: string[];
}

export enum ThreatType {
  // Cryptocurrency & Financial Scams
  CRYPTO_SCAM = 'crypto_scam',
  BITCOIN_ADDRESS = 'bitcoin_address',
  WALLET_PHISHING = 'wallet_phishing',
  FAKE_TRANSFER = 'fake_transfer',
  ACTIVATION_SCHEME = 'activation_scheme',
  
  // Content Anomalies
  FIELD_MISMATCH = 'field_mismatch',
  URL_IN_NAME = 'url_in_name',
  EXCESSIVE_URLS = 'excessive_urls',
  SUSPICIOUS_KEYWORDS = 'suspicious_keywords',
  AI_GENERATED = 'ai_generated',
  
  // Email & Contact Issues
  DISPOSABLE_EMAIL = 'disposable_email',
  SUSPICIOUS_EMAIL = 'suspicious_email',
  EMAIL_DOMAIN_MISMATCH = 'email_domain_mismatch',
  INVALID_PHONE = 'invalid_phone',
  PHONE_GEO_MISMATCH = 'phone_geo_mismatch',
  
  // Behavioral Anomalies
  RAPID_SUBMISSION = 'rapid_submission',
  BOT_BEHAVIOR = 'bot_behavior',
  HONEYPOT_TRIGGERED = 'honeypot_triggered',
  SUSPICIOUS_TIMING = 'suspicious_timing',
  GEO_INCONSISTENCY = 'geo_inconsistency',
  VPN_DETECTED = 'vpn_detected',
  TOR_DETECTED = 'tor_detected',
  
  // Social Engineering
  URGENCY_LANGUAGE = 'urgency_language',
  AUTHORITY_CLAIM = 'authority_claim',
  FEAR_TACTIC = 'fear_tactic',
  TOO_GOOD_TO_BE_TRUE = 'too_good_to_be_true',
  EMOTIONAL_MANIPULATION = 'emotional_manipulation',
  
  // Technical Threats
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION = 'sql_injection',
  COMMAND_INJECTION = 'command_injection',
  PATH_TRAVERSAL = 'path_traversal',
  
  // Reputation Issues
  BLACKLISTED_IP = 'blacklisted_ip',
  BLACKLISTED_EMAIL = 'blacklisted_email',
  KNOWN_SPAMMER = 'known_spammer',
  BAD_REPUTATION = 'bad_reputation'
}

export interface Pattern {
  id: string;
  name: string;
  regex?: RegExp;
  keywords?: string[];
  weight: number;
  enabled: boolean;
  description: string;
  examples?: string[];
  falsePositiveRate?: number;
}

export interface Rule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  action: 'allow' | 'quarantine' | 'block' | 'flag';
  priority: number;
  enabled: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  hitCount: number;
  lastHit?: Date;
}

export interface RuleCondition {
  field?: string;
  operator: 'contains' | 'equals' | 'matches' | 'greater' | 'less' | 'in' | 'not_in';
  value: any;
  caseSensitive?: boolean;
}

export interface SessionContext {
  previousSubmissions: FormSubmission[];
  ipHistory: string[];
  userAgent: string;
  referrer: string;
  timezone: string;
  language: string;
  deviceFingerprint?: string;
  riskScore?: number;
}

export interface ThreatIntelFeed {
  url: string;
  type: 'ip' | 'email' | 'domain' | 'hash';
  updateFrequency: number; // in minutes
  enabled: boolean;
  lastUpdate?: Date;
  hitCount: number;
}

export interface MLFeatures {
  // Text features
  textLength: number;
  wordCount: number;
  uniqueWords: number;
  avgWordLength: number;
  capitalRatio: number;
  punctuationRatio: number;
  digitRatio: number;
  specialCharRatio: number;
  
  // URL features
  urlCount: number;
  uniqueDomains: number;
  suspiciousUrls: number;
  shortenerUrls: number;
  
  // Entropy features
  shannonEntropy: number;
  
  // Linguistic features
  sentimentScore: number;
  urgencyScore: number;
  complexityScore: number;
  
  // Behavioral features
  submissionTime: number;
  fieldInteractions: number;
  correctionCount: number;
  
  // Technical features
  browserAge: number;
  cookiesEnabled: boolean;
  jsEnabled: boolean;
  pluginCount: number;
}

export interface QuarantineEntry {
  id: string;
  submission: FormSubmission;
  threats: Threat[];
  confidence: number;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface AnalyticsData {
  totalSubmissions: number;
  blockedSubmissions: number;
  quarantinedSubmissions: number;
  allowedSubmissions: number;
  falsePositives: number;
  falseNegatives: number;
  avgProcessingTime: number;
  threatDistribution: Record<ThreatType, number>;
  topThreats: Array<{ type: ThreatType; count: number }>;
  geoDistribution: Record<string, number>;
  timeDistribution: Record<string, number>;
  deviceDistribution: Record<string, number>;
}

export interface AdminConfig {
  strictMode: boolean;
  learningMode: boolean;
  quarantineThreshold: number;
  blockThreshold: number;
  maxSubmissionsPerMinute: number;
  maxSubmissionsPerHour: number;
  enabledModules: string[];
  customPatterns: Pattern[];
  customRules: Rule[];
  whitelistedIPs: string[];
  blacklistedIPs: string[];
  trustedDomains: string[];
}