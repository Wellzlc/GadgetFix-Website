const fs = require('fs');
const path = require('path');

// Enhanced design styles to add
const enhancedStyles = `
<style>
/* Enhanced Design System */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes wave {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes titleGlow {
  0%, 100% { text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3); }
  50% { text-shadow: 2px 2px 20px rgba(255, 255, 255, 0.3); }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -30px) rotate(120deg); }
  66% { transform: translate(-20px, 20px) rotate(240deg); }
}

/* Hero Section */
.hero, .hero-gradient {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1e40af 100%);
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  color: white;
  position: relative;
  overflow: hidden;
  padding: 4rem 0 6rem;
  text-align: center;
}

.wave-bottom::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,133.3C672,139,768,181,864,181.3C960,181,1056,139,1152,117.3C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E") no-repeat;
  background-size: cover;
  animation: wave 10s linear infinite;
}

/* Section Background */
.section-gradient {
  background: linear-gradient(180deg, #ffffff 0%, #f0f4ff 50%, #ffffff 100%);
  position: relative;
  overflow: hidden;
}

.section-gradient::before {
  content: '';
  position: absolute;
  width: 150%;
  height: 150%;
  top: -25%;
  left: -25%;
  background: radial-gradient(circle at center, rgba(37, 99, 235, 0.05) 0%, transparent 50%);
  animation: float 20s ease-in-out infinite;
}

/* Enhanced Cards */
.enhanced-card, .service-card {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  padding: 2rem;
  border-radius: 20px;
  border: 1px solid rgba(30, 58, 138, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.enhanced-card::before, .service-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1e3a8a, #2563eb);
  transform: scaleX(0);
  transition: transform 0.4s ease;
  transform-origin: left;
}

.enhanced-card:hover, .service-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 50px rgba(30, 58, 138, 0.2);
  border-color: transparent;
  background: linear-gradient(145deg, #ffffff, #e8f0ff);
}

.enhanced-card:hover::before, .service-card:hover::before {
  transform: scaleX(1);
}

/* Gradient Text */
.gradient-text {
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
}

/* Hero Content */
.hero-content {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 3px;
  line-height: 1.1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  animation: titleGlow 3s ease-in-out infinite;
  color: white;
}

.hero-subtitle {
  font-size: 1.3rem;
  opacity: 0.95;
  max-width: 700px;
  margin: 0 auto 2rem;
  line-height: 1.6;
  color: white;
}

/* Scroll Animations */
.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.animate-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Enhanced Buttons */
.btn-enhanced, .btn-black {
  background: #000000;
  color: white;
  border: 3px solid #000000;
  border-radius: 50px;
  padding: 1.2rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  text-decoration: none;
  display: inline-block;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.btn-enhanced::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.btn-enhanced:hover, .btn-black:hover {
  background: #1a1a1a;
  border-color: #333333;
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.btn-enhanced:hover::before {
  left: 100%;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .btn-enhanced {
    width: 100%;
    max-width: 300px;
  }
}
</style>
`;

// Files to update
const premiumPages = [
  'src/pages/highland-park-computer-service.astro',
  'src/pages/university-park-computer-service.astro',
  'src/pages/southlake-computer-service.astro',
  'src/pages/plano-west-computer-service.astro',
  'src/pages/emergency-computer-service.astro'
];

function addEnhancedDesign(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`✗ File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if styles already exist
  if (content.includes('@keyframes gradientShift')) {
    console.log(`✓ ${path.basename(filePath)} already has enhanced design`);
    return false;
  }
  
  // Add hero gradient class to hero sections
  content = content.replace(
    /class="hero"/g,
    'class="hero hero-gradient wave-bottom"'
  );
  
  // Add animate-on-scroll to sections
  content = content.replace(
    /<section class="([^"]+)">/g,
    (match, classes) => {
      if (!classes.includes('hero')) {
        return `<section class="${classes} section-gradient">`;
      }
      return match;
    }
  );
  
  // Add enhanced-card class to service cards
  content = content.replace(
    /class="service-card"/g,
    'class="service-card enhanced-card animate-on-scroll"'
  );
  
  // Add btn-enhanced to buttons
  content = content.replace(
    /class="btn-primary"/g,
    'class="btn-primary btn-enhanced btn-black"'
  );
  
  // Add the styles before </Layout>
  if (content.includes('</Layout>')) {
    content = content.replace('</Layout>', enhancedStyles + '\n</Layout>');
    fs.writeFileSync(filePath, content);
    console.log(`✅ Enhanced design added to ${path.basename(filePath)}`);
    return true;
  }
  
  return false;
}

// Apply to all premium pages
console.log('Applying enhanced design to premium pages...\n');
let updatedCount = 0;

premiumPages.forEach(page => {
  if (addEnhancedDesign(page)) {
    updatedCount++;
  }
});

console.log(`\n🎉 Updated ${updatedCount} premium pages with enhanced design!`);