const fs = require('fs');

// Read the Garland page
let content = fs.readFileSync('src/pages/locations/dallas-county/garland.astro', 'utf8');

// Remove ALL existing style blocks first
const styleRegex = /<style>[\s\S]*?<\/style>/g;
content = content.replace(styleRegex, '');

// Now add the complete, proper styles at the end after </Layout>
const completeStyles = `
<style>
/* Hero Section - Complete Fix */
.hero, .city-hero, .hero-gradient {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1e40af 100%);
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  color: white;
  padding: 4rem 0 6rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
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

@keyframes wave {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

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
  color: white !important;
}

@keyframes titleGlow {
  0%, 100% { text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2); }
  50% { text-shadow: 2px 2px 20px rgba(255, 255, 255, 0.3); }
}

.hero-subtitle {
  font-size: 1.3rem;
  opacity: 0.95;
  max-width: 700px;
  margin: 0 auto 2rem;
  line-height: 1.6;
  color: white !important;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  flex-wrap: wrap;
}

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

.btn-enhanced:hover, .btn-black:hover {
  background: #1a1a1a;
  border-color: #333333;
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.service-note {
  margin-top: 1.5rem;
  opacity: 0.9;
  font-size: 1.1rem;
  color: white !important;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  width: 100%;
}

/* Sections */
section {
  padding: 3rem 0;
}

.local-info {
  background: #ffffff;
  padding: 3rem 0;
}

.services-section {
  background: #f8f9fa;
  padding: 3rem 0;
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
  height: 100%;
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

/* Service Grid */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.service-card-link {
  text-decoration: none !important;
  color: inherit;
  display: block;
  transition: all 0.3s ease;
}

.service-card-link:hover {
  transform: translateY(-3px);
  text-decoration: none !important;
}

.service-icon {
  color: #2563EB;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

/* Gradient Text */
.gradient-text {
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
}

/* Typography */
h1 {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: white;
}

h2 {
  color: #1e3a8a;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
}

h3 {
  color: #2563EB;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

p {
  line-height: 1.8;
  margin-bottom: 1rem;
}

.local-info p {
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

/* Why Choose Section */
.why-choose {
  background: #ffffff;
  padding: 3rem 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 1rem;
  border-left: 4px solid #2563EB;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: all 0.3s ease;
}

.feature:hover {
  background: #f3f4f6;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-3px);
}

/* Service Areas */
.service-areas {
  background: #f8f9fa;
  padding: 3rem 0;
}

.areas-list {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin: 2rem 0;
}

/* CTA Section */
.city-cta {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1e40af 100%);
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  color: white;
  text-align: center;
  padding: 4rem 0;
}

.city-cta h2 {
  color: white;
  margin-bottom: 1rem;
}

.city-cta p {
  color: white;
  margin-bottom: 2rem;
}

.cta-buttons {
  margin: 2rem 0;
}

.hours {
  opacity: 0.95;
  color: white;
}

/* FAQ Section */
.faq-section-wrapper {
  padding: 3rem 0;
  background: #ffffff;
}

/* Animations */
.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.animate-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-enhanced, .btn-black {
    width: 100%;
    max-width: 300px;
  }
  
  h1 {
    font-size: 2.5rem;
  }
  
  h2 {
    font-size: 1.8rem;
  }
}
</style>`;

// Add styles after </Layout>
content = content.replace('</Layout>', '</Layout>\n' + completeStyles);

// Save the file
fs.writeFileSync('src/pages/locations/dallas-county/garland.astro', content);

console.log('✅ Completely fixed Garland page with proper styles');
console.log('✅ Hero section should now show with gradient background');
console.log('✅ Text should be white and visible');
console.log('✅ Buttons should be black with hover effects');
console.log('✅ All sections properly styled');