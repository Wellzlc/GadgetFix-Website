const fs = require('fs');

// Read the Garland page
let content = fs.readFileSync('src/pages/locations/dallas-county/garland.astro', 'utf8');

// Fix the hero title text
content = content.replace(
  '<h1 class="hero-title">computer service in Garland, Texas</h1>',
  '<h1 class="hero-title">Computer Service in Garland, Texas</h1>'
);

// Fix the subtitle
content = content.replace(
  '<p class="hero-subtitle">Professional Mobile computer service Service - We Come to You</p>',
  '<p class="hero-subtitle">Professional Mobile Computer Service - We Come to You</p>'
);

// Remove the first set of duplicate styles (keep only the enhanced ones)
// Find the first style block and remove it if it has the old styles
const firstStyleStart = content.indexOf('<style>');
const firstStyleEnd = content.indexOf('</style>', firstStyleStart) + 8;

if (firstStyleStart !== -1) {
  const firstStyleBlock = content.substring(firstStyleStart, firstStyleEnd);
  
  // Check if this is the old style block (not the enhanced one)
  if (!firstStyleBlock.includes('/* Enhanced Design System */')) {
    // Remove the old style block
    content = content.substring(0, firstStyleStart) + content.substring(firstStyleEnd);
    console.log('✅ Removed old duplicate style block');
  }
}

// Make sure the hero has all the right classes
content = content.replace(
  'class="city-hero hero-gradient wave-bottom"',
  'class="hero city-hero hero-gradient wave-bottom"'
);

// Save the fixed file
fs.writeFileSync('src/pages/locations/dallas-county/garland.astro', content);

console.log('✅ Fixed Garland page hero section');
console.log('✅ Fixed title capitalization');
console.log('✅ Removed duplicate styles');
console.log('✅ Added proper hero classes');