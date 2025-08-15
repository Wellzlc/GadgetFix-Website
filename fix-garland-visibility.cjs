const fs = require('fs');

// Read the Garland page
let content = fs.readFileSync('src/pages/locations/dallas-county/garland.astro', 'utf8');

// Remove animate-on-scroll from hero content as it's hiding the text
content = content.replace(
  '<div class="hero-content animate-on-scroll">',
  '<div class="hero-content">'
);

// Find where the styles start
const styleStart = content.indexOf('<style>');
const styleEnd = content.indexOf('</style>') + 8;

// Get existing styles
let styles = content.substring(styleStart, styleEnd);

// Add critical visibility fixes
const visibilityFix = `

/* CRITICAL VISIBILITY FIXES */
.hero-content {
  opacity: 1 !important;
  transform: none !important;
  visibility: visible !important;
}

.hero-title {
  opacity: 1 !important;
  visibility: visible !important;
  color: white !important;
  display: block !important;
}

.hero-subtitle {
  opacity: 1 !important;
  visibility: visible !important;
  color: white !important;
  display: block !important;
}

.hero-buttons {
  opacity: 1 !important;
  visibility: visible !important;
  display: flex !important;
}

.service-note {
  opacity: 1 !important;
  visibility: visible !important;
  color: white !important;
  display: block !important;
}

/* Remove animation that might be hiding content */
.hero .animate-on-scroll {
  opacity: 1 !important;
  transform: none !important;
}
`;

// Insert the visibility fix into the styles
styles = styles.replace('</style>', visibilityFix + '\n</style>');

// Replace the old styles with the updated ones
content = content.substring(0, styleStart) + styles + content.substring(styleEnd);

// Also add a script to ensure visibility
const visibilityScript = `
<script>
  // Force hero content to be visible
  document.addEventListener('DOMContentLoaded', () => {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      heroContent.style.opacity = '1';
      heroContent.style.visibility = 'visible';
      heroContent.style.transform = 'none';
    }
    
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      heroTitle.style.opacity = '1';
      heroTitle.style.visibility = 'visible';
      heroTitle.style.color = 'white';
    }
    
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
      heroSubtitle.style.opacity = '1';
      heroSubtitle.style.visibility = 'visible';
      heroSubtitle.style.color = 'white';
    }
  });
</script>`;

// Add the script before </Layout>
content = content.replace('</Layout>', visibilityScript + '\n</Layout>');

// Save the file
fs.writeFileSync('src/pages/locations/dallas-county/garland.astro', content);

console.log('✅ Fixed visibility issues in Garland page');
console.log('✅ Removed animate-on-scroll from hero content');
console.log('✅ Added !important visibility rules');
console.log('✅ Added JavaScript to force visibility');
console.log('✅ Hero text should now be visible!');