#!/usr/bin/env node

/**
 * FAQ Schema Deployment - Target Page Selection
 * Determines which location pages to deploy for each phase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Phase configuration
const PHASE_CONFIG = {
  phase1: {
    percentage: 0.125, // 12.5% - 10 pages
    strategy: 'mixed', // Mix of counties for representative sample
    description: 'Pilot deployment to diverse location sample'
  },
  phase2: {
    percentage: 0.5, // 50% total - 40 pages
    strategy: 'counties', // Complete counties first
    description: 'Expand to 50% of locations by county priority'
  },
  phase3: {
    percentage: 1.0, // 100% - remaining 30 pages
    strategy: 'remaining', // All remaining pages
    description: 'Complete rollout to all location pages'
  }
};

// Priority order for counties (high-traffic first)
const COUNTY_PRIORITY = [
  'dallas-county',
  'collin-county', 
  'tarrant-county',
  'denton-county',
  'rockwall-county',
  'kaufman-county',
  'ellis-county'
];

// High-priority cities within counties
const HIGH_PRIORITY_CITIES = [
  'dallas', 'plano', 'frisco', 'mckinney', 'allen',
  'fort-worth', 'arlington', 'irving', 'garland',
  'carrollton', 'richardson', 'addison'
];

async function getLocationPages() {
  const locationsDir = path.join(process.cwd(), 'src', 'pages', 'locations');
  const pages = [];
  
  try {
    // Read all county directories
    const counties = fs.readdirSync(locationsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const county of counties) {
      const countyPath = path.join(locationsDir, county);
      const cityFiles = fs.readdirSync(countyPath)
        .filter(file => file.endsWith('.astro') && file !== 'index.astro');
      
      for (const cityFile of cityFiles) {
        const cityName = path.basename(cityFile, '.astro');
        const filePath = path.join('src', 'pages', 'locations', county, cityFile);
        
        pages.push({
          county,
          city: cityName,
          file: cityFile,
          path: filePath,
          priority: calculatePriority(county, cityName),
          hasSchema: await checkExistingSchema(path.join(countyPath, cityFile))
        });
      }
    }
    
    return pages.sort((a, b) => b.priority - a.priority);
  } catch (error) {
    console.error('❌ Error reading location pages:', error);
    process.exit(1);
  }
}

function calculatePriority(county, city) {
  let priority = 0;
  
  // County priority (0-60 points)
  const countyIndex = COUNTY_PRIORITY.indexOf(county);
  priority += countyIndex >= 0 ? (COUNTY_PRIORITY.length - countyIndex) * 10 : 0;
  
  // High-priority city bonus (0-40 points)
  if (HIGH_PRIORITY_CITIES.includes(city.toLowerCase())) {
    const cityIndex = HIGH_PRIORITY_CITIES.indexOf(city.toLowerCase());
    priority += (HIGH_PRIORITY_CITIES.length - cityIndex) * 2;
  }
  
  // Add randomization for fair distribution (0-10 points)
  priority += Math.random() * 10;
  
  return priority;
}

async function checkExistingSchema(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('FAQSchema') || content.includes('FAQPage');
  } catch {
    return false;
  }
}

function selectPagesForPhase(allPages, phase) {
  const config = PHASE_CONFIG[phase];
  if (!config) {
    throw new Error(`Invalid phase: ${phase}`);
  }
  
  const totalPages = allPages.length;
  const targetCount = Math.ceil(totalPages * config.percentage);
  
  console.log(`📊 Phase ${phase}: Targeting ${targetCount}/${totalPages} pages (${(config.percentage * 100).toFixed(1)}%)`);
  
  switch (config.strategy) {
    case 'mixed':
      return selectMixedSample(allPages, targetCount);
    
    case 'counties':
      return selectByCounties(allPages, targetCount);
    
    case 'remaining':
      return selectRemaining(allPages);
    
    default:
      throw new Error(`Unknown strategy: ${config.strategy}`);
  }
}

function selectMixedSample(pages, targetCount) {
  // Ensure representation from each county
  const pagesByCounty = {};
  pages.forEach(page => {
    if (!pagesByCounty[page.county]) {
      pagesByCounty[page.county] = [];
    }
    pagesByCounty[page.county].push(page);
  });
  
  const selected = [];
  const counties = Object.keys(pagesByCounty);
  const pagesPerCounty = Math.max(1, Math.floor(targetCount / counties.length));
  
  // Select high-priority pages from each county
  counties.forEach(county => {
    const countyPages = pagesByCounty[county]
      .filter(p => !p.hasSchema)
      .slice(0, pagesPerCounty);
    selected.push(...countyPages);
  });
  
  // Fill remaining slots with highest priority pages
  const remaining = targetCount - selected.length;
  if (remaining > 0) {
    const availablePages = pages
      .filter(p => !p.hasSchema && !selected.includes(p))
      .slice(0, remaining);
    selected.push(...availablePages);
  }
  
  return selected.slice(0, targetCount);
}

function selectByCounties(pages, targetCount) {
  const selected = [];
  
  // Select by county priority order
  for (const county of COUNTY_PRIORITY) {
    const countyPages = pages.filter(p => 
      p.county === county && !p.hasSchema
    );
    
    selected.push(...countyPages);
    
    if (selected.length >= targetCount) {
      break;
    }
  }
  
  return selected.slice(0, targetCount);
}

function selectRemaining(pages) {
  return pages.filter(p => !p.hasSchema);
}

async function main() {
  const phase = process.argv[2] || 'phase1';
  
  try {
    console.log(`🚀 Determining target pages for ${phase}...`);
    
    const allPages = await getLocationPages();
    console.log(`📁 Found ${allPages.length} total location pages`);
    
    const existingSchemaPages = allPages.filter(p => p.hasSchema);
    console.log(`✅ ${existingSchemaPages.length} pages already have FAQ schema`);
    
    const targetPages = selectPagesForPhase(allPages, phase);
    console.log(`🎯 Selected ${targetPages.length} pages for ${phase}`);
    
    // Output results
    const result = {
      phase,
      config: PHASE_CONFIG[phase],
      total_pages: allPages.length,
      existing_schema: existingSchemaPages.length,
      target_count: targetPages.length,
      pages: targetPages.map(p => ({
        county: p.county,
        city: p.city,
        file: p.file,
        path: p.path,
        priority: Math.round(p.priority)
      })),
      deployment_summary: {
        by_county: {},
        high_priority_cities: targetPages.filter(p => 
          HIGH_PRIORITY_CITIES.includes(p.city.toLowerCase())
        ).length
      }
    };
    
    // Count by county for summary
    targetPages.forEach(page => {
      const county = page.county;
      if (!result.deployment_summary.by_county[county]) {
        result.deployment_summary.by_county[county] = 0;
      }
      result.deployment_summary.by_county[county]++;
    });
    
    console.log('📋 Deployment Summary:');
    console.log(`   Total: ${targetPages.length} pages`);
    console.log(`   High Priority Cities: ${result.deployment_summary.high_priority_cities}`);
    console.log('   By County:');
    Object.entries(result.deployment_summary.by_county).forEach(([county, count]) => {
      console.log(`     ${county}: ${count} pages`);
    });
    
    // Output JSON for GitHub Actions
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}