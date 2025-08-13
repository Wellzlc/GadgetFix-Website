#!/usr/bin/env node

/**
 * FAQ Schema Deployment - SEO Validation
 * Validates SEO impact and schema implementation for search engines
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

class SEOValidator {
  constructor(options = {}) {
    this.baseUrl = options.url || 'https://gadgetfixllc.com';
    this.phase = options.phase || 'phase1';
    this.isProduction = options.production === 'true';
    
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      seoScore: 0,
      checks: []
    };
    
    this.targetKeywords = [
      'computer service',
      'virus removal',
      'password reset',
      'computer optimization',
      'mobile repair'
    ];
  }

  async validateSEO() {
    console.log(`🔍 Running SEO validation for ${this.phase}...`);
    console.log(`🌐 Target URL: ${this.baseUrl}`);
    console.log(`🏭 Environment: ${this.isProduction ? 'Production' : 'Staging'}`);

    try {
      // 1. Get sample pages to validate
      const samplePages = await this.getSamplePages();
      
      // 2. Validate each page for SEO compliance
      for (const page of samplePages) {
        await this.validatePage(page);
      }
      
      // 3. Run site-wide SEO checks
      await this.validateSiteWide();
      
      // 4. Check schema markup validation
      await this.validateSchemaMarkup();
      
      // 5. Calculate overall SEO score
      this.calculateSEOScore();
      
      this.printResults();
      
      if (this.results.failed > 0 || this.results.seoScore < 80) {
        throw new Error(`SEO validation failed (Score: ${this.results.seoScore}/100)`);
      }
      
      return this.results;
      
    } catch (error) {
      console.error('❌ SEO validation failed:', error.message);
      throw error;
    }
  }

  async getSamplePages() {
    // Target high-priority location pages for SEO validation
    return [
      '/locations/dallas-county/dallas',
      '/locations/collin-county/plano',
      '/locations/collin-county/frisco',
      '/locations/tarrant-county/fort-worth',
      '/locations/denton-county/denton',
      '/locations/collin-county/allen',
      '/locations/dallas-county/irving'
    ];
  }

  async validatePage(pagePath) {
    const url = `${this.baseUrl}${pagePath}`;
    const pageName = pagePath.split('/').pop();
    
    console.log(`📄 SEO validating: ${pageName}`);
    
    try {
      const response = await this.makeRequest(pagePath);
      
      if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}`);
      }
      
      const content = response.body;
      await this.analyzePageSEO(pageName, content, pagePath);
      
    } catch (error) {
      console.log(`❌ SEO validation failed for ${pageName}: ${error.message}`);
      this.addResult(`seo-${pageName}`, false, `SEO validation failed: ${error.message}`);
    }
  }

  async analyzePageSEO(pageName, content, pagePath) {
    const checks = [];
    const cityName = this.formatCityName(pageName);
    
    console.log(`   🔍 Analyzing SEO for ${cityName}...`);
    
    // 1. Title Tag Analysis
    const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      
      if (title.length > 0 && title.length <= 60) {
        checks.push({ name: 'Title Length', passed: true, detail: `${title.length} chars` });
      } else {
        checks.push({ name: 'Title Length', passed: false, error: `${title.length} chars (30-60 recommended)` });
      }
      
      // Check for target keywords in title
      const hasTargetKeyword = this.targetKeywords.some(keyword => 
        title.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasTargetKeyword) {
        checks.push({ name: 'Title Keywords', passed: true });
      } else {
        checks.push({ name: 'Title Keywords', passed: false, error: 'Missing target keywords' });
      }
      
      // Check for location in title
      if (title.toLowerCase().includes(cityName.toLowerCase())) {
        checks.push({ name: 'Title Location', passed: true });
      } else {
        checks.push({ name: 'Title Location', passed: false, error: 'Missing city name' });
      }
    } else {
      checks.push({ name: 'Title Tag', passed: false, error: 'Title tag missing' });
    }
    
    // 2. Meta Description Analysis
    const descMatch = content.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    if (descMatch) {
      const description = descMatch[1].trim();
      
      if (description.length >= 120 && description.length <= 160) {
        checks.push({ name: 'Meta Description Length', passed: true, detail: `${description.length} chars` });
      } else {
        checks.push({ name: 'Meta Description Length', passed: false, error: `${description.length} chars (120-160 recommended)` });
      }
      
      // Check for keywords in description
      const hasKeywords = this.targetKeywords.some(keyword => 
        description.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasKeywords) {
        checks.push({ name: 'Description Keywords', passed: true });
      } else {
        checks.push({ name: 'Description Keywords', passed: false, error: 'Missing target keywords' });
      }
    } else {
      checks.push({ name: 'Meta Description', passed: false, error: 'Meta description missing' });
    }
    
    // 3. Heading Structure Analysis
    const h1Matches = content.match(/<h1[^>]*>([^<]*)<\/h1>/gi);
    if (h1Matches && h1Matches.length === 1) {
      const h1Text = h1Matches[0].replace(/<[^>]*>/g, '').trim();
      
      if (h1Text.toLowerCase().includes(cityName.toLowerCase())) {
        checks.push({ name: 'H1 Optimization', passed: true });
      } else {
        checks.push({ name: 'H1 Optimization', passed: false, error: 'H1 missing city name' });
      }
    } else {
      checks.push({ name: 'H1 Structure', passed: false, error: `${h1Matches?.length || 0} H1 tags (should be 1)` });
    }
    
    // Check for FAQ headings
    const faqHeadings = content.match(/<h[23][^>]*>.*?(frequently asked questions|faq).*?<\/h[23]>/gi);
    if (faqHeadings && faqHeadings.length > 0) {
      checks.push({ name: 'FAQ Headings', passed: true });
    } else {
      checks.push({ name: 'FAQ Headings', passed: false, error: 'FAQ section heading missing' });
    }
    
    // 4. FAQ Schema Validation
    const faqSchemaMatch = content.match(/"@type":\s*"FAQPage"/);
    if (faqSchemaMatch) {
      checks.push({ name: 'FAQ Schema Present', passed: true });
      
      // Validate FAQ schema structure
      const mainEntityMatch = content.match(/"mainEntity":\s*\[([\s\S]*?)\]/);
      if (mainEntityMatch) {
        try {
          const questionsCount = (mainEntityMatch[1].match(/"@type":\s*"Question"/g) || []).length;
          
          if (questionsCount >= 6) {
            checks.push({ name: 'FAQ Schema Count', passed: true, detail: `${questionsCount} questions` });
          } else {
            checks.push({ name: 'FAQ Schema Count', passed: false, error: `Only ${questionsCount} questions` });
          }
          
          // Check for location-specific questions
          const hasLocationQuestions = mainEntityMatch[1].toLowerCase().includes(cityName.toLowerCase());
          if (hasLocationQuestions) {
            checks.push({ name: 'FAQ Localization', passed: true });
          } else {
            checks.push({ name: 'FAQ Localization', passed: false, error: 'FAQs not localized' });
          }
          
        } catch (error) {
          checks.push({ name: 'FAQ Schema Structure', passed: false, error: 'Invalid schema structure' });
        }
      } else {
        checks.push({ name: 'FAQ Schema Structure', passed: false, error: 'mainEntity missing' });
      }
    } else {
      checks.push({ name: 'FAQ Schema Present', passed: false, error: 'FAQ schema missing' });
    }
    
    // 5. Local Business Schema Validation
    const localBusinessMatch = content.match(/"@type":\s*"LocalBusiness"/);
    if (localBusinessMatch) {
      checks.push({ name: 'LocalBusiness Schema', passed: true });
      
      // Check for required LocalBusiness properties
      const requiredProps = ['name', 'address', 'telephone', 'areaServed'];
      const missingProps = requiredProps.filter(prop => 
        !content.includes(`"${prop}":`)
      );
      
      if (missingProps.length === 0) {
        checks.push({ name: 'LocalBusiness Properties', passed: true });
      } else {
        checks.push({ name: 'LocalBusiness Properties', passed: false, error: `Missing: ${missingProps.join(', ')}` });
      }
    } else {
      checks.push({ name: 'LocalBusiness Schema', passed: false, error: 'LocalBusiness schema missing' });
    }
    
    // 6. Canonical URL Check
    const canonicalMatch = content.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"[^>]*>/i);
    if (canonicalMatch) {
      const canonicalUrl = canonicalMatch[1];
      const expectedUrl = `${this.baseUrl}${pagePath}`;
      
      if (canonicalUrl === expectedUrl || canonicalUrl === expectedUrl + '/') {
        checks.push({ name: 'Canonical URL', passed: true });
      } else {
        checks.push({ name: 'Canonical URL', passed: false, error: 'Incorrect canonical URL' });
      }
    } else {
      checks.push({ name: 'Canonical URL', passed: false, error: 'Canonical URL missing' });
    }
    
    // 7. Internal Linking Analysis
    const internalLinks = content.match(/href="\/[^"]*"/gi) || [];
    const relevantLinks = internalLinks.filter(link => 
      link.includes('computer') || link.includes('service') || link.includes('contact')
    );
    
    if (relevantLinks.length >= 3) {
      checks.push({ name: 'Internal Linking', passed: true, detail: `${relevantLinks.length} relevant links` });
    } else {
      checks.push({ name: 'Internal Linking', passed: false, error: `Only ${relevantLinks.length} relevant links` });
    }
    
    // 8. Content Quality Analysis
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(' ').length;
    
    if (wordCount >= 300) {
      checks.push({ name: 'Content Length', passed: true, detail: `${wordCount} words` });
    } else {
      checks.push({ name: 'Content Length', passed: false, error: `Only ${wordCount} words (300+ recommended)` });
    }
    
    // Check keyword density
    const keywordMentions = this.targetKeywords.reduce((count, keyword) => {
      const mentions = (textContent.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      return count + mentions;
    }, 0);
    
    const keywordDensity = (keywordMentions / wordCount) * 100;
    
    if (keywordDensity >= 1 && keywordDensity <= 3) {
      checks.push({ name: 'Keyword Density', passed: true, detail: `${keywordDensity.toFixed(1)}%` });
    } else {
      checks.push({ name: 'Keyword Density', passed: false, error: `${keywordDensity.toFixed(1)}% (1-3% recommended)` });
    }
    
    // Log results for this page
    const failedChecks = checks.filter(c => !c.passed);
    const passedChecks = checks.filter(c => c.passed);
    
    console.log(`   📊 ${cityName}: ${passedChecks.length}/${checks.length} SEO checks passed`);
    
    if (failedChecks.length > 0) {
      console.log(`   ⚠️  SEO issues:`);
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

  async validateSiteWide() {
    console.log('🌐 Running site-wide SEO validation...');
    
    try {
      // 1. Sitemap validation
      await this.validateSitemap();
      
      // 2. Robots.txt validation
      await this.validateRobots();
      
      // 3. Homepage SEO check
      await this.validateHomepage();
      
    } catch (error) {
      console.log(`⚠️  Site-wide validation warning: ${error.message}`);
    }
  }

  async validateSitemap() {
    try {
      const response = await this.makeRequest('/sitemap.xml');
      
      if (response.statusCode === 200) {
        const sitemap = response.body;
        
        // Check for location pages in sitemap
        const locationUrls = (sitemap.match(/\/locations\/[^<]*/g) || []).length;
        
        if (locationUrls >= 50) {
          this.addResult('sitemap-locations', true, `${locationUrls} location pages in sitemap`);
        } else {
          this.addResult('sitemap-locations', false, `Only ${locationUrls} location pages in sitemap`);
        }
        
        // Check for lastmod dates
        if (sitemap.includes('<lastmod>')) {
          this.addResult('sitemap-lastmod', true, 'Sitemap includes lastmod dates');
        } else {
          this.addResult('sitemap-lastmod', false, 'Sitemap missing lastmod dates');
        }
        
      } else {
        this.addResult('sitemap-access', false, `Sitemap HTTP ${response.statusCode}`);
      }
    } catch (error) {
      this.addResult('sitemap-access', false, `Sitemap error: ${error.message}`);
    }
  }

  async validateRobots() {
    try {
      const response = await this.makeRequest('/robots.txt');
      
      if (response.statusCode === 200) {
        const robots = response.body;
        
        // Check for sitemap reference
        if (robots.toLowerCase().includes('sitemap:')) {
          this.addResult('robots-sitemap', true, 'Robots.txt references sitemap');
        } else {
          this.addResult('robots-sitemap', false, 'Robots.txt missing sitemap reference');
        }
        
        // Check for proper crawl directives
        if (robots.includes('User-agent:')) {
          this.addResult('robots-structure', true, 'Robots.txt properly structured');
        } else {
          this.addResult('robots-structure', false, 'Robots.txt missing User-agent directives');
        }
        
      } else {
        this.addResult('robots-access', false, `Robots.txt HTTP ${response.statusCode}`);
      }
    } catch (error) {
      this.addResult('robots-access', false, `Robots.txt error: ${error.message}`);
    }
  }

  async validateHomepage() {
    try {
      const response = await this.makeRequest('/');
      
      if (response.statusCode === 200) {
        const content = response.body;
        
        // Check for proper homepage title
        const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1].includes('Computer Service')) {
          this.addResult('homepage-title', true, 'Homepage title optimized');
        } else {
          this.addResult('homepage-title', false, 'Homepage title needs optimization');
        }
        
        // Check for internal links to location pages
        const locationLinks = (content.match(/href="\/locations\/[^"]*"/g) || []).length;
        if (locationLinks >= 10) {
          this.addResult('homepage-location-links', true, `${locationLinks} location links`);
        } else {
          this.addResult('homepage-location-links', false, `Only ${locationLinks} location links`);
        }
        
      }
    } catch (error) {
      this.addResult('homepage-validation', false, `Homepage error: ${error.message}`);
    }
  }

  async validateSchemaMarkup() {
    console.log('🔍 Validating schema markup compliance...');
    
    // This could be enhanced to use Google's Structured Data Testing Tool API
    // For now, we'll do basic validation
    
    const samplePages = ['/locations/dallas-county/dallas', '/locations/collin-county/plano'];
    
    for (const page of samplePages) {
      try {
        const response = await this.makeRequest(page);
        const content = response.body;
        
        // Extract and validate JSON-LD schemas
        const jsonLdMatches = content.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
        
        if (jsonLdMatches) {
          let validSchemas = 0;
          let totalSchemas = jsonLdMatches.length;
          
          for (const match of jsonLdMatches) {
            try {
              const jsonContent = match.replace(/<[^>]*>/g, '');
              const schemaData = JSON.parse(jsonContent);
              
              if (schemaData['@type'] && schemaData['@context']) {
                validSchemas++;
              }
            } catch (parseError) {
              // Invalid JSON schema
            }
          }
          
          const pageName = page.split('/').pop();
          if (validSchemas === totalSchemas) {
            this.addResult(`schema-${pageName}`, true, `${validSchemas}/${totalSchemas} valid schemas`);
          } else {
            this.addResult(`schema-${pageName}`, false, `${validSchemas}/${totalSchemas} valid schemas`);
          }
        }
        
      } catch (error) {
        console.log(`⚠️  Schema validation error for ${page}: ${error.message}`);
      }
    }
  }

  calculateSEOScore() {
    const totalChecks = this.results.total;
    const passedChecks = this.results.passed;
    
    if (totalChecks === 0) {
      this.results.seoScore = 0;
      return;
    }
    
    // Base score from pass rate
    const baseScore = (passedChecks / totalChecks) * 100;
    
    // Apply bonuses and penalties
    let adjustedScore = baseScore;
    
    // Bonus for critical SEO elements
    const criticalChecks = this.results.checks.filter(check => 
      check.name.includes('schema') || 
      check.name.includes('title') || 
      check.name.includes('canonical')
    );
    
    const criticalPassRate = criticalChecks.filter(c => c.passed).length / criticalChecks.length;
    if (criticalPassRate > 0.9) {
      adjustedScore += 5; // Bonus for excellent critical elements
    }
    
    // Penalty for failed FAQ schema
    const faqSchemaFails = this.results.checks.filter(check => 
      check.name.includes('faq') && !check.passed
    ).length;
    
    if (faqSchemaFails > 0) {
      adjustedScore -= faqSchemaFails * 2; // Penalty for FAQ schema issues
    }
    
    this.results.seoScore = Math.min(100, Math.max(0, Math.round(adjustedScore)));
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: 30000,
        headers: {
          'User-Agent': 'GadgetFix-SEOValidator/1.0 (compatible; SEO validation bot)',
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
        reject(new Error('Request timeout'));
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.end();
    });
  }

  formatCityName(city) {
    return city.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
    console.log('\n📊 SEO Validation Results:');
    console.log(`   Total Checks:  ${this.results.total}`);
    console.log(`   Passed:        ${this.results.passed}`);
    console.log(`   Failed:        ${this.results.failed}`);
    console.log(`   SEO Score:     ${this.results.seoScore}/100`);
    
    // Group results by category
    const categories = {};
    this.results.checks.forEach(check => {
      const category = check.name.split('-')[1] || 'general';
      if (!categories[category]) categories[category] = { passed: 0, failed: 0 };
      categories[category][check.passed ? 'passed' : 'failed']++;
    });
    
    console.log('\n📋 Results by Category:');
    Object.entries(categories).forEach(([category, stats]) => {
      const total = stats.passed + stats.failed;
      const rate = ((stats.passed / total) * 100).toFixed(1);
      console.log(`   ${category}: ${stats.passed}/${total} (${rate}%)`);
    });
    
    // Show critical failures
    const criticalFailures = this.results.checks.filter(check => 
      !check.passed && (
        check.name.includes('schema') || 
        check.name.includes('title') || 
        check.name.includes('canonical')
      )
    );
    
    if (criticalFailures.length > 0) {
      console.log('\n🚨 Critical SEO Issues:');
      criticalFailures.forEach(check => {
        console.log(`   • ${check.name}: ${check.message}`);
      });
    }
    
    // SEO score interpretation
    if (this.results.seoScore >= 90) {
      console.log('\n🏆 Excellent SEO score!');
    } else if (this.results.seoScore >= 80) {
      console.log('\n✅ Good SEO score');
    } else if (this.results.seoScore >= 70) {
      console.log('\n⚠️  SEO score needs improvement');
    } else {
      console.log('\n❌ Poor SEO score - immediate attention required');
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
    } else if (arg.startsWith('--production=')) {
      options.production = arg.split('=')[1];
    }
  });

  try {
    const seoValidator = new SEOValidator(options);
    const results = await seoValidator.validateSEO();
    
    console.log(`🎉 SEO validation for ${options.phase || 'deployment'} completed!`);
    console.log(`📊 Final SEO Score: ${results.seoScore}/100`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ SEO validation failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}