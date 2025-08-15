const fs = require('fs');
const path = require('path');

// Recursively find all .astro files
function findAstroFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findAstroFiles(fullPath, files);
    } else if (item.endsWith('.astro')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Find all location pages
const locationFiles = findAstroFiles('src/pages/locations');

console.log(`Found ${locationFiles.length} location files to fix`);

let fixedCount = 0;

locationFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Fix hero section - properly wrap with hero-content and add classes
  if (content.includes('class="city-hero"') || content.includes('class="hero"')) {
    // First fix the section tag
    content = content.replace(
      /<section class="city-hero">/g,
      '<section class="city-hero hero-gradient wave-bottom">'
    );
    content = content.replace(
      /<section class="hero">/g,
      '<section class="hero hero-gradient wave-bottom">'
    );
    
    // Wrap the hero content if not already wrapped
    if (!content.includes('hero-content animate-on-scroll')) {
      // Find the hero section and wrap its content
      content = content.replace(
        /<section class="(?:city-hero|hero) hero-gradient wave-bottom">\s*<div class="container">/,
        '<section class="city-hero hero-gradient wave-bottom">\n      <div class="container">\n        <div class="hero-content animate-on-scroll">'
      );
      
      // Close the hero-content div before closing the container
      content = content.replace(
        /(<p class="service-note">.*?<\/p>)\s*<\/div>\s*<\/section>/,
        '$1\n        </div>\n      </div>\n    </section>'
      );
    }
    
    // Fix h1 tags in hero
    content = content.replace(
      /<h1 class="gradient-text">([^<]+)<\/h1>/g,
      '<h1 class="hero-title">$1</h1>'
    );
    content = content.replace(
      /<h1>([^<]+)<\/h1>/g,
      '<h1 class="hero-title">$1</h1>'
    );
    
    modified = true;
  }
  
  // Fix buttons
  if (content.includes('btn-primary') && !content.includes('btn btn-enhanced')) {
    content = content.replace(/class="btn-primary btn-enhanced btn-black"/g, 'class="btn btn-enhanced btn-black"');
    content = content.replace(/class="btn-primary"/g, 'class="btn btn-enhanced btn-black"');
    content = content.replace(/class="btn-secondary"/g, 'class="btn btn-enhanced btn-black"');
    modified = true;
  }
  
  // Add section-gradient to local-info sections
  if (content.includes('class="local-info"') && !content.includes('section-gradient')) {
    content = content.replace('class="local-info"', 'class="local-info section-gradient"');
    modified = true;
  }
  
  // Add enhanced-card to service cards
  if (content.includes('class="service-item"') && !content.includes('enhanced-card')) {
    content = content.replace(/class="service-item"/g, 'class="service-item enhanced-card animate-on-scroll"');
    modified = true;
  }
  
  // Add animate-on-scroll to sections
  if (content.includes('<h2>') && !content.includes('<h2 class=')) {
    content = content.replace(/<h2>/g, '<h2 class="gradient-text animate-on-scroll">');
    modified = true;
  }
  
  // Fix the services section
  if (content.includes('class="services"') && !content.includes('section-gradient')) {
    content = content.replace('class="services"', 'class="services section-gradient"');
    modified = true;
  }
  
  // Add enhanced-card to any remaining service cards
  if (content.includes('service-card') && !content.includes('enhanced-card')) {
    content = content.replace(/class="service-card"/g, 'class="service-card enhanced-card animate-on-scroll"');
    modified = true;
  }
  
  // Fix FAQs section
  if (content.includes('class="faqs"') && !content.includes('section-gradient')) {
    content = content.replace('class="faqs"', 'class="faqs section-gradient"');
    modified = true;
  }
  
  // Add enhanced-card to FAQ items
  if (content.includes('class="faq-item"') && !content.includes('enhanced-card')) {
    content = content.replace(/class="faq-item"/g, 'class="faq-item enhanced-card animate-on-scroll"');
    modified = true;
  }
  
  // Add gradient-text to FAQ h3s
  if (content.includes('<h3>') && !content.includes('<h3 class=')) {
    content = content.replace(/<h3>/g, '<h3 class="gradient-text">');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    fixedCount++;
    console.log(`✅ Fixed: ${path.basename(path.dirname(file))}/${path.basename(file)}`);
  }
});

console.log(`\n🎉 Successfully fixed ${fixedCount} location files with proper enhanced design!`);