const fs = require('fs');
const path = require('path');

// Function to fix a city page
function fixCityPage(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix title capitalization - handle the dynamic cityName variable
  const titleRegex = /<h1 class="hero-title">computer service in \{cityName\}, Texas<\/h1>/gi;
  if (titleRegex.test(content)) {
    content = content.replace(titleRegex, '<h1 class="hero-title">Computer Service in {cityName}, Texas</h1>');
    modified = true;
  }
  
  // Fix subtitle capitalization
  const subtitleRegex = /Professional Mobile computer service Service/gi;
  if (subtitleRegex.test(content)) {
    content = content.replace(subtitleRegex, 'Professional Mobile Computer Service');
    modified = true;
  }
  
  // Ensure hero has all proper classes
  content = content.replace(
    /class="city-hero hero-gradient wave-bottom"/g,
    'class="hero city-hero hero-gradient wave-bottom"'
  );
  
  // Remove duplicate style blocks - keep only the enhanced one
  const styleBlocks = content.match(/<style>[\s\S]*?<\/style>/g);
  if (styleBlocks && styleBlocks.length > 1) {
    // Find and remove the non-enhanced style block
    for (let i = 0; i < styleBlocks.length - 1; i++) {
      if (!styleBlocks[i].includes('/* Enhanced Design System */')) {
        content = content.replace(styleBlocks[i], '');
        modified = true;
      }
    }
  }
  
  // Make sure styles are properly positioned after </Layout>
  if (!content.includes('</Layout>\n\n<style>')) {
    // Move styles to after </Layout> if they're not there
    const layoutEnd = content.indexOf('</Layout>');
    const styleStart = content.indexOf('<style>\n/* Enhanced Design System */');
    
    if (layoutEnd > -1 && styleStart > -1 && styleStart < layoutEnd) {
      // Extract the style block
      const styleEnd = content.indexOf('</style>', styleStart) + 8;
      const styleBlock = content.substring(styleStart, styleEnd);
      
      // Remove style from current position
      content = content.substring(0, styleStart) + content.substring(styleEnd);
      
      // Add after </Layout>
      content = content.replace('</Layout>', '</Layout>\n\n' + styleBlock);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${path.basename(filePath)}`);
    return true;
  } else {
    console.log(`✓ ${path.basename(filePath)} already correct`);
    return false;
  }
}

// Find all city pages
function findCityPages(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findCityPages(fullPath, files);
    } else if (item.endsWith('.astro') && !item.includes('index')) {
      files.push(fullPath);
    }
  }
  return files;
}

console.log('Fixing all city pages...\n');

const locationFiles = findCityPages('src/pages/locations');
let fixedCount = 0;

locationFiles.forEach(file => {
  if (fixCityPage(file)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Fixed ${fixedCount} city pages!`);