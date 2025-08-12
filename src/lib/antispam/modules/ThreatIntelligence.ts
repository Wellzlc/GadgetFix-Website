/**
 * ThreatIntelligence - External threat intelligence integration
 * Manages reputation databases and threat feeds
 */

import { FormSubmission, Threat, ThreatType, ThreatIntelFeed } from '../types';

interface ReputationData {
  ip?: {
    reputation: number;
    isVPN: boolean;
    isTor: boolean;
    isProxy: boolean;
    isHosting: boolean;
    country: string;
    asn: string;
    lastSeen: Date;
  };
  email?: {
    reputation: number;
    isDisposable: boolean;
    isFreemail: boolean;
    domain: string;
    lastSeen: Date;
  };
  domain?: {
    reputation: number;
    age: number;
    category: string;
    isSuspicious: boolean;
    lastSeen: Date;
  };
}

export class ThreatIntelligence {
  private threatFeeds: Map<string, ThreatIntelFeed> = new Map();
  private ipBlacklist: Set<string> = new Set();
  private emailBlacklist: Set<string> = new Set();
  private domainBlacklist: Set<string> = new Set();
  private hashBlacklist: Set<string> = new Set();
  private reputationCache: Map<string, ReputationData> = new Map();
  private readonly cacheExpiryMinutes = 60;

  constructor() {
    this.initializeDefaultFeeds();
    this.startFeedUpdates();
  }

  private initializeDefaultFeeds() {
    // Initialize with common threat intelligence feeds
    this.addFeed({
      url: 'https://raw.githubusercontent.com/stamparm/ipsum/master/ipsum.txt',
      type: 'ip',
      updateFrequency: 1440, // Daily
      enabled: true,
      hitCount: 0
    });

    this.addFeed({
      url: 'https://raw.githubusercontent.com/martenson/disposable-email-domains/master/disposable_email_blocklist.conf',
      type: 'email',
      updateFrequency: 1440, // Daily
      enabled: true,
      hitCount: 0
    });

    // Tor exit nodes
    this.addFeed({
      url: 'https://check.torproject.org/torbulkexitlist',
      type: 'ip',
      updateFrequency: 360, // Every 6 hours
      enabled: true,
      hitCount: 0
    });
  }

  async checkReputation(submission: FormSubmission): Promise<{ threats: Threat[]; confidence: number }> {
    const threats: Threat[] = [];
    let maxConfidence = 0;

    // Check IP reputation
    const ipThreats = await this.checkIPReputation(submission.ip);
    threats.push(...ipThreats);

    // Check email reputation
    if (submission.fields.email) {
      const emailThreats = await this.checkEmailReputation(String(submission.fields.email));
      threats.push(...emailThreats);
    }

    // Check domains in submission
    const domainThreats = await this.checkDomainReputation(submission);
    threats.push(...domainThreats);

    // Check content hashes
    const hashThreats = await this.checkContentHashes(submission);
    threats.push(...hashThreats);

    // Calculate maximum confidence
    if (threats.length > 0) {
      maxConfidence = Math.max(...threats.map(t => t.confidence));
    }

    return { threats, confidence: maxConfidence };
  }

  private async checkIPReputation(ip: string): Promise<Threat[]> {
    const threats: Threat[] = [];

    // Check blacklist
    if (this.ipBlacklist.has(ip)) {
      threats.push({
        type: ThreatType.BLACKLISTED_IP,
        pattern: 'Blacklisted IP',
        confidence: 0.95,
        description: 'IP address found in threat intelligence feeds',
        evidence: [`IP: ${ip}`],
        severity: 'critical'
      });
    }

    // Check cached reputation
    const cacheKey = `ip:${ip}`;
    let reputation = this.reputationCache.get(cacheKey);

    if (!reputation || this.isCacheExpired(reputation.ip?.lastSeen)) {
      // Fetch fresh reputation data
      reputation = await this.fetchIPReputation(ip);
      this.reputationCache.set(cacheKey, reputation);
    }

    if (reputation?.ip) {
      // Check VPN/Proxy
      if (reputation.ip.isVPN || reputation.ip.isProxy) {
        threats.push({
          type: ThreatType.VPN_DETECTED,
          pattern: reputation.ip.isVPN ? 'VPN detected' : 'Proxy detected',
          confidence: 0.8,
          description: `Connection from ${reputation.ip.isVPN ? 'VPN' : 'proxy'} server`,
          evidence: [`IP: ${ip}`, `ASN: ${reputation.ip.asn}`],
          severity: 'medium'
        });
      }

      // Check Tor
      if (reputation.ip.isTor) {
        threats.push({
          type: ThreatType.TOR_DETECTED,
          pattern: 'Tor exit node',
          confidence: 0.95,
          description: 'Connection from Tor network',
          evidence: [`IP: ${ip}`],
          severity: 'high'
        });
      }

      // Check hosting provider
      if (reputation.ip.isHosting) {
        threats.push({
          type: ThreatType.BOT_BEHAVIOR,
          pattern: 'Hosting provider IP',
          confidence: 0.7,
          description: 'Connection from hosting provider - possible bot',
          evidence: [`IP: ${ip}`, `ASN: ${reputation.ip.asn}`],
          severity: 'medium'
        });
      }

      // Check reputation score
      if (reputation.ip.reputation < 30) {
        threats.push({
          type: ThreatType.BAD_REPUTATION,
          pattern: 'Low IP reputation',
          confidence: Math.max(0.9 - (reputation.ip.reputation / 100), 0.5),
          description: `IP has poor reputation score: ${reputation.ip.reputation}/100`,
          evidence: [`IP: ${ip}`, `Score: ${reputation.ip.reputation}`],
          severity: reputation.ip.reputation < 10 ? 'high' : 'medium'
        });
      }
    }

    return threats;
  }

  private async checkEmailReputation(email: string): Promise<Threat[]> {
    const threats: Threat[] = [];
    const domain = email.split('@')[1];

    if (!domain) return threats;

    // Check blacklist
    if (this.emailBlacklist.has(domain)) {
      threats.push({
        type: ThreatType.DISPOSABLE_EMAIL,
        pattern: 'Disposable email domain',
        confidence: 0.95,
        description: 'Email from disposable email service',
        evidence: [`Domain: ${domain}`],
        severity: 'high'
      });
    }

    // Check cached reputation
    const cacheKey = `email:${domain}`;
    let reputation = this.reputationCache.get(cacheKey);

    if (!reputation || this.isCacheExpired(reputation.email?.lastSeen)) {
      reputation = await this.fetchEmailReputation(domain);
      this.reputationCache.set(cacheKey, reputation);
    }

    if (reputation?.email) {
      // Check if disposable
      if (reputation.email.isDisposable) {
        threats.push({
          type: ThreatType.DISPOSABLE_EMAIL,
          pattern: 'Disposable email',
          confidence: 0.9,
          description: 'Temporary/disposable email address',
          evidence: [`Email: ${email}`],
          severity: 'high'
        });
      }

      // Check reputation score
      if (reputation.email.reputation < 40) {
        threats.push({
          type: ThreatType.SUSPICIOUS_EMAIL,
          pattern: 'Low email reputation',
          confidence: Math.max(0.8 - (reputation.email.reputation / 100), 0.4),
          description: `Email domain has poor reputation: ${reputation.email.reputation}/100`,
          evidence: [`Domain: ${domain}`, `Score: ${reputation.email.reputation}`],
          severity: 'medium'
        });
      }
    }

    return threats;
  }

  private async checkDomainReputation(submission: FormSubmission): Promise<Threat[]> {
    const threats: Threat[] = [];
    const allText = Object.values(submission.fields).join(' ');
    const urlMatches = allText.match(/https?:\/\/([^\/\s]+)/gi) || [];
    
    const domains = new Set<string>();
    for (const url of urlMatches) {
      try {
        const domain = new URL(url).hostname;
        domains.add(domain);
      } catch {
        // Invalid URL
      }
    }

    for (const domain of domains) {
      // Check blacklist
      if (this.domainBlacklist.has(domain)) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          pattern: 'Blacklisted domain',
          confidence: 0.95,
          description: 'URL contains blacklisted domain',
          evidence: [`Domain: ${domain}`],
          severity: 'critical'
        });
        continue;
      }

      // Check cached reputation
      const cacheKey = `domain:${domain}`;
      let reputation = this.reputationCache.get(cacheKey);

      if (!reputation || this.isCacheExpired(reputation.domain?.lastSeen)) {
        reputation = await this.fetchDomainReputation(domain);
        this.reputationCache.set(cacheKey, reputation);
      }

      if (reputation?.domain) {
        // Check if suspicious
        if (reputation.domain.isSuspicious) {
          threats.push({
            type: ThreatType.EXCESSIVE_URLS,
            pattern: 'Suspicious domain',
            confidence: 0.8,
            description: 'URL contains suspicious domain',
            evidence: [`Domain: ${domain}`, `Category: ${reputation.domain.category}`],
            severity: 'high'
          });
        }

        // Check domain age (new domains are often suspicious)
        if (reputation.domain.age < 30) {
          threats.push({
            type: ThreatType.EXCESSIVE_URLS,
            pattern: 'New domain',
            confidence: 0.6,
            description: `Domain registered ${reputation.domain.age} days ago`,
            evidence: [`Domain: ${domain}`, `Age: ${reputation.domain.age} days`],
            severity: 'medium'
          });
        }

        // Check reputation score
        if (reputation.domain.reputation < 30) {
          threats.push({
            type: ThreatType.BAD_REPUTATION,
            pattern: 'Low domain reputation',
            confidence: Math.max(0.8 - (reputation.domain.reputation / 100), 0.5),
            description: `Domain has poor reputation: ${reputation.domain.reputation}/100`,
            evidence: [`Domain: ${domain}`, `Score: ${reputation.domain.reputation}`],
            severity: 'high'
          });
        }
      }
    }

    return threats;
  }

  private async checkContentHashes(submission: FormSubmission): Promise<Threat[]> {
    const threats: Threat[] = [];
    const contentHash = this.hashContent(JSON.stringify(submission.fields));

    if (this.hashBlacklist.has(contentHash)) {
      threats.push({
        type: ThreatType.KNOWN_SPAMMER,
        pattern: 'Known spam content',
        confidence: 1.0,
        description: 'Content matches known spam signature',
        evidence: [`Hash: ${contentHash.substring(0, 16)}...`],
        severity: 'critical'
      });
    }

    return threats;
  }

  private async fetchIPReputation(ip: string): Promise<ReputationData> {
    // In production, this would call external APIs like:
    // - IPQualityScore
    // - AbuseIPDB
    // - GreyNoise
    // - Shodan
    
    // Mock implementation
    return {
      ip: {
        reputation: 50,
        isVPN: false,
        isTor: this.ipBlacklist.has(ip),
        isProxy: false,
        isHosting: false,
        country: 'US',
        asn: 'AS15169',
        lastSeen: new Date()
      }
    };
  }

  private async fetchEmailReputation(domain: string): Promise<ReputationData> {
    // In production, this would call external APIs like:
    // - EmailRep.io
    // - Hunter.io
    // - Clearbit
    
    // Mock implementation
    const isDisposable = this.emailBlacklist.has(domain);
    const isFreemail = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain);
    
    return {
      email: {
        reputation: isDisposable ? 10 : (isFreemail ? 60 : 80),
        isDisposable,
        isFreemail,
        domain,
        lastSeen: new Date()
      }
    };
  }

  private async fetchDomainReputation(domain: string): Promise<ReputationData> {
    // In production, this would call external APIs like:
    // - VirusTotal
    // - URLVoid
    // - WebRisk API
    // - PhishTank
    
    // Mock implementation
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf'];
    const isSuspicious = suspiciousTLDs.some(tld => domain.endsWith(tld));
    
    return {
      domain: {
        reputation: isSuspicious ? 20 : 70,
        age: 365, // Days since registration
        category: 'unknown',
        isSuspicious,
        lastSeen: new Date()
      }
    };
  }

  private hashContent(content: string): string {
    // Simple hash function for demonstration
    // In production, use crypto.createHash('sha256')
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private isCacheExpired(lastSeen?: Date): boolean {
    if (!lastSeen) return true;
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    return diff > this.cacheExpiryMinutes * 60 * 1000;
  }

  private addFeed(feed: ThreatIntelFeed) {
    this.threatFeeds.set(feed.url, feed);
  }

  private async startFeedUpdates() {
    for (const [url, feed] of this.threatFeeds) {
      if (feed.enabled) {
        // Initial update
        await this.updateFeed(feed);
        
        // Schedule periodic updates
        setInterval(async () => {
          if (feed.enabled) {
            await this.updateFeed(feed);
          }
        }, feed.updateFrequency * 60 * 1000);
      }
    }
  }

  private async updateFeed(feed: ThreatIntelFeed) {
    try {
      // In production, fetch and parse the feed
      // const response = await fetch(feed.url);
      // const data = await response.text();
      // this.parseFeed(data, feed.type);
      
      feed.lastUpdate = new Date();
      console.log(`Updated threat feed: ${feed.url}`);
    } catch (error) {
      console.error(`Failed to update threat feed ${feed.url}:`, error);
    }
  }

  addToBlacklist(type: 'ip' | 'email' | 'domain', value: string) {
    switch (type) {
      case 'ip':
        this.ipBlacklist.add(value);
        break;
      case 'email':
        this.emailBlacklist.add(value);
        break;
      case 'domain':
        this.domainBlacklist.add(value);
        break;
    }
  }

  removeFromBlacklist(type: 'ip' | 'email' | 'domain', value: string) {
    switch (type) {
      case 'ip':
        this.ipBlacklist.delete(value);
        break;
      case 'email':
        this.emailBlacklist.delete(value);
        break;
      case 'domain':
        this.domainBlacklist.delete(value);
        break;
    }
  }

  getStatistics() {
    return {
      feeds: {
        total: this.threatFeeds.size,
        enabled: Array.from(this.threatFeeds.values()).filter(f => f.enabled).length
      },
      blacklists: {
        ips: this.ipBlacklist.size,
        emails: this.emailBlacklist.size,
        domains: this.domainBlacklist.size,
        hashes: this.hashBlacklist.size
      },
      cache: {
        entries: this.reputationCache.size
      },
      feedStats: Array.from(this.threatFeeds.values()).map(feed => ({
        url: feed.url,
        type: feed.type,
        enabled: feed.enabled,
        lastUpdate: feed.lastUpdate,
        hitCount: feed.hitCount
      }))
    };
  }

  clearCache() {
    this.reputationCache.clear();
  }

  exportBlacklists(): string {
    return JSON.stringify({
      ips: Array.from(this.ipBlacklist),
      emails: Array.from(this.emailBlacklist),
      domains: Array.from(this.domainBlacklist),
      hashes: Array.from(this.hashBlacklist)
    }, null, 2);
  }

  importBlacklists(data: string) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.ips) this.ipBlacklist = new Set(parsed.ips);
      if (parsed.emails) this.emailBlacklist = new Set(parsed.emails);
      if (parsed.domains) this.domainBlacklist = new Set(parsed.domains);
      if (parsed.hashes) this.hashBlacklist = new Set(parsed.hashes);
    } catch (error) {
      console.error('Failed to import blacklists:', error);
      throw error;
    }
  }
}