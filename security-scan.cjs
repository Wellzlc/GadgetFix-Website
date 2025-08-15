#!/usr/bin/env node

/**
 * Security Scanner for GadgetFix Website
 * Scans for exposed secrets, credentials, and sensitive information
 */

const fs = require('fs');
const path = require('path');

// Patterns to search for potential security issues
const SECURITY_PATTERNS = [
  // Private keys
  { pattern: /-----BEGIN (RSA |OPENSSH |EC |DSA |PRIVATE |).*KEY-----/gi, name: 'Private Key' },
  
  // API keys and tokens
  { pattern: /api[_-]?key[_-]?[=:]\s*['"][a-zA-Z0-9_\-]{20,}/gi, name: 'API Key' },
  { pattern: /secret[_-]?key[_-]?[=:]\s*['"][a-zA-Z0-9_\-]{20,}/gi, name: 'Secret Key' },
  { pattern: /access[_-]?token[_-]?[=:]\s*['"][a-zA-Z0-9_\-]{20,}/gi, name: 'Access Token' },
  { pattern: /bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi, name: 'Bearer Token' },
  
  // AWS
  { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key' },
  { pattern: /aws[_-]?secret[_-]?access[_-]?key[_-]?[=:]\s*['"][a-zA-Z0-9/+=]{40}/gi, name: 'AWS Secret' },
  
  // Google
  { pattern: /AIza[0-9A-Za-z_-]{35}/g, name: 'Google API Key' },
  { pattern: /[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/g, name: 'Google OAuth' },
  
  // GitHub
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Personal Token' },
  { pattern: /gho_[a-zA-Z0-9]{36}/g, name: 'GitHub OAuth Token' },
  
  // Passwords
  { pattern: /password[_-]?[=:]\s*['"][^'"]{8,}/gi, name: 'Hardcoded Password' },
  { pattern: /pwd[_-]?[=:]\s*['"][^'"]{8,}/gi, name: 'Hardcoded Password' },
  
  // Database URLs
  { pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@[^/]+/gi, name: 'MongoDB Connection' },
  { pattern: /postgres:\/\/[^:]+:[^@]+@[^/]+/gi, name: 'PostgreSQL Connection' },
  { pattern: /mysql:\/\/[^:]+:[^@]+@[^/]+/gi, name: 'MySQL Connection' },
  
  // Stripe
  { pattern: /sk_live_[a-zA-Z0-9]{24,}/g, name: 'Stripe Live Key' },
  { pattern: /sk_test_[a-zA-Z0-9]{24,}/g, name: 'Stripe Test Key' },
  
  // Specific project patterns
  { pattern: /Lc9401765@#\$/g, name: 'Old Admin Password' },
  { pattern: /wellz\.levi@gmail\.com/g, name: 'Email Address (consider using env var)' },
];

// Directories and files to skip
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.astro',
  '.vercel',
  '.netlify',
  'package-lock.json',
  '*.min.js',
  '*.map',
  'security-scan.js', // Don't scan this file
  '.env.example', // Example files are ok
];

// File extensions to scan
const SCAN_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx',
  '.astro', '.vue', '.svelte',
  '.json', '.yaml', '.yml',
  '.env', '.config',
  '.md', '.txt',
  '.html', '.css',
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function shouldScan(filePath) {
  return SCAN_EXTENSIONS.some(ext => filePath.endsWith(ext));
}

function scanFile(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  SECURITY_PATTERNS.forEach(({ pattern, name }) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Find line number
        const lines = content.substring(0, content.indexOf(match)).split('\n');
        const lineNumber = lines.length;
        
        // Truncate long matches for display
        const displayMatch = match.length > 100 ? match.substring(0, 100) + '...' : match;
        
        issues.push({
          file: filePath,
          line: lineNumber,
          type: name,
          match: displayMatch,
        });
      });
    }
  });

  return issues;
}

function scanDirectory(dir) {
  const issues = [];
  
  function walk(currentPath) {
    if (shouldIgnore(currentPath)) {
      return;
    }

    const stats = fs.statSync(currentPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        walk(path.join(currentPath, file));
      });
    } else if (stats.isFile() && shouldScan(currentPath)) {
      const fileIssues = scanFile(currentPath);
      issues.push(...fileIssues);
    }
  }

  walk(dir);
  return issues;
}

// Main execution
console.log('🔍 Starting Security Scan...\n');

const rootDir = process.cwd();
const issues = scanDirectory(rootDir);

if (issues.length === 0) {
  console.log('✅ No security issues found!\n');
} else {
  console.log(`⚠️  Found ${issues.length} potential security issues:\n`);
  
  // Group by type
  const groupedIssues = {};
  issues.forEach(issue => {
    if (!groupedIssues[issue.type]) {
      groupedIssues[issue.type] = [];
    }
    groupedIssues[issue.type].push(issue);
  });

  // Display grouped issues
  Object.entries(groupedIssues).forEach(([type, typeIssues]) => {
    console.log(`\n🔴 ${type} (${typeIssues.length} occurrences):`);
    typeIssues.forEach(issue => {
      const relativePath = path.relative(rootDir, issue.file);
      console.log(`   ${relativePath}:${issue.line}`);
      console.log(`   Match: ${issue.match}`);
    });
  });

  console.log('\n📋 Summary:');
  Object.entries(groupedIssues).forEach(([type, typeIssues]) => {
    console.log(`   - ${type}: ${typeIssues.length} occurrences`);
  });
}

console.log('\n💡 Recommendations:');
console.log('   1. Move all secrets to environment variables');
console.log('   2. Never commit .env files to version control');
console.log('   3. Use secret management services in production');
console.log('   4. Rotate any exposed keys immediately');
console.log('   5. Enable audit logging for secret access\n');