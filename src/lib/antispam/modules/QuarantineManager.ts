/**
 * QuarantineManager - Manages quarantined submissions for manual review
 * Provides interface for reviewing and processing suspicious submissions
 */

import { FormSubmission, QuarantineEntry, Threat, ValidationResult } from '../types';

export class QuarantineManager {
  private quarantineStore: Map<string, QuarantineEntry> = new Map();
  private readonly maxQuarantineSize = 1000;
  private readonly quarantineExpiryDays = 7;
  private reviewCallbacks: Map<string, (approved: boolean, notes?: string) => void> = new Map();

  async quarantine(
    submission: FormSubmission,
    threats: Threat[],
    confidence: number
  ): Promise<string> {
    const quarantineId = this.generateQuarantineId();
    
    const entry: QuarantineEntry = {
      id: quarantineId,
      submission,
      threats,
      confidence,
      timestamp: new Date(),
      status: 'pending'
    };

    this.quarantineStore.set(quarantineId, entry);
    
    // Enforce size limit
    this.enforceQuarantineLimit();
    
    // Schedule expiry
    this.scheduleExpiry(quarantineId);
    
    // Notify administrators
    await this.notifyAdmins(entry);
    
    return quarantineId;
  }

  async review(
    quarantineId: string,
    approved: boolean,
    reviewedBy: string,
    notes?: string
  ): Promise<ValidationResult> {
    const entry = this.quarantineStore.get(quarantineId);
    
    if (!entry) {
      throw new Error(`Quarantine entry ${quarantineId} not found`);
    }
    
    if (entry.status !== 'pending') {
      throw new Error(`Entry ${quarantineId} has already been reviewed`);
    }
    
    // Update entry
    entry.status = approved ? 'approved' : 'rejected';
    entry.reviewedBy = reviewedBy;
    entry.reviewedAt = new Date();
    entry.reviewNotes = notes;
    
    // Execute callback if registered
    const callback = this.reviewCallbacks.get(quarantineId);
    if (callback) {
      callback(approved, notes);
      this.reviewCallbacks.delete(quarantineId);
    }
    
    // Learn from the decision
    await this.learnFromReview(entry, approved);
    
    return {
      valid: approved,
      threats: approved ? [] : entry.threats,
      confidence: entry.confidence,
      threatLevel: approved ? 'none' : 'high',
      action: approved ? 'allow' : 'block',
      message: approved ? 'Approved by manual review' : 'Rejected by manual review',
      quarantineId
    };
  }

  getEntry(quarantineId: string): QuarantineEntry | undefined {
    return this.quarantineStore.get(quarantineId);
  }

  getPendingEntries(): QuarantineEntry[] {
    return Array.from(this.quarantineStore.values())
      .filter(entry => entry.status === 'pending')
      .sort((a, b) => b.confidence - a.confidence);
  }

  getRecentEntries(limit: number = 50): QuarantineEntry[] {
    return Array.from(this.quarantineStore.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  searchEntries(criteria: {
    status?: 'pending' | 'approved' | 'rejected' | 'expired';
    threatType?: string;
    minConfidence?: number;
    maxConfidence?: number;
    startDate?: Date;
    endDate?: Date;
    reviewedBy?: string;
  }): QuarantineEntry[] {
    let entries = Array.from(this.quarantineStore.values());
    
    if (criteria.status) {
      entries = entries.filter(e => e.status === criteria.status);
    }
    
    if (criteria.threatType) {
      entries = entries.filter(e => 
        e.threats.some(t => t.type === criteria.threatType)
      );
    }
    
    if (criteria.minConfidence !== undefined) {
      entries = entries.filter(e => e.confidence >= criteria.minConfidence);
    }
    
    if (criteria.maxConfidence !== undefined) {
      entries = entries.filter(e => e.confidence <= criteria.maxConfidence);
    }
    
    if (criteria.startDate) {
      entries = entries.filter(e => e.timestamp >= criteria.startDate);
    }
    
    if (criteria.endDate) {
      entries = entries.filter(e => e.timestamp <= criteria.endDate);
    }
    
    if (criteria.reviewedBy) {
      entries = entries.filter(e => e.reviewedBy === criteria.reviewedBy);
    }
    
    return entries;
  }

  async bulkReview(
    quarantineIds: string[],
    approved: boolean,
    reviewedBy: string,
    notes?: string
  ): Promise<void> {
    for (const id of quarantineIds) {
      try {
        await this.review(id, approved, reviewedBy, notes);
      } catch (error) {
        console.error(`Failed to review ${id}:`, error);
      }
    }
  }

  registerReviewCallback(
    quarantineId: string,
    callback: (approved: boolean, notes?: string) => void
  ) {
    this.reviewCallbacks.set(quarantineId, callback);
  }

  private generateQuarantineId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private enforceQuarantineLimit() {
    if (this.quarantineStore.size > this.maxQuarantineSize) {
      // Remove oldest expired entries first
      const expired = Array.from(this.quarantineStore.entries())
        .filter(([_, entry]) => entry.status === 'expired')
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      
      for (const [id] of expired) {
        if (this.quarantineStore.size <= this.maxQuarantineSize) break;
        this.quarantineStore.delete(id);
      }
      
      // If still over limit, remove oldest reviewed entries
      if (this.quarantineStore.size > this.maxQuarantineSize) {
        const reviewed = Array.from(this.quarantineStore.entries())
          .filter(([_, entry]) => entry.status !== 'pending')
          .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
        
        for (const [id] of reviewed) {
          if (this.quarantineStore.size <= this.maxQuarantineSize) break;
          this.quarantineStore.delete(id);
        }
      }
    }
  }

  private scheduleExpiry(quarantineId: string) {
    setTimeout(() => {
      const entry = this.quarantineStore.get(quarantineId);
      if (entry && entry.status === 'pending') {
        entry.status = 'expired';
        this.handleExpiredEntry(entry);
      }
    }, this.quarantineStoreExpiryDays * 24 * 60 * 60 * 1000);
  }

  private async handleExpiredEntry(entry: QuarantineEntry) {
    // Default action for expired entries (conservative: block)
    const callback = this.reviewCallbacks.get(entry.id);
    if (callback) {
      callback(false, 'Expired - automatically rejected');
      this.reviewCallbacks.delete(entry.id);
    }
    
    // Log for audit
    console.log(`Quarantine entry ${entry.id} expired and was automatically rejected`);
  }

  private async notifyAdmins(entry: QuarantineEntry) {
    // In production, this would send notifications via email, Slack, etc.
    const notification = {
      type: 'quarantine_alert',
      quarantineId: entry.id,
      confidence: entry.confidence,
      threats: entry.threats.map(t => ({
        type: t.type,
        severity: t.severity,
        description: t.description
      })),
      timestamp: entry.timestamp,
      reviewUrl: `/admin/quarantine/${entry.id}`
    };
    
    // Log for now
    console.log('Admin notification:', notification);
  }

  private async learnFromReview(entry: QuarantineEntry, approved: boolean) {
    // Feed this decision back to the ML model and rules engine
    // This helps the system learn from manual reviews
    
    const learningData = {
      submission: entry.submission,
      threats: entry.threats,
      confidence: entry.confidence,
      humanDecision: approved ? 'ham' : 'spam',
      reviewNotes: entry.reviewNotes
    };
    
    // In production, this would update ML models and adjust rules
    console.log('Learning from review:', learningData);
  }

  getStatistics() {
    const stats = {
      total: this.quarantineStore.size,
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      avgReviewTime: 0,
      threatTypeDistribution: new Map<string, number>(),
      confidenceDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    };
    
    const reviewTimes: number[] = [];
    
    for (const entry of this.quarantineStore.values()) {
      // Status counts
      stats[entry.status]++;
      
      // Review time calculation
      if (entry.reviewedAt && entry.status !== 'expired') {
        reviewTimes.push(entry.reviewedAt.getTime() - entry.timestamp.getTime());
      }
      
      // Threat type distribution
      for (const threat of entry.threats) {
        const count = stats.threatTypeDistribution.get(threat.type) || 0;
        stats.threatTypeDistribution.set(threat.type, count + 1);
      }
      
      // Confidence distribution
      if (entry.confidence < 0.3) stats.confidenceDistribution.low++;
      else if (entry.confidence < 0.6) stats.confidenceDistribution.medium++;
      else if (entry.confidence < 0.9) stats.confidenceDistribution.high++;
      else stats.confidenceDistribution.critical++;
    }
    
    // Calculate average review time
    if (reviewTimes.length > 0) {
      stats.avgReviewTime = reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length;
    }
    
    return stats;
  }

  exportEntries(format: 'json' | 'csv' = 'json'): string {
    const entries = Array.from(this.quarantineStore.values());
    
    if (format === 'json') {
      return JSON.stringify(entries, null, 2);
    }
    
    // CSV format
    const headers = [
      'ID', 'Status', 'Confidence', 'Timestamp', 'Threats',
      'Reviewed By', 'Reviewed At', 'Notes'
    ];
    
    const rows = entries.map(entry => [
      entry.id,
      entry.status,
      entry.confidence.toFixed(2),
      entry.timestamp.toISOString(),
      entry.threats.map(t => t.type).join(';'),
      entry.reviewedBy || '',
      entry.reviewedAt?.toISOString() || '',
      entry.reviewNotes || ''
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  clearExpired() {
    const now = new Date();
    const expiryTime = this.quarantineStoreExpiryDays * 24 * 60 * 60 * 1000;
    
    for (const [id, entry] of this.quarantineStore.entries()) {
      if (entry.status === 'expired' || 
          (now.getTime() - entry.timestamp.getTime() > expiryTime * 2)) {
        this.quarantineStore.delete(id);
      }
    }
  }
}