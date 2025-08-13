#!/usr/bin/env node

/**
 * FAQ Schema Deployment - Health Checks
 * Comprehensive health checks for deployed FAQ schema pages
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

class HealthChecker {
  constructor(options = {}) {
    this.baseUrl = options.url || 'https://gadgetfixllc.com';
    this.phase = options.phase || 'phase1';
    this.retries = parseInt(options.retries) || 3;
    this.delay = parseInt(options.delay) || 5;
    this.timeout = 30000; // 30 seconds
    
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      checks: []
    };
  }

  async runHealthChecks() {
    console.log(`🏥 Running health checks for ${this.phase} deployment...`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    console.log(`🔄 Retries: ${this.retries}, Delay: ${this.delay}s`);

    try {
      // 1. Basic connectivity check
      await this.checkConnectivity();
      
      // 2. Get target pages for this phase
      const targetPages = await this.getTargetPages();
      
      // 3. Check each target page
      for (const page of targetPages) {
        await this.checkPage(page);
      }
      
      // 4. Run aggregate checks
      await this.runAggregateChecks();
      
      this.printResults();
      
      if (this.results.failed > 0) {
        throw new Error(`Health checks failed for ${this.results.failed} pages`);
      }
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Health check execution failed:', error.message);
      throw error;
    }
  }

  async checkConnectivity() {
    console.log('🔌 Checking basic connectivity...');
    
    try {
      const response = await this.makeRequest('/');
      
      if (response.statusCode === 200) {
        console.log('✅ Basic connectivity check passed');
        this.addResult('connectivity', true, 'Site is accessible');
      } else {
        throw new Error(`HTTP ${response.statusCode}`);
      }
    } catch (error) {
      console.log('❌ Basic connectivity check failed');
      this.addResult('connectivity', false, `Connectivity failed: ${error.message}`);
      throw error;
    }
  }

  async getTargetPages() {
    // For health checks, we'll test a sample of location pages
    // This could be enhanced to read from the actual deployment target list
    const samplePages = [
      '/locations/dallas-county/dallas',
      '/locations/collin-county/plano',
      '/locations/collin-county/frisco',
      '/locations/tarrant-county/fort-worth',
      '/locations/denton-county/denton'
    ];
    
    console.log(`📄 Testing ${samplePages.length} sample pages`);
    return samplePages;
  }

  async checkPage(pagePath) {
    const url = `${this.baseUrl}${pagePath}`;
    const pageName = pagePath.split('/').pop();
    
    console.log(`🔍 Checking page: ${pageName}`);
    
    try {
      // 1. Basic HTTP check
      const response = await this.makeRequest(pagePath);
      
      if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}`);
      }
      
      // 2. Content validation
      const content = response.body;
      await this.validatePageContent(pageName, content, pagePath);
      
      this.addResult(`page-${pageName}`, true, 'Page accessible and valid');
      
    } catch (error) {
      console.log(`❌ Page check failed for ${pageName}: ${error.message}`);
      this.addResult(`page-${pageName}`, false, `Page check failed: ${error.message}`);
    }
  }

  async validatePageContent(pageName, content, pagePath) {
    const checks = [];
    
    // 1. Check for FAQ schema presence
    if (content.includes('"@type": "FAQPage"')) {
      checks.push({ name: 'FAQ Schema', passed: true });
    } else {
      checks.push({ name: 'FAQ Schema', passed: false, error: 'FAQ schema not found' });
    }
    
    // 2. Check for proper FAQ structure
    const faqMatch = content.match(/"mainEntity":\s*\[[\s\S]*?\]/);
    if (faqMatch) {
      try {
        const faqSection = faqMatch[0];
        const questionCount = (faqSection.match(/"@type":\s*"Question"/g) || []).length;
        
        if (questionCount >= 6) {
          checks.push({ name: 'FAQ Count', passed: true, detail: `${questionCount} questions` });
        } else {
          checks.push({ name: 'FAQ Count', passed: false, error: `Only ${questionCount} questions (minimum 6)` });
        }
      } catch (error) {
        checks.push({ name: 'FAQ Structure', passed: false, error: 'Invalid FAQ JSON structure' });
      }
    } else {
      checks.push({ name: 'FAQ Structure', passed: false, error: 'FAQ mainEntity not found' });
    }
    
    // 3. Check for local business schema (should coexist)
    if (content.includes('"@type": "LocalBusiness"')) {
      checks.push({ name: 'LocalBusiness Schema', passed: true });
    } else {
      checks.push({ name: 'LocalBusiness Schema', passed: false, error: 'LocalBusiness schema missing' });
    }
    
    // 4. Check for location-specific content
    const cityName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    const hasLocationContent = content.includes(cityName) || content.includes(cityName.toLowerCase());
    
    if (hasLocationContent) {
      checks.push({ name: 'Location Content', passed: true });
    } else {
      checks.push({ name: 'Location Content', passed: false, error: 'Location-specific content missing' });
    }
    
    // 5. Check for performance-critical elements
    const performanceChecks = [
      { name: 'Title Tag', check: /<title[^>]*>.*?<\/title>/i },
      { name: 'Meta Description', check: /<meta[^>]*name="description"[^>]*>/i },
      { name: 'Canonical URL', check: /<link[^>]*rel="canonical"[^>]*>/i }
    ];
    
    performanceChecks.forEach(({ name, check }) => {
      if (check.test(content)) {
        checks.push({ name, passed: true });
      } else {
        checks.push({ name, passed: false, error: `${name} missing or invalid` });
      }
    });
    
    // 6. Check for accessibility elements
    const accessibilityChecks = [
      { name: 'FAQ Headings', check: /<h[123][^>]*>.*?(question|faq)/i },
      { name: 'Semantic Structure', check: /<(section|article|main)[^>]*>/i }
    ];
    
    accessibilityChecks.forEach(({ name, check }) => {
      if (check.test(content)) {
        checks.push({ name, passed: true });
      } else {
        checks.push({ name, passed: false, error: `${name} missing` });
      }
    });
    
    // Log detailed results
    const failedChecks = checks.filter(c => !c.passed);
    const passedChecks = checks.filter(c => c.passed);
    
    console.log(`   📊 ${pageName}: ${passedChecks.length}/${checks.length} checks passed`);
    
    if (failedChecks.length > 0) {
      console.log(`   ⚠️  Failed checks:`);
      failedChecks.forEach(check => {
        console.log(`      • ${check.name}: ${check.error}`);
      });
    }
    
    // Add to overall results
    checks.forEach(check => {
      const checkName = `${pageName}-${check.name.replace(/\s+/g, '-').toLowerCase()}`;
      this.addResult(checkName, check.passed, check.error || check.detail || '');
    });
  }

  async runAggregateChecks() {
    console.log('📊 Running aggregate health checks...');
    
    try {
      // 1. Check sitemap for new FAQ pages
      await this.checkSitemap();
      
      // 2. Check robots.txt accessibility
      await this.checkRobots();
      
      // 3. Basic performance check
      await this.checkPerformance();
      
    } catch (error) {
      console.log(`⚠️  Aggregate checks warning: ${error.message}`);
    }
  }

  async checkSitemap() {
    try {
      const response = await this.makeRequest('/sitemap.xml');
      
      if (response.statusCode === 200) {
        const sitemapContent = response.body;
        
        // Check if sitemap is valid XML
        if (sitemapContent.includes('<urlset') || sitemapContent.includes('<sitemapindex')) {
          this.addResult('sitemap', true, 'Sitemap accessible and valid');
        } else {
          this.addResult('sitemap', false, 'Sitemap content invalid');
        }
      } else {
        this.addResult('sitemap', false, `Sitemap HTTP ${response.statusCode}`);
      }
    } catch (error) {
      this.addResult('sitemap', false, `Sitemap check failed: ${error.message}`);
    }
  }

  async checkRobots() {
    try {
      const response = await this.makeRequest('/robots.txt');
      
      if (response.statusCode === 200) {
        this.addResult('robots', true, 'Robots.txt accessible');
      } else {
        this.addResult('robots', false, `Robots.txt HTTP ${response.statusCode}`);
      }
    } catch (error) {
      this.addResult('robots', false, `Robots.txt check failed: ${error.message}`);
    }
  }

  async checkPerformance() {
    try {
      const startTime = Date.now();
      const response = await this.makeRequest('/');
      const responseTime = Date.now() - startTime;
      
      if (responseTime < 3000) { // 3 seconds
        this.addResult('performance', true, `Response time: ${responseTime}ms`);
      } else {
        this.addResult('performance', false, `Slow response time: ${responseTime}ms`);
      }
    } catch (error) {
      this.addResult('performance', false, `Performance check failed: ${error.message}`);
    }
  }

  async makeRequest(path, attempt = 1) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: this.timeout,
        headers: {
          'User-Agent': 'GadgetFix-HealthCheck/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      };
      
      const req = client.request(options, (res) => {
        let body = '';
        res.setEncoding('utf8');
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        if (attempt < this.retries) {
          console.log(`⏱️  Request timeout, retrying (${attempt}/${this.retries})...`);
          setTimeout(() => {
            this.makeRequest(path, attempt + 1).then(resolve).catch(reject);
          }, this.delay * 1000);
        } else {
          reject(new Error('Request timeout after retries'));
        }
      });
      
      req.on('error', (error) => {
        if (attempt < this.retries) {
          console.log(`🔄 Request error, retrying (${attempt}/${this.retries}): ${error.message}`);
          setTimeout(() => {
            this.makeRequest(path, attempt + 1).then(resolve).catch(reject);
          }, this.delay * 1000);
        } else {
          reject(error);
        }
      });
      
      req.end();
    });
  }

  addResult(checkName, passed, message = '') {
    this.results.total++;
    
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    
    this.results.checks.push({
      name: checkName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
  }

  printResults() {
    console.log('\n📊 Health Check Results:');
    console.log(`   Total Checks: ${this.results.total}`);
    console.log(`   Passed:       ${this.results.passed}`);
    console.log(`   Failed:       ${this.results.failed}`);
    
    const successRate = (this.results.passed / this.results.total * 100).toFixed(1);
    console.log(`   Success Rate: ${successRate}%`);
    
    // Group results by type
    const failedChecks = this.results.checks.filter(c => !c.passed);
    
    if (failedChecks.length > 0) {
      console.log('\n❌ Failed Checks:');
      failedChecks.forEach(check => {
        console.log(`   • ${check.name}: ${check.message}`);
      });
    }
    
    if (this.results.failed === 0) {
      console.log('\n✅ All health checks passed!');
    } else {
      console.log(`\n❌ ${this.results.failed} health checks failed`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--url=')) {
      options.url = arg.split('=')[1];
    } else if (arg.startsWith('--phase=')) {
      options.phase = arg.split('=')[1];
    } else if (arg.startsWith('--retries=')) {
      options.retries = arg.split('=')[1];
    } else if (arg.startsWith('--delay=')) {
      options.delay = arg.split('=')[1];
    }
  });

  try {
    const healthChecker = new HealthChecker(options);
    const results = await healthChecker.runHealthChecks();
    
    console.log(`🎉 Health checks for ${options.phase || 'deployment'} completed!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Health checks failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}