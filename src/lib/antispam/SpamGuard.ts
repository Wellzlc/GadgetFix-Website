/**
 * SpamGuard - Comprehensive Anti-Spam System
 * Multi-layered defense against evolving spam threats
 */

import { ThreatDetector } from './modules/ThreatDetector';
import { BehavioralAnalyzer } from './modules/BehavioralAnalyzer';
import { MLClassifier } from './modules/MLClassifier';
import { RuleEngine } from './modules/RuleEngine';
import { QuarantineManager } from './modules/QuarantineManager';
import { ThreatIntelligence } from './modules/ThreatIntelligence';
import { Analytics } from './modules/Analytics';
import { type FormSubmission, type ValidationResult, type ThreatLevel } from './types';
import { configManager, type SpamConfig } from './config';

export class SpamGuard {
  private threatDetector: ThreatDetector;
  private behavioralAnalyzer: BehavioralAnalyzer;
  private mlClassifier: MLClassifier;
  private ruleEngine: RuleEngine;
  private quarantineManager: QuarantineManager;
  private threatIntel: ThreatIntelligence;
  private analytics: Analytics;
  private config: SpamConfig;

  constructor() {
    // Load configuration from centralized config manager
    this.config = configManager.getConfig();
    
    // Initialize all modules
    this.threatDetector = new ThreatDetector();
    this.behavioralAnalyzer = new BehavioralAnalyzer();
    this.mlClassifier = new MLClassifier();
    this.ruleEngine = new RuleEngine();
    this.quarantineManager = new QuarantineManager();
    this.threatIntel = new ThreatIntelligence();
    this.analytics = new Analytics();
    
    // Threat intelligence feeds are initialized automatically in the module
  }

  /**
   * Main validation entry point
   */
  async validate(submission: FormSubmission): Promise<ValidationResult> {
    const startTime = Date.now();
    const threats: any[] = [];
    let confidenceScore = 0;
    let threatLevel: ThreatLevel = 'none';
    
    try {
      // Check if whitelisted
      if (configManager.isWhitelisted('ip', submission.ip) ||
          (submission.fields.email && configManager.isWhitelisted('email', String(submission.fields.email)))) {
        // Allow whitelisted submissions
        return {
          valid: true,
          threats: [],
          confidence: 0,
          threatLevel: 'none',
          action: 'allow',
          message: 'Whitelisted source'
        };
      }
      
      // Check if blacklisted
      if (configManager.isBlacklisted('ip', submission.ip) ||
          (submission.fields.email && configManager.isBlacklisted('email', String(submission.fields.email)))) {
        // Block blacklisted submissions
        return {
          valid: false,
          threats: [],
          confidence: 1.0,
          threatLevel: 'critical',
          action: 'block',
          message: 'Blacklisted source'
        };
      }
      
      // Layer 1: Immediate Threat Detection
      if (this.config.modules.threatDetector) {
        const immediateThreats = await this.threatDetector.analyze(submission);
        threats.push(...immediateThreats.threats);
        confidenceScore = Math.max(confidenceScore, immediateThreats.confidence);
      }
      
      // Layer 2: Behavioral Analysis
      if (this.config.modules.behavioralAnalyzer) {
        const behaviorAnalysis = await this.behavioralAnalyzer.analyze(
          submission,
          this.getSessionContext(submission.sessionId)
        );
        threats.push(...behaviorAnalysis.threats);
        confidenceScore = Math.max(confidenceScore, behaviorAnalysis.confidence);
      }
      
      // Layer 3: Machine Learning Classification
      if (this.config.modules.mlClassifier) {
        const mlResult = await this.mlClassifier.classify(submission);
        threats.push(...mlResult.threats);
        confidenceScore = Math.max(confidenceScore, mlResult.confidence);
      }
      
      // Layer 4: Rule Engine Processing
      if (this.config.modules.ruleEngine) {
        const ruleResults = await this.ruleEngine.evaluate(submission, threats);
        threats.push(...ruleResults.additionalThreats);
        confidenceScore = Math.max(confidenceScore, ruleResults.confidence);
      }
      
      // Layer 5: Threat Intelligence Cross-Reference
      if (this.config.modules.threatIntelligence) {
        const threatIntelResults = await this.threatIntel.checkReputation(submission);
        threats.push(...threatIntelResults.threats);
        confidenceScore = Math.max(confidenceScore, threatIntelResults.confidence);
      }
      
      // Determine threat level
      threatLevel = this.calculateThreatLevel(confidenceScore);
      
      // Handle based on threat level
      const result = await this.handleThreatLevel(
        submission,
        threatLevel,
        confidenceScore,
        threats
      );
      
      // Analytics and Learning
      await this.recordAnalytics(submission, result, Date.now() - startTime);
      
      // Community threat sharing
      if (this.config.communitySharing && threatLevel !== 'none') {
        await this.shareThreatIntelligence(threats);
      }
      
      return result;
      
    } catch (error) {
      console.error('SpamGuard validation error:', error);
      // Fail open in case of errors (don't block legitimate users)
      return {
        valid: true,
        threats: [],
        confidence: 0,
        threatLevel: 'none',
        action: 'allow',
        message: 'Validation system temporarily unavailable'
      };
    }
  }

  /**
   * Calculate threat level based on confidence score
   */
  private calculateThreatLevel(confidence: number): ThreatLevel {
    if (confidence >= this.config.blockThreshold) return 'critical';
    if (confidence >= this.config.quarantineThreshold) return 'high';
    if (confidence >= 0.5) return 'medium';
    if (confidence >= 0.3) return 'low';
    return 'none';
  }

  /**
   * Handle submission based on threat level
   */
  private async handleThreatLevel(
    submission: FormSubmission,
    threatLevel: ThreatLevel,
    confidence: number,
    threats: any[]
  ): Promise<ValidationResult> {
    let action: 'allow' | 'quarantine' | 'block' = 'allow';
    let message = 'Submission accepted';
    
    switch (threatLevel) {
      case 'critical':
        action = 'block';
        message = 'Submission rejected due to security concerns';
        await this.logBlockedSubmission(submission, threats);
        break;
        
      case 'high':
        action = 'quarantine';
        await this.quarantineManager.quarantine(submission, threats, confidence);
        message = 'Submission held for review';
        break;
        
      case 'medium':
        if (this.config.strictMode) {
          action = 'quarantine';
          await this.quarantineManager.quarantine(submission, threats, confidence);
          message = 'Submission held for review';
        } else {
          action = 'allow';
          await this.flagForReview(submission, threats);
        }
        break;
        
      case 'low':
        action = 'allow';
        await this.flagForReview(submission, threats);
        break;
        
      default:
        action = 'allow';
    }
    
    return {
      valid: action === 'allow',
      threats,
      confidence,
      threatLevel,
      action,
      message,
      quarantineId: action === 'quarantine' ? 
        await this.quarantineManager.getQuarantineId(submission) : undefined
    };
  }

  /**
   * Get session context for behavioral analysis
   */
  private getSessionContext(sessionId: string) {
    // Retrieve session history, previous submissions, etc.
    return {
      previousSubmissions: [],
      ipHistory: [],
      userAgent: '',
      referrer: '',
      timezone: '',
      language: ''
    };
  }

  /**
   * Log blocked submission for analysis
   */
  private async logBlockedSubmission(submission: FormSubmission, threats: any[]) {
    await this.analytics.logBlocked({
      timestamp: new Date(),
      submission,
      threats,
      fingerprint: await this.generateFingerprint(submission)
    });
  }

  /**
   * Flag submission for manual review
   */
  private async flagForReview(submission: FormSubmission, threats: any[]) {
    await this.analytics.flagForReview({
      submission,
      threats,
      timestamp: new Date()
    });
  }

  /**
   * Record analytics for learning and reporting
   */
  private async recordAnalytics(
    submission: FormSubmission,
    result: ValidationResult,
    processingTime: number
  ) {
    await this.analytics.record({
      submission,
      result,
      processingTime,
      timestamp: new Date()
    });
    
    // Feed to ML for learning
    if (this.config.learningMode) {
      await this.mlClassifier.learn(submission, result);
    }
  }

  /**
   * Share threat intelligence with community
   */
  private async shareThreatIntelligence(threats: any[]) {
    if (threats.some(t => t.confidence > 0.8)) {
      await this.threatIntel.shareWithCommunity(threats);
    }
  }

  /**
   * Generate fingerprint for submission tracking
   */
  private async generateFingerprint(submission: FormSubmission): Promise<string> {
    const data = JSON.stringify({
      ip: submission.ip,
      userAgent: submission.userAgent,
      fields: Object.keys(submission.fields).sort()
    });
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(newConfig: Partial<typeof SpamGuard.prototype.config>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current system status
   */
  async getStatus() {
    return {
      config: this.config,
      stats: await this.analytics.getStats(),
      quarantineCount: await this.quarantineManager.getCount(),
      threatIntelStatus: await this.threatIntel.getStatus(),
      mlModelVersion: this.mlClassifier.getVersion()
    };
  }

  /**
   * Manual review result feedback for learning
   */
  async provideFeedback(
    submissionId: string,
    wasSpam: boolean,
    feedback?: string
  ) {
    await this.mlClassifier.feedback(submissionId, wasSpam);
    await this.analytics.recordFeedback(submissionId, wasSpam, feedback);
    
    // Update rules if needed
    if (feedback) {
      await this.ruleEngine.suggestRule(feedback);
    }
  }
}

export default SpamGuard;