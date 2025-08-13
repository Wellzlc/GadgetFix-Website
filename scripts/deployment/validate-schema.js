#!/usr/bin/env node

/**
 * FAQ Schema Deployment - Schema Validation
 * Validates that FAQ schema is properly implemented in target pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SchemaValidator {
  constructor(phase) {
    this.phase = phase;
    this.errors = [];
    this.warnings = [];
    this.validationResults = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  async validate() {
    console.log(`🔍 Validating FAQ schema implementation for ${this.phase}...`);
    
    // Get target pages for this phase
    const targetPages = await this.getTargetPages();
    this.validationResults.total = targetPages.length;

    for (const pageInfo of targetPages) {
      await this.validatePage(pageInfo);
    }

    this.printResults();
    
    if (this.validationResults.failed > 0) {
      throw new Error(`Schema validation failed for ${this.validationResults.failed} pages`);
    }

    return this.validationResults;
  }

  async getTargetPages() {
    // This should match the target pages from get-target-pages.js
    // For now, we'll scan all location pages and check which ones have FAQ schema
    const locationsDir = path.join(process.cwd(), 'src', 'pages', 'locations');
    const pages = [];

    const counties = fs.readdirSync(locationsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const county of counties) {
      const countyPath = path.join(locationsDir, county);
      const cityFiles = fs.readdirSync(countyPath)
        .filter(file => file.endsWith('.astro') && file !== 'index.astro');

      for (const cityFile of cityFiles) {
        const cityName = path.basename(cityFile, '.astro');
        const filePath = path.join(countyPath, cityFile);

        // Check if this page has FAQ schema (recently added)
        if (this.hasRecentFAQSchema(filePath)) {
          pages.push({
            county,
            city: cityName,
            file: cityFile,
            path: filePath
          });
        }
      }
    }

    return pages;
  }

  hasRecentFAQSchema(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('import FAQSchema') && content.includes('const faqData');
    } catch {
      return false;
    }
  }

  async validatePage(pageInfo) {
    const filePath = pageInfo.path;
    const pageName = `${pageInfo.county}/${pageInfo.city}`;

    try {
      console.log(`🔍 Validating: ${pageName}`);

      const content = fs.readFileSync(filePath, 'utf8');
      const validationResult = this.performValidation(content, pageInfo);

      if (validationResult.isValid) {
        this.validationResults.passed++;
        console.log(`✅ ${pageName}: Validation passed`);
      } else {
        this.validationResults.failed++;
        console.log(`❌ ${pageName}: Validation failed`);
        this.errors.push(`${pageName}: ${validationResult.errors.join(', ')}`);
      }

      if (validationResult.warnings.length > 0) {
        this.validationResults.warnings++;
        this.warnings.push(`${pageName}: ${validationResult.warnings.join(', ')}`);
      }

    } catch (error) {
      this.validationResults.failed++;
      const errorMsg = `Failed to validate ${pageName}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.errors.push(errorMsg);
    }
  }

  performValidation(content, pageInfo) {
    const errors = [];
    const warnings = [];

    // 1. Check for required imports
    if (!content.includes("import FAQSchema from")) {
      errors.push("Missing FAQSchema import");
    }

    // 2. Check for FAQ data definition
    if (!content.includes("const faqData = [")) {
      errors.push("Missing faqData definition");
    }

    // 3. Check for FAQSchema component usage
    if (!content.includes("<FAQSchema")) {
      errors.push("Missing FAQSchema component in template");
    }

    // 4. Validate FAQ data structure
    const faqDataMatch = content.match(/const faqData = (\[[\s\S]*?\]);/);
    if (faqDataMatch) {
      try {
        // Basic validation of FAQ data structure
        const faqDataString = faqDataMatch[1];
        
        // Check for required question/answer structure
        if (!faqDataString.includes('question:') || !faqDataString.includes('answer:')) {
          errors.push("FAQ data missing question/answer structure");
        }

        // Check for location placeholders
        if (!faqDataString.includes('[location]')) {
          warnings.push("FAQ data doesn't use location placeholders");
        }

        // Validate minimum number of FAQs
        const questionCount = (faqDataString.match(/question:/g) || []).length;
        if (questionCount < 6) {
          warnings.push(`Only ${questionCount} FAQ items (recommended: 6+)`);
        } else if (questionCount > 12) {
          warnings.push(`${questionCount} FAQ items (may be too many for optimal UX)`);
        }

      } catch (parseError) {
        errors.push("FAQ data structure validation failed");
      }
    }

    // 5. Check for proper component props
    const componentMatch = content.match(/<FAQSchema[^>]*>/);
    if (componentMatch) {
      const componentTag = componentMatch[0];
      
      if (!componentTag.includes('faqs={faqData}')) {
        errors.push("FAQSchema component missing faqs prop");
      }
      
      if (!componentTag.includes('location=')) {
        errors.push("FAQSchema component missing location prop");
      }
    }

    // 6. Validate schema structure in generated JSON-LD
    if (content.includes('@type": "FAQPage"')) {
      // This would be generated by the component, but we can check if it's already there
      warnings.push("Existing JSON-LD FAQ schema found (may cause duplication)");
    }

    // 7. Check for balanced braces and syntax
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Syntax error: Unbalanced braces (${openBraces - closeBraces})`);
    }

    // 8. Validate Astro component syntax
    if (!content.includes('---') || content.indexOf('---') === content.lastIndexOf('---')) {
      errors.push("Invalid Astro frontmatter structure");
    }

    // 9. Check for SEO best practices
    const cityName = this.formatCityName(pageInfo.city);
    if (faqDataMatch && !faqDataMatch[1].includes(cityName)) {
      warnings.push("FAQ data may not be properly localized for this city");
    }

    // 10. Validate accessibility
    const componentUsage = content.match(/<FAQSchema[^>]*\/>/);
    if (componentUsage && componentUsage[0].includes('aria-')) {
      // Good - has accessibility attributes
    } else {
      warnings.push("Consider adding ARIA attributes for better accessibility");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  formatCityName(city) {
    return city.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  printResults() {
    console.log('\n📊 Schema Validation Results:');
    console.log(`   Total Pages:    ${this.validationResults.total}`);
    console.log(`   Passed:         ${this.validationResults.passed}`);
    console.log(`   Failed:         ${this.validationResults.failed}`);
    console.log(`   With Warnings:  ${this.validationResults.warnings}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Validation Errors:');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Validation Warnings:');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    const successRate = (this.validationResults.passed / this.validationResults.total * 100).toFixed(1);
    console.log(`\n📈 Success Rate: ${successRate}%`);

    if (this.validationResults.failed === 0) {
      console.log('✅ All schema validations passed!');
    } else {
      console.log(`❌ ${this.validationResults.failed} pages failed validation`);
    }
  }
}

async function main() {
  const phase = process.argv[2] || 'phase1';

  try {
    const validator = new SchemaValidator(phase);
    const results = await validator.validate();
    
    console.log(`🎉 Schema validation for ${phase} completed!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}