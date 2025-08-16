#!/usr/bin/env node

/**
 * Security Check Script
 * Run this script regularly to check for common security vulnerabilities
 * Usage: node scripts/security-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Running Security Check...\n');

let issuesFound = 0;

// Check 1: Look for .vercel directory in git
console.log('Checking for .vercel directory in Git...');
try {
  const vercelInGit = execSync('git ls-files | grep "^\\.vercel/"', { encoding: 'utf8' });
  if (vercelInGit) {
    console.error('❌ ERROR: .vercel directory found in Git!');
    console.error('   Run: git rm -r --cached .vercel/');
    issuesFound++;
  }
} catch (e) {
  console.log('✅ .vercel directory not in Git');
}

// Check 2: Look for .env files in git
console.log('\nChecking for .env files in Git...');
try {
  const envInGit = execSync('git ls-files | grep "^\\.env" | grep -v "\\.example"', { encoding: 'utf8' });
  if (envInGit) {
    console.error('❌ ERROR: .env files found in Git!');
    console.error('   Files:', envInGit);
    issuesFound++;
  }
} catch (e) {
  console.log('✅ No .env files in Git');
}

// Check 3: Check if .gitignore has critical entries
console.log('\nChecking .gitignore for critical entries...');
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  const requiredEntries = ['.env', '.vercel', 'node_modules', '*.key', '*.pem'];
  
  requiredEntries.forEach(entry => {
    if (!gitignore.includes(entry)) {
      console.error(`❌ WARNING: ${entry} not in .gitignore`);
      issuesFound++;
    } else {
      console.log(`✅ ${entry} is in .gitignore`);
    }
  });
} else {
  console.error('❌ ERROR: .gitignore file not found!');
  issuesFound++;
}

// Check 4: Look for hardcoded secrets in source files
console.log('\nScanning for potential hardcoded secrets...');
const sourceDir = path.join(__dirname, '..', 'src');
const suspiciousPatterns = [
  /password\s*[:=]\s*["'][^"']+["']/gi,
  /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
  /secret\s*[:=]\s*["'][^"']+["']/gi,
  /BEGIN\s+(PRIVATE|RSA\s+PRIVATE)\s+KEY/gi
];

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.astro'))) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      suspiciousPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          console.error(`❌ WARNING: Potential secret in ${filePath}`);
          console.error(`   Pattern: ${matches[0].substring(0, 50)}...`);
          issuesFound++;
        }
      });
    }
  });
}

try {
  scanDirectory(sourceDir);
  if (issuesFound === 0) {
    console.log('✅ No hardcoded secrets detected in source files');
  }
} catch (e) {
  console.error('Error scanning source files:', e.message);
}

// Check 5: Verify pre-commit hook exists
console.log('\nChecking for pre-commit hook...');
const preCommitPath = path.join(__dirname, '..', '.git', 'hooks', 'pre-commit');
if (fs.existsSync(preCommitPath)) {
  console.log('✅ Pre-commit hook exists');
} else {
  console.error('❌ WARNING: Pre-commit hook not found');
  console.error('   Security checks won\'t run automatically before commits');
  issuesFound++;
}

// Summary
console.log('\n' + '='.repeat(50));
if (issuesFound === 0) {
  console.log('✅ Security check passed! No issues found.');
  process.exit(0);
} else {
  console.error(`❌ Security check failed! ${issuesFound} issue(s) found.`);
  console.error('\nPlease fix the issues above before proceeding.');
  process.exit(1);
}