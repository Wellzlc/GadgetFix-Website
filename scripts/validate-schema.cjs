/**
 * Schema Validation Script
 * Checks for duplicate aggregateRating and schema conflicts
 * Run: node scripts/validate-schema.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Files to check
const filesToCheck = [
  'src/layouts/Layout.astro',
  'src/pages/services.astro',
  'src/pages/networking-cabling.astro',
  'src/pages/virus-removal-service.astro',
  'src/pages/password-reset-service.astro',
  'src/pages/index.astro',
  'src/pages/about.astro',
  'src/pages/contact.astro',
  'public/js/schema.js'
];

// Add all location pages
const locationDirs = [
  'src/pages/locations/dallas-county',
  'src/pages/locations/tarrant-county',
  'src/pages/locations/collin-county',
  'src/pages/locations/denton-county',
  'src/pages/locations/ellis-county',
  'src/pages/locations/kaufman-county',
  'src/pages/locations/rockwall-county'
];

// Schema patterns to search for
const schemaPatterns = {
  aggregateRating: /aggregateRating/gi,
  schemaScript: /<script\s+type=["']application\/ld\+json["']/gi,
  localBusiness: /@type["']?\s*:\s*["']LocalBusiness["']/gi,
  computerStore: /@type["']?\s*:\s*["']ComputerStore["']/gi,
  mobilePhoneStore: /@type["']?\s*:\s*["']MobilePhoneStore["']/gi,
  oldPhone: /402-416-6942/gi,
  newPhone: /469-430-8607/gi
};

// Results storage
const results = {
  files: {},
  summary: {
    totalFiles: 0,
    filesWithSchema: 0,
    filesWithAggregateRating: 0,
    filesWithOldPhone: 0,
    duplicateSchemas: [],
    errors: []
  }
};

// Check if file exists and analyze it
function analyzeFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const fileResults = {
    path: filePath,
    hasSchema: false,
    schemaCount: 0,
    hasAggregateRating: false,
    aggregateRatingCount: 0,
    hasLocalBusiness: false,
    hasComputerStore: false,
    hasMobilePhoneStore: false,
    hasOldPhone: false,
    hasNewPhone: false,
    schemaLocations: [],
    aggregateRatingLocations: []
  };
  
  // Check for schema scripts
  const schemaMatches = content.match(schemaPatterns.schemaScript);
  if (schemaMatches) {
    fileResults.hasSchema = true;
    fileResults.schemaCount = schemaMatches.length;
    
    // Find line numbers for schema scripts
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (schemaPatterns.schemaScript.test(line)) {
        fileResults.schemaLocations.push(index + 1);
      }
    });
  }
  
  // Check for aggregateRating
  const aggregateMatches = content.match(schemaPatterns.aggregateRating);
  if (aggregateMatches) {
    fileResults.hasAggregateRating = true;
    fileResults.aggregateRatingCount = aggregateMatches.length;
    
    // Find line numbers for aggregateRating
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (schemaPatterns.aggregateRating.test(line)) {
        fileResults.aggregateRatingLocations.push(index + 1);
      }
    });
  }
  
  // Check for business types
  if (schemaPatterns.localBusiness.test(content)) {
    fileResults.hasLocalBusiness = true;
  }
  if (schemaPatterns.computerStore.test(content)) {
    fileResults.hasComputerStore = true;
  }
  if (schemaPatterns.mobilePhoneStore.test(content)) {
    fileResults.hasMobilePhoneStore = true;
  }
  
  // Check for phone numbers
  if (schemaPatterns.oldPhone.test(content)) {
    fileResults.hasOldPhone = true;
  }
  if (schemaPatterns.newPhone.test(content)) {
    fileResults.hasNewPhone = true;
  }
  
  return fileResults;
}

// Analyze all files
console.log(`${colors.blue}Starting Schema Validation...${colors.reset}\n`);

// Check main files
filesToCheck.forEach(filePath => {
  const result = analyzeFile(filePath);
  if (result) {
    results.files[filePath] = result;
    results.summary.totalFiles++;
    
    if (result.hasSchema) {
      results.summary.filesWithSchema++;
    }
    if (result.hasAggregateRating) {
      results.summary.filesWithAggregateRating++;
    }
    if (result.hasOldPhone) {
      results.summary.filesWithOldPhone++;
    }
  }
});

// Check location files
locationDirs.forEach(dir => {
  const fullDir = path.join(process.cwd(), dir);
  if (fs.existsSync(fullDir)) {
    const files = fs.readdirSync(fullDir);
    files.forEach(file => {
      if (file.endsWith('.astro')) {
        const filePath = path.join(dir, file);
        const result = analyzeFile(filePath);
        if (result) {
          results.files[filePath] = result;
          results.summary.totalFiles++;
          
          if (result.hasSchema) {
            results.summary.filesWithSchema++;
          }
          if (result.hasAggregateRating) {
            results.summary.filesWithAggregateRating++;
          }
          if (result.hasOldPhone) {
            results.summary.filesWithOldPhone++;
          }
        }
      }
    });
  }
});

// Print results
console.log(`${colors.green}=== SCHEMA VALIDATION RESULTS ===${colors.reset}\n`);

// Summary
console.log(`${colors.blue}Summary:${colors.reset}`);
console.log(`Total files analyzed: ${results.summary.totalFiles}`);
console.log(`Files with schema markup: ${results.summary.filesWithSchema}`);
console.log(`Files with aggregateRating: ${results.summary.filesWithAggregateRating}`);
console.log(`Files with old phone number: ${results.summary.filesWithOldPhone}\n`);

// Critical Issues
let criticalIssues = 0;

// Check for multiple aggregateRatings on same page (via Layout.astro)
const layoutFile = results.files['src/layouts/Layout.astro'];
if (layoutFile && layoutFile.hasAggregateRating) {
  console.log(`${colors.red}CRITICAL: Layout.astro contains aggregateRating!${colors.reset}`);
  console.log(`This will duplicate on EVERY page that uses Layout.astro`);
  console.log(`Location: Lines ${layoutFile.aggregateRatingLocations.join(', ')}\n`);
  criticalIssues++;
}

// Check for outdated schema.js
const schemaJs = results.files['public/js/schema.js'];
if (schemaJs) {
  console.log(`${colors.red}CRITICAL: schema.js file still exists!${colors.reset}`);
  console.log(`This file should be deleted to prevent duplicate schema injection\n`);
  criticalIssues++;
}

// Check for MobilePhoneStore references
Object.entries(results.files).forEach(([filePath, result]) => {
  if (result.hasMobilePhoneStore) {
    console.log(`${colors.red}CRITICAL: ${filePath} still uses MobilePhoneStore!${colors.reset}`);
    console.log(`Should be changed to ComputerStore\n`);
    criticalIssues++;
  }
});

// Check for old phone numbers
if (results.summary.filesWithOldPhone > 0) {
  console.log(`${colors.yellow}WARNING: ${results.summary.filesWithOldPhone} files still contain old phone number (402-416-6942)${colors.reset}`);
  Object.entries(results.files).forEach(([filePath, result]) => {
    if (result.hasOldPhone) {
      console.log(`  - ${filePath}`);
    }
  });
  console.log('');
}

// Files with aggregateRating (excluding Layout.astro)
console.log(`${colors.blue}Files with aggregateRating (OK if not in Layout.astro):${colors.reset}`);
Object.entries(results.files).forEach(([filePath, result]) => {
  if (result.hasAggregateRating && filePath !== 'src/layouts/Layout.astro') {
    console.log(`  ✓ ${filePath} - Lines: ${result.aggregateRatingLocations.join(', ')}`);
  }
});
console.log('');

// Final status
if (criticalIssues === 0 && results.summary.filesWithOldPhone === 0) {
  console.log(`${colors.green}✓ VALIDATION PASSED: No critical schema issues found!${colors.reset}`);
} else {
  console.log(`${colors.red}✗ VALIDATION FAILED: ${criticalIssues} critical issues found${colors.reset}`);
  console.log(`\n${colors.yellow}Recommended Actions:${colors.reset}`);
  
  if (layoutFile && layoutFile.hasAggregateRating) {
    console.log('1. Remove aggregateRating from Layout.astro');
  }
  if (schemaJs) {
    console.log('2. Delete public/js/schema.js file');
    console.log('3. Remove <script src="/js/schema.js"> from Layout.astro');
  }
  if (results.summary.filesWithOldPhone > 0) {
    console.log('4. Update all phone numbers to 469-430-8607');
  }
}

// Export results for CI/CD integration
if (process.argv.includes('--json')) {
  fs.writeFileSync('schema-validation-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults exported to schema-validation-results.json');
}

process.exit(criticalIssues > 0 ? 1 : 0);