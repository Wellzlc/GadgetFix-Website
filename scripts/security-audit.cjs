#!/usr/bin/env node

/**
 * Security Audit Script
 * Performs comprehensive security checks on the codebase
 * Run: node scripts/security-audit.js
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Security patterns to check
const SECURITY_PATTERNS = {
  hardcodedPasswords: [
    /password\s*[=:]\s*["'][^"']{4,}/gi,
    /pwd\s*[=:]\s*["'][^"']{4,}/gi,
    /pass\s*[=:]\s*["'][^"']{4,}/gi,
    /secret\s*[=:]\s*["'][^"']{4,}/gi,
    /api[_-]?key\s*[=:]\s*["'][^"']{10,}/gi,
    /token\s*[=:]\s*["'][^"']{10,}/gi
  ],
  exposedEmails: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  ],
  dangerousEval: [
    /eval\s*\(/g,
    /new\s+Function\s*\(/g,
    /setTimeout\s*\([^,)]*[`'"]/g,
    /setInterval\s*\([^,)]*[`'"]/g
  ],
  sqlInjection: [
    /query\s*\([`'"].*\$\{/g,
    /execute\s*\([`'"].*\$\{/g,
    /raw\s*\([`'"].*\$\{/g
  ],
  unsafeHtml: [
    /innerHTML\s*=/g,
    /dangerouslySetInnerHTML/g,
    /v-html/g,
    /\{\{\{.*\}\}\}/g
  ],
  localStorage: [
    /localStorage\.(setItem|getItem)\s*\(['"](password|token|secret|key|auth)/gi
  ],
  debugCode: [
    /console\.(log|debug|info|warn|error)\s*\(/g,
    /debugger/g,
    /alert\s*\(/g
  ],
  insecureProtocol: [
    /http:\/\/(?!localhost|127\.0\.0\.1)/g
  ]
};

const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  '.vercel',
  '.netlify',
  'coverage',
  '.cache'
];

const EXCLUDE_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.filesScanned = 0;
    this.startTime = Date.now();
  }
  
  async scanFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      for (const [category, patterns] of Object.entries(SECURITY_PATTERNS)) {
        for (const pattern of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            for (const match of matches) {
              // Get line number
              const lines = content.substring(0, content.indexOf(match)).split('\n');
              const lineNumber = lines.length;
              
              this.issues.push({
                severity: this.getSeverity(category),
                category,
                file: relativePath,
                line: lineNumber,
                match: match.substring(0, 100),
                pattern: pattern.toString()
              });
            }
          }
        }
      }
      
      this.filesScanned++;
    } catch (error) {
      console.error(`Error scanning ${filePath}:`, error.message);
    }
  }
  
  getSeverity(category) {
    const severityMap = {
      hardcodedPasswords: 'CRITICAL',
      exposedEmails: 'HIGH',
      dangerousEval: 'CRITICAL',
      sqlInjection: 'CRITICAL',
      unsafeHtml: 'HIGH',
      localStorage: 'MEDIUM',
      debugCode: 'LOW',
      insecureProtocol: 'MEDIUM'
    };
    return severityMap[category] || 'UNKNOWN';
  }
  
  async scanDirectory(dir) {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(item.name) && !item.name.startsWith('.')) {
          await this.scanDirectory(fullPath);
        }
      } else if (item.isFile()) {
        if (!EXCLUDE_FILES.includes(item.name) && 
            (item.name.endsWith('.js') || 
             item.name.endsWith('.ts') || 
             item.name.endsWith('.jsx') || 
             item.name.endsWith('.tsx') || 
             item.name.endsWith('.astro') || 
             item.name.endsWith('.vue') || 
             item.name.endsWith('.html'))) {
          await this.scanFile(fullPath);
        }
      }
    }
  }
  
  generateReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    // Group issues by severity
    const critical = this.issues.filter(i => i.severity === 'CRITICAL');
    const high = this.issues.filter(i => i.severity === 'HIGH');
    const medium = this.issues.filter(i => i.severity === 'MEDIUM');
    const low = this.issues.filter(i => i.severity === 'LOW');
    
    console.log('\n=================================');
    console.log('  SECURITY AUDIT REPORT');
    console.log('=================================\n');
    
    console.log(`Scan completed in ${duration} seconds`);
    console.log(`Files scanned: ${this.filesScanned}`);
    console.log(`Total issues found: ${this.issues.length}\n`);
    
    console.log('Issue Summary:');
    console.log(`  🔴 CRITICAL: ${critical.length}`);
    console.log(`  🟠 HIGH: ${high.length}`);
    console.log(`  🟡 MEDIUM: ${medium.length}`);
    console.log(`  🟢 LOW: ${low.length}\n`);
    
    // Print critical issues
    if (critical.length > 0) {
      console.log('=================================');
      console.log('  🔴 CRITICAL ISSUES');
      console.log('=================================\n');
      
      for (const issue of critical) {
        console.log(`[${issue.category}]`);
        console.log(`  File: ${issue.file}:${issue.line}`);
        console.log(`  Match: ${issue.match}`);
        console.log('');
      }
    }
    
    // Print high issues
    if (high.length > 0) {
      console.log('=================================');
      console.log('  🟠 HIGH ISSUES');
      console.log('=================================\n');
      
      for (const issue of high.slice(0, 10)) {
        console.log(`[${issue.category}]`);
        console.log(`  File: ${issue.file}:${issue.line}`);
        console.log(`  Match: ${issue.match}`);
        console.log('');
      }
      
      if (high.length > 10) {
        console.log(`  ... and ${high.length - 10} more high severity issues\n`);
      }
    }
    
    // Print medium issues summary
    if (medium.length > 0) {
      console.log('=================================');
      console.log('  🟡 MEDIUM ISSUES');
      console.log('=================================\n');
      console.log(`  Found ${medium.length} medium severity issues\n`);
    }
    
    // Print low issues summary
    if (low.length > 0) {
      console.log('=================================');
      console.log('  🟢 LOW ISSUES');
      console.log('=================================\n');
      console.log(`  Found ${low.length} low severity issues (debug code, etc.)\n`);
    }
    
    // Security score
    const score = this.calculateSecurityScore();
    
    console.log('=================================');
    console.log('  SECURITY SCORE');
    console.log('=================================\n');
    console.log(`  Score: ${score}/100`);
    
    if (score < 30) {
      console.log('  Grade: F - CRITICAL RISK');
    } else if (score < 50) {
      console.log('  Grade: D - HIGH RISK');
    } else if (score < 70) {
      console.log('  Grade: C - MEDIUM RISK');
    } else if (score < 85) {
      console.log('  Grade: B - LOW RISK');
    } else {
      console.log('  Grade: A - SECURE');
    }
    
    console.log('\n=================================');
    console.log('  RECOMMENDATIONS');
    console.log('=================================\n');
    
    if (critical.length > 0) {
      console.log('🔴 IMMEDIATE ACTIONS REQUIRED:');
      console.log('  1. Remove all hardcoded passwords and secrets');
      console.log('  2. Use environment variables for sensitive data');
      console.log('  3. Implement proper authentication');
      console.log('  4. Fix SQL injection vulnerabilities\n');
    }
    
    if (high.length > 0) {
      console.log('🟠 HIGH PRIORITY:');
      console.log('  1. Obfuscate or remove exposed email addresses');
      console.log('  2. Sanitize HTML to prevent XSS attacks');
      console.log('  3. Use secure storage for sensitive data\n');
    }
    
    console.log('📚 BEST PRACTICES:');
    console.log('  1. Run this audit before every deployment');
    console.log('  2. Use automated security testing in CI/CD');
    console.log('  3. Keep dependencies updated');
    console.log('  4. Implement Content Security Policy');
    console.log('  5. Use HTTPS everywhere');
    console.log('  6. Enable security headers\n');
    
    // Save report to file
    this.saveReport();
  }
  
  calculateSecurityScore() {
    let score = 100;
    
    // Deduct points based on issues
    score -= this.issues.filter(i => i.severity === 'CRITICAL').length * 20;
    score -= this.issues.filter(i => i.severity === 'HIGH').length * 10;
    score -= this.issues.filter(i => i.severity === 'MEDIUM').length * 5;
    score -= this.issues.filter(i => i.severity === 'LOW').length * 1;
    
    return Math.max(0, Math.min(100, score));
  }
  
  async saveReport() {
    const reportPath = path.join(process.cwd(), 'security-audit-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      filesScanned: this.filesScanned,
      score: this.calculateSecurityScore(),
      summary: {
        critical: this.issues.filter(i => i.severity === 'CRITICAL').length,
        high: this.issues.filter(i => i.severity === 'HIGH').length,
        medium: this.issues.filter(i => i.severity === 'MEDIUM').length,
        low: this.issues.filter(i => i.severity === 'LOW').length
      },
      issues: this.issues
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: ${reportPath}\n`);
  }
}

async function main() {
  const auditor = new SecurityAuditor();
  const srcPath = path.join(process.cwd(), 'src');
  
  console.log('\n🔍 Starting security audit...\n');
  
  await auditor.scanDirectory(srcPath);
  auditor.generateReport();
}

main().catch(console.error);