#!/usr/bin/env node

/**
 * FAQ Schema Deployment - Apply Schema to Target Pages
 * Adds FAQSchema component and implementation to location pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default FAQ data template for location pages
const DEFAULT_FAQ_DATA = [
  {
    question: "What computer services do you offer in [location]?",
    answer: "We provide comprehensive computer services in [location] including virus removal, password reset, computer optimization, software installation, and emergency troubleshooting for both Windows and Mac computers."
  },
  {
    question: "How quickly can you arrive for computer service in [location]?",
    answer: "We typically arrive within 30 minutes for computer service calls in [location]. Our mobile technicians know the area well and can quickly reach all neighborhoods throughout [location]."
  },
  {
    question: "Do you service both Windows and Mac computers in [location]?",
    answer: "Yes, our [location] technicians are certified to work on both Windows PCs and Mac computers. We handle all operating system issues, software problems, and optimization needs for both platforms."
  },
  {
    question: "What areas of [location] do you serve?",
    answer: "We provide mobile computer service throughout [location] and surrounding neighborhoods. Our technicians are familiar with all areas and can reach you quickly wherever you are."
  },
  {
    question: "How much does computer service cost in [location]?",
    answer: "Our [location] computer service pricing is competitive and transparent. We provide upfront quotes with no hidden fees. Contact us at (402) 416-6942 for specific pricing based on your computer issue."
  },
  {
    question: "Do you offer emergency computer service in [location]?",
    answer: "Yes, we offer same-day emergency computer service throughout [location]. Whether you have a critical work presentation or urgent deadline, we prioritize emergency calls with rapid response times."
  },
  {
    question: "Can you remove viruses from my computer in [location]?",
    answer: "Absolutely! Virus removal is one of our most requested services in [location]. We thoroughly scan, remove malware, and install protection to prevent future infections on your computer."
  },
  {
    question: "Do you provide computer service for businesses in [location]?",
    answer: "Yes, we serve many [location] businesses and offer corporate accounts with priority service and volume discounts. We understand the importance of minimal downtime for business operations."
  }
];

class FAQSchemaDeployer {
  constructor(options = {}) {
    this.phase = options.phase || 'phase1';
    this.deploymentId = options.deploymentId;
    this.targetPages = options.targetPages || [];
    this.dryRun = options.dryRun || false;
    this.backupDir = path.join(process.cwd(), '.deployment-backups', this.deploymentId);
    
    this.stats = {
      processed: 0,
      modified: 0,
      errors: 0,
      skipped: 0
    };
  }

  async deploy() {
    console.log(`🚀 Starting FAQ schema deployment for ${this.phase}`);
    console.log(`📊 Target pages: ${this.targetPages.length}`);
    console.log(`🆔 Deployment ID: ${this.deploymentId}`);
    
    if (this.dryRun) {
      console.log('🧪 DRY RUN MODE - No files will be modified');
    }

    // Ensure backup directory exists
    if (!this.dryRun) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    for (const pageInfo of this.targetPages) {
      await this.processPage(pageInfo);
    }

    this.printSummary();
    
    if (this.stats.errors > 0) {
      throw new Error(`Deployment failed with ${this.stats.errors} errors`);
    }

    return this.stats;
  }

  async processPage(pageInfo) {
    const filePath = path.join(process.cwd(), pageInfo.path);
    this.stats.processed++;

    try {
      console.log(`📄 Processing: ${pageInfo.county}/${pageInfo.city}`);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        this.stats.skipped++;
        return;
      }

      // Read current content
      const originalContent = fs.readFileSync(filePath, 'utf8');

      // Check if FAQ schema already exists
      if (this.hasExistingSchema(originalContent)) {
        console.log(`✅ FAQ schema already exists in ${pageInfo.city}`);
        this.stats.skipped++;
        return;
      }

      // Create backup
      if (!this.dryRun) {
        this.createBackup(pageInfo, originalContent);
      }

      // Apply FAQ schema
      const modifiedContent = this.applyFAQSchema(originalContent, pageInfo);

      // Validate the modification
      if (!this.validateModification(modifiedContent, pageInfo)) {
        throw new Error('Schema validation failed');
      }

      // Write modified content
      if (!this.dryRun) {
        fs.writeFileSync(filePath, modifiedContent, 'utf8');
      }

      console.log(`✅ Successfully applied FAQ schema to ${pageInfo.city}`);
      this.stats.modified++;

    } catch (error) {
      console.error(`❌ Error processing ${pageInfo.city}:`, error.message);
      this.stats.errors++;
      
      // Log detailed error for debugging
      this.logError(pageInfo, error);
    }
  }

  hasExistingSchema(content) {
    return content.includes('FAQSchema') || 
           content.includes('faqData') ||
           content.includes('"@type": "FAQPage"');
  }

  applyFAQSchema(content, pageInfo) {
    const cityName = this.formatCityName(pageInfo.city);
    
    // 1. Add FAQSchema import if not present
    const hasImport = content.includes("import FAQSchema from");
    let modifiedContent = content;
    
    if (!hasImport) {
      // Find the Layout import line and add FAQSchema import after it
      const layoutImportRegex = /(import Layout from ['"'][^'"]+['"];?\n)/;
      if (layoutImportRegex.test(modifiedContent)) {
        modifiedContent = modifiedContent.replace(
          layoutImportRegex,
          '$1import FAQSchema from \'../../../components/FAQSchema.astro\';\n'
        );
      }
    }

    // 2. Add FAQ data after city variables
    const faqDataSection = this.generateFAQDataSection();
    
    // Find insertion point after city variables
    const cityVarRegex = /(const neighborhoods = ['""][^"']+['"];?\n)/;
    if (cityVarRegex.test(modifiedContent)) {
      modifiedContent = modifiedContent.replace(
        cityVarRegex,
        `$1\n${faqDataSection}\n`
      );
    } else {
      // Fallback: add after frontmatter start
      const frontmatterRegex = /(---\n)/;
      modifiedContent = modifiedContent.replace(
        frontmatterRegex,
        `$1${faqDataSection}\n`
      );
    }

    // 3. Add FAQSchema component before closing Layout tag
    const layoutClosingRegex = /(<\/Layout>)/;
    if (layoutClosingRegex.test(modifiedContent)) {
      modifiedContent = modifiedContent.replace(
        layoutClosingRegex,
        `<FAQSchema faqs={faqData} location={cityName} />\n$1`
      );
    }

    return modifiedContent;
  }

  generateFAQDataSection() {
    const faqItems = DEFAULT_FAQ_DATA.map(item => 
      `  {\n    question: "${item.question}",\n    answer: "${item.answer}"\n  }`
    ).join(',\n');

    return `// FAQ data for this location
const faqData = [
${faqItems}
];`;
  }

  formatCityName(city) {
    // Convert kebab-case to Title Case
    return city.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  validateModification(content, pageInfo) {
    // Check that all required components are present
    const checks = [
      { check: content.includes('import FAQSchema'), name: 'FAQSchema import' },
      { check: content.includes('const faqData'), name: 'FAQ data' },
      { check: content.includes('<FAQSchema'), name: 'FAQSchema component' },
      { check: content.includes('faqs={faqData}'), name: 'FAQ props' }
    ];

    for (const { check, name } of checks) {
      if (!check) {
        console.error(`❌ Validation failed: Missing ${name}`);
        return false;
      }
    }

    // Check for syntax errors (basic validation)
    const braceCount = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
    if (braceCount !== 0) {
      console.error(`❌ Validation failed: Unbalanced braces (${braceCount})`);
      return false;
    }

    console.log(`✅ Validation passed for ${pageInfo.city}`);
    return true;
  }

  createBackup(pageInfo, content) {
    const backupFile = path.join(
      this.backupDir, 
      `${pageInfo.county}_${pageInfo.city}.astro.backup`
    );
    
    fs.writeFileSync(backupFile, content, 'utf8');
    console.log(`💾 Backup created: ${backupFile}`);
  }

  logError(pageInfo, error) {
    const errorLogPath = path.join(this.backupDir, 'errors.log');
    const errorEntry = `${new Date().toISOString()} - ${pageInfo.county}/${pageInfo.city}: ${error.message}\n`;
    
    if (!this.dryRun) {
      fs.appendFileSync(errorLogPath, errorEntry);
    }
  }

  printSummary() {
    console.log('\n📊 Deployment Summary:');
    console.log(`   Processed: ${this.stats.processed} pages`);
    console.log(`   Modified:  ${this.stats.modified} pages`);
    console.log(`   Skipped:   ${this.stats.skipped} pages`);
    console.log(`   Errors:    ${this.stats.errors} pages`);
    
    if (this.stats.modified > 0) {
      console.log(`✅ Successfully deployed FAQ schema to ${this.stats.modified} pages`);
    }
    
    if (this.stats.errors > 0) {
      console.log(`❌ Deployment completed with ${this.stats.errors} errors`);
      console.log(`📋 Check error log: ${path.join(this.backupDir, 'errors.log')}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--phase=')) {
      options.phase = arg.split('=')[1];
    } else if (arg.startsWith('--deployment-id=')) {
      options.deploymentId = arg.split('=')[1];
    } else if (arg.startsWith('--target-pages=')) {
      try {
        options.targetPages = JSON.parse(arg.split('=')[1]).pages || [];
      } catch (error) {
        console.error('❌ Invalid target pages JSON:', error.message);
        process.exit(1);
      }
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  });

  // Validate required options
  if (!options.phase || !options.deploymentId) {
    console.error('❌ Missing required options: --phase and --deployment-id');
    console.error('Usage: node apply-faq-schema.js --phase=phase1 --deployment-id=deploy-123 --target-pages=\'{"pages":[...]}\'');
    process.exit(1);
  }

  if (!options.targetPages || options.targetPages.length === 0) {
    console.error('❌ No target pages specified');
    process.exit(1);
  }

  try {
    const deployer = new FAQSchemaDeployer(options);
    const stats = await deployer.deploy();
    
    console.log(`🎉 Deployment ${options.phase} completed successfully!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}