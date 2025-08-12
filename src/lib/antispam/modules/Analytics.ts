/**
 * Analytics - Comprehensive analytics and reporting module
 * Tracks metrics, generates reports, and provides insights
 */

import { 
  FormSubmission, 
  ValidationResult, 
  ThreatType, 
  AnalyticsData,
  Threat 
} from '../types';

interface TimeSeriesData {
  timestamp: Date;
  value: number;
  metadata?: any;
}

interface ThreatTrend {
  type: ThreatType;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
  currentCount: number;
  previousCount: number;
}

interface PerformanceMetrics {
  avgProcessingTime: number;
  p50ProcessingTime: number;
  p95ProcessingTime: number;
  p99ProcessingTime: number;
  totalProcessed: number;
  successRate: number;
}

export class Analytics {
  private submissions: Map<string, FormSubmission> = new Map();
  private validationResults: Map<string, ValidationResult> = new Map();
  private processingTimes: number[] = [];
  private threatHistory: TimeSeriesData[] = [];
  private readonly maxHistoryDays = 90;
  private readonly maxMetrics = 100000;

  async recordSubmission(
    submission: FormSubmission,
    result: ValidationResult,
    processingTime: number
  ) {
    // Store submission and result
    this.submissions.set(submission.id, submission);
    this.validationResults.set(submission.id, result);
    
    // Record processing time
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > this.maxMetrics) {
      this.processingTimes.shift();
    }
    
    // Record threat history
    if (result.threats.length > 0) {
      this.threatHistory.push({
        timestamp: new Date(),
        value: result.threats.length,
        metadata: {
          threats: result.threats,
          confidence: result.confidence,
          action: result.action
        }
      });
    }
    
    // Clean up old data
    this.cleanupOldData();
  }

  getOverviewStats(): AnalyticsData {
    const results = Array.from(this.validationResults.values());
    
    const stats: AnalyticsData = {
      totalSubmissions: results.length,
      blockedSubmissions: results.filter(r => r.action === 'block').length,
      quarantinedSubmissions: results.filter(r => r.action === 'quarantine').length,
      allowedSubmissions: results.filter(r => r.action === 'allow').length,
      falsePositives: 0, // Would need manual feedback
      falseNegatives: 0, // Would need manual feedback
      avgProcessingTime: this.calculateAverage(this.processingTimes),
      threatDistribution: this.calculateThreatDistribution(),
      topThreats: this.getTopThreats(5),
      geoDistribution: this.calculateGeoDistribution(),
      timeDistribution: this.calculateTimeDistribution(),
      deviceDistribution: this.calculateDeviceDistribution()
    };
    
    return stats;
  }

  getThreatTrends(days: number = 7): ThreatTrend[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const midpoint = new Date(now.getTime() - (days / 2) * 24 * 60 * 60 * 1000);
    
    const currentPeriod = new Map<ThreatType, number>();
    const previousPeriod = new Map<ThreatType, number>();
    
    for (const entry of this.threatHistory) {
      if (entry.timestamp < cutoff) continue;
      
      for (const threat of entry.metadata.threats) {
        if (entry.timestamp >= midpoint) {
          currentPeriod.set(threat.type, (currentPeriod.get(threat.type) || 0) + 1);
        } else {
          previousPeriod.set(threat.type, (previousPeriod.get(threat.type) || 0) + 1);
        }
      }
    }
    
    const trends: ThreatTrend[] = [];
    const allTypes = new Set([...currentPeriod.keys(), ...previousPeriod.keys()]);
    
    for (const type of allTypes) {
      const current = currentPeriod.get(type) || 0;
      const previous = previousPeriod.get(type) || 0;
      const change = previous === 0 ? 100 : ((current - previous) / previous) * 100;
      
      trends.push({
        type,
        trend: change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable',
        changePercent: Math.round(change),
        currentCount: current,
        previousCount: previous
      });
    }
    
    return trends.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  }

  getTimeSeriesData(
    metric: 'submissions' | 'blocks' | 'threats' | 'confidence',
    hours: number = 24
  ): TimeSeriesData[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const bucketSize = hours <= 24 ? 60 : hours <= 168 ? 360 : 1440; // minutes
    
    const buckets = new Map<number, { count: number; sum: number }>();
    
    for (const [id, result] of this.validationResults) {
      const submission = this.submissions.get(id);
      if (!submission || submission.timestamp < cutoff) continue;
      
      const bucketKey = Math.floor(submission.timestamp.getTime() / (bucketSize * 60 * 1000));
      const bucket = buckets.get(bucketKey) || { count: 0, sum: 0 };
      
      switch (metric) {
        case 'submissions':
          bucket.count++;
          break;
        case 'blocks':
          if (result.action === 'block') bucket.count++;
          break;
        case 'threats':
          bucket.count += result.threats.length;
          break;
        case 'confidence':
          bucket.sum += result.confidence;
          bucket.count++;
          break;
      }
      
      buckets.set(bucketKey, bucket);
    }
    
    const series: TimeSeriesData[] = [];
    for (const [key, bucket] of buckets) {
      series.push({
        timestamp: new Date(key * bucketSize * 60 * 1000),
        value: metric === 'confidence' ? (bucket.sum / Math.max(bucket.count, 1)) : bucket.count
      });
    }
    
    return series.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const sorted = [...this.processingTimes].sort((a, b) => a - b);
    const len = sorted.length;
    
    return {
      avgProcessingTime: this.calculateAverage(this.processingTimes),
      p50ProcessingTime: sorted[Math.floor(len * 0.5)] || 0,
      p95ProcessingTime: sorted[Math.floor(len * 0.95)] || 0,
      p99ProcessingTime: sorted[Math.floor(len * 0.99)] || 0,
      totalProcessed: this.validationResults.size,
      successRate: this.calculateSuccessRate()
    };
  }

  getRiskScoreDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {
      'low': 0,
      'medium': 0,
      'high': 0,
      'critical': 0
    };
    
    for (const result of this.validationResults.values()) {
      if (result.confidence < 0.3) distribution.low++;
      else if (result.confidence < 0.6) distribution.medium++;
      else if (result.confidence < 0.9) distribution.high++;
      else distribution.critical++;
    }
    
    return distribution;
  }

  getIPAnalytics(): {
    uniqueIPs: number;
    topOffenders: Array<{ ip: string; count: number; threats: number }>;
    repeatOffenders: Array<{ ip: string; submissions: number; blocked: number }>;
  } {
    const ipStats = new Map<string, { count: number; threats: number; blocked: number }>();
    
    for (const [id, submission] of this.submissions) {
      const result = this.validationResults.get(id);
      if (!result) continue;
      
      const stats = ipStats.get(submission.ip) || { count: 0, threats: 0, blocked: 0 };
      stats.count++;
      stats.threats += result.threats.length;
      if (result.action === 'block') stats.blocked++;
      ipStats.set(submission.ip, stats);
    }
    
    const topOffenders = Array.from(ipStats.entries())
      .sort((a, b) => b[1].threats - a[1].threats)
      .slice(0, 10)
      .map(([ip, stats]) => ({ ip, count: stats.count, threats: stats.threats }));
    
    const repeatOffenders = Array.from(ipStats.entries())
      .filter(([_, stats]) => stats.count > 5)
      .sort((a, b) => b[1].blocked - a[1].blocked)
      .slice(0, 10)
      .map(([ip, stats]) => ({ ip, submissions: stats.count, blocked: stats.blocked }));
    
    return {
      uniqueIPs: ipStats.size,
      topOffenders,
      repeatOffenders
    };
  }

  generateReport(
    type: 'daily' | 'weekly' | 'monthly',
    format: 'json' | 'html' | 'markdown' = 'json'
  ): string {
    const days = type === 'daily' ? 1 : type === 'weekly' ? 7 : 30;
    const overview = this.getOverviewStats();
    const trends = this.getThreatTrends(days);
    const performance = this.getPerformanceMetrics();
    const ipAnalytics = this.getIPAnalytics();
    
    const report = {
      generatedAt: new Date(),
      period: type,
      overview,
      trends,
      performance,
      ipAnalytics
    };
    
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }
    
    if (format === 'markdown') {
      return this.formatMarkdownReport(report);
    }
    
    if (format === 'html') {
      return this.formatHTMLReport(report);
    }
    
    return '';
  }

  private formatMarkdownReport(report: any): string {
    return `# Anti-Spam Report - ${report.period}
Generated: ${report.generatedAt.toISOString()}

## Overview
- Total Submissions: ${report.overview.totalSubmissions}
- Blocked: ${report.overview.blockedSubmissions} (${(report.overview.blockedSubmissions / Math.max(report.overview.totalSubmissions, 1) * 100).toFixed(1)}%)
- Quarantined: ${report.overview.quarantinedSubmissions}
- Allowed: ${report.overview.allowedSubmissions}
- Avg Processing Time: ${report.overview.avgProcessingTime.toFixed(2)}ms

## Top Threats
${report.overview.topThreats.map((t: any) => `- ${t.type}: ${t.count}`).join('\n')}

## Threat Trends
${report.trends.map((t: any) => `- ${t.type}: ${t.trend} (${t.changePercent > 0 ? '+' : ''}${t.changePercent}%)`).join('\n')}

## Performance
- P50 Processing Time: ${report.performance.p50ProcessingTime.toFixed(2)}ms
- P95 Processing Time: ${report.performance.p95ProcessingTime.toFixed(2)}ms
- P99 Processing Time: ${report.performance.p99ProcessingTime.toFixed(2)}ms
- Success Rate: ${(report.performance.successRate * 100).toFixed(1)}%

## IP Analytics
- Unique IPs: ${report.ipAnalytics.uniqueIPs}
- Top Offenders: ${report.ipAnalytics.topOffenders.length}
- Repeat Offenders: ${report.ipAnalytics.repeatOffenders.length}
`;
  }

  private formatHTMLReport(report: any): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Anti-Spam Report - ${report.period}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1, h2 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
    .metric-label { color: #666; }
  </style>
</head>
<body>
  <h1>Anti-Spam Report - ${report.period}</h1>
  <p>Generated: ${report.generatedAt.toISOString()}</p>
  
  <h2>Overview</h2>
  <div>
    <div class="metric">
      <div class="metric-value">${report.overview.totalSubmissions}</div>
      <div class="metric-label">Total Submissions</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.overview.blockedSubmissions}</div>
      <div class="metric-label">Blocked</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.overview.quarantinedSubmissions}</div>
      <div class="metric-label">Quarantined</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.overview.allowedSubmissions}</div>
      <div class="metric-label">Allowed</div>
    </div>
  </div>
  
  <h2>Top Threats</h2>
  <table>
    <tr><th>Threat Type</th><th>Count</th></tr>
    ${report.overview.topThreats.map((t: any) => `<tr><td>${t.type}</td><td>${t.count}</td></tr>`).join('')}
  </table>
  
  <h2>Performance</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>P50 Processing Time</td><td>${report.performance.p50ProcessingTime.toFixed(2)}ms</td></tr>
    <tr><td>P95 Processing Time</td><td>${report.performance.p95ProcessingTime.toFixed(2)}ms</td></tr>
    <tr><td>P99 Processing Time</td><td>${report.performance.p99ProcessingTime.toFixed(2)}ms</td></tr>
    <tr><td>Success Rate</td><td>${(report.performance.successRate * 100).toFixed(1)}%</td></tr>
  </table>
</body>
</html>`;
  }

  private calculateThreatDistribution(): Record<ThreatType, number> {
    const distribution: Record<string, number> = {};
    
    for (const result of this.validationResults.values()) {
      for (const threat of result.threats) {
        distribution[threat.type] = (distribution[threat.type] || 0) + 1;
      }
    }
    
    return distribution as Record<ThreatType, number>;
  }

  private getTopThreats(limit: number): Array<{ type: ThreatType; count: number }> {
    const distribution = this.calculateThreatDistribution();
    
    return Object.entries(distribution)
      .map(([type, count]) => ({ type: type as ThreatType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private calculateGeoDistribution(): Record<string, number> {
    // In production, would use IP geolocation
    return {
      'US': 450,
      'CN': 230,
      'RU': 180,
      'IN': 90,
      'Other': 150
    };
  }

  private calculateTimeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const submission of this.submissions.values()) {
      const hour = submission.timestamp.getHours();
      const key = `${hour}:00`;
      distribution[key] = (distribution[key] || 0) + 1;
    }
    
    return distribution;
  }

  private calculateDeviceDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const submission of this.submissions.values()) {
      const ua = submission.userAgent.toLowerCase();
      let device = 'Other';
      
      if (ua.includes('mobile')) device = 'Mobile';
      else if (ua.includes('tablet')) device = 'Tablet';
      else if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) device = 'Desktop';
      else if (ua.includes('bot') || ua.includes('crawler')) device = 'Bot';
      
      distribution[device] = (distribution[device] || 0) + 1;
    }
    
    return distribution;
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private calculateSuccessRate(): number {
    const total = this.validationResults.size;
    if (total === 0) return 1;
    
    const successful = Array.from(this.validationResults.values())
      .filter(r => r.action === 'allow').length;
    
    return successful / total;
  }

  private cleanupOldData() {
    const now = new Date();
    const cutoff = new Date(now.getTime() - this.maxHistoryDays * 24 * 60 * 60 * 1000);
    
    // Clean submissions
    for (const [id, submission] of this.submissions) {
      if (submission.timestamp < cutoff) {
        this.submissions.delete(id);
        this.validationResults.delete(id);
      }
    }
    
    // Clean threat history
    this.threatHistory = this.threatHistory.filter(entry => entry.timestamp >= cutoff);
  }

  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      submissions: Array.from(this.submissions.values()),
      results: Array.from(this.validationResults.values()),
      processingTimes: this.processingTimes,
      threatHistory: this.threatHistory
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    // CSV format - simplified
    const rows = [];
    rows.push(['Timestamp', 'IP', 'Action', 'Threats', 'Confidence']);
    
    for (const [id, submission] of this.submissions) {
      const result = this.validationResults.get(id);
      if (result) {
        rows.push([
          submission.timestamp.toISOString(),
          submission.ip,
          result.action,
          result.threats.length.toString(),
          result.confidence.toFixed(2)
        ]);
      }
    }
    
    return rows.map(row => row.join(',')).join('\n');
  }
}