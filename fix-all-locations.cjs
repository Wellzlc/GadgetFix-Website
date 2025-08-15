const fs = require('fs');
const path = require('path');

// The working template structure from Garland
const getTemplate = (cityData) => `---
import Layout from '../../../layouts/Layout.astro';
import FAQSchema from '../../../components/FAQSchema.astro';

// Define city-specific data
const cityName = "${cityData.cityName}";
const countyName = "${cityData.countyName}";
const population = "${cityData.population}";
const neighborhoods = "${cityData.neighborhoods}";
const landmarks = "${cityData.landmarks || ''}";

// FAQ data for ${cityData.cityName}
const faqData = [
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
    answer: "Our [location] computer service pricing is competitive and transparent. We provide upfront quotes with no hidden fees. Contact us at (469) 430-8607 for specific pricing based on your computer issue."
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
---

<Layout 
  title={\`Computer Service \${cityName}, TX | Mobile Service | GadgetFix LLC\`}
  description={\`Professional computer service in \${cityName}, Texas. Virus removal, password reset, optimization. We come to you! Same-day service, 90-day warranty. Call (469) 430-8607\`}
  keywords={\`computer service \${cityName.toLowerCase()}, computer service \${cityName.toLowerCase()} tx, password reset \${cityName.toLowerCase()}, mobile repair \${cityName.toLowerCase()}, windows troubleshooting \${cityName.toLowerCase()}, mac troubleshooting \${cityName.toLowerCase()}, computer repair \${cityName.toLowerCase()}, virus removal \${cityName.toLowerCase()}, password reset \${cityName.toLowerCase()}\`}
>
  <main>
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <h1 class="hero-title">Computer Service in {cityName}, Texas</h1>
        <p class="hero-subtitle">Professional Mobile Computer Service - We Come to You</p>
        <div class="hero-buttons">
          <a href="tel:4694308607" class="btn-primary">CALL NOW: (469) 430-8607</a>
          <a href="/contact" class="btn-secondary">SCHEDULE SERVICE</a>
        </div>
        <p class="service-note">Serving {cityName} and surrounding areas • 7 days a week</p>
      </div>
    </section>

    <!-- Local Service Info -->
    <section class="local-info">
      <div class="container">
        <h2>Mobile Repair Service in {cityName}</h2>
        <p>GadgetFix LLC provides professional mobile computer service throughout {cityName}, {countyName}. ${cityData.localDescription || `With a population of {population}, {cityName} residents rely on their devices daily. When your computer has issues, we bring the service to you - whether you're at home, work, or your favorite coffee shop.`}</p>
        <p>We serve all {cityName} neighborhoods including {neighborhoods}.</p>
      </div>
    </section>

    <!-- Services Grid -->
    <section class="services-section">
      <div class="container">
        <h2>Our {cityName} Computer Services</h2>
        <div class="services-grid">
          <a href="/computer-optimization" class="service-card-link">
            <div class="service-card">
              <div class="service-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3>Computer Optimization</h3>
              <p>Speed up slow computers, remove bloatware, and optimize performance in {cityName}.</p>
            </div>
          </a>
          <a href="/virus-removal-service" class="service-card-link">
            <div class="service-card">
              <div class="service-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <h3>Virus Removal</h3>
              <p>Remove malware, viruses, and spyware from computers in {cityName}.</p>
            </div>
          </a>
          <a href="/password-reset-service" class="service-card-link">
            <div class="service-card">
              <div class="service-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3>Password Reset</h3>
              <p>Recover forgotten passwords and reset Windows/Mac login credentials in {cityName}.</p>
            </div>
          </a>
          <a href="/emergency-computer-service" class="service-card-link">
            <div class="service-card">
              <div class="service-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <h3>Emergency Computer Service</h3>
              <p>Same-day emergency computer service available in {cityName}.</p>
            </div>
          </a>
          <a href="/windows-troubleshooting-dfw" class="service-card-link">
            <div class="service-card">
              <div class="service-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3>Windows Troubleshooting</h3>
              <p>Professional Windows password reset, virus removal & PC repair in {cityName}.</p>
            </div>
          </a>
          <a href="/mac-troubleshooting-dfw" class="service-card-link">
            <div class="service-card">
              <div class="service-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3>Mac Troubleshooting</h3>
              <p>Expert Mac password reset, optimization & Apple computer repair in {cityName}.</p>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- Why Choose Section -->
    <section class="why-choose">
      <div class="container">
        <h2>Why {cityName} Chooses GadgetFix</h2>
        <div class="features-grid">
          ${cityData.features || `<div class="feature">
            <h3>We Come to You</h3>
            <p>Mobile service anywhere in {cityName} - home, office, or public location</p>
          </div>
          <div class="feature">
            <h3>Fast Response</h3>
            <p>30-minute average arrival time in {cityName}</p>
          </div>
          <div class="feature">
            <h3>90-Day Warranty</h3>
            <p>All repairs backed by comprehensive parts and labor warranty</p>
          </div>
          <div class="feature">
            <h3>Fair Pricing</h3>
            <p>Competitive rates with no hidden fees for {cityName} residents</p>
          </div>`}
        </div>
      </div>
    </section>

    <!-- Service Areas -->
    <section class="service-areas">
      <div class="container">
        <h2>Areas We Serve in {cityName}</h2>
        <p>Our mobile technicians cover all of {cityName} including:</p>
        <div class="areas-list">
          <p>{neighborhoods}</p>
        </div>
        <p>${cityData.nearbyText || `We also serve nearby cities in {countyName}. No matter where you are in the {cityName} area, we can reach you quickly with professional repair service.`}</p>
      </div>
    </section>

    <!-- FAQ Section with Schema -->
    <section class="faq-section-wrapper">
      <div class="container">
        <FAQSchema faqs={faqData} location={cityName} />
      </div>
    </section>

    <!-- CTA Section -->
    <section class="city-cta">
      <div class="container">
        <h2>Get Your Device Fixed Today in {cityName}</h2>
        <p>Don't let computer problems disrupt your day. Professional mobile computer service at your location.</p>
        <div class="cta-buttons">
          <a href="tel:4694308607" class="btn-primary">CALL NOW: (469) 430-8607</a>
        </div>
        <p class="hours">Open 7 Days • Monday-Sunday 8:00 AM - 6:00 PM</p>
      </div>
    </section>
  </main>
</Layout>

<style>
/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1e40af 100%);
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  color: white;
  padding: 5rem 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: white;
}

.hero-subtitle {
  font-size: 1.3rem;
  margin-bottom: 2rem;
  opacity: 0.95;
  color: white;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.btn-primary, .btn-secondary {
  background: #000000;
  color: white;
  border: 2px solid #000000;
  border-radius: 50px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
}

.btn-primary:hover, .btn-secondary:hover {
  background: #333333;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.service-note {
  opacity: 0.9;
  color: white;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Sections */
section {
  padding: 4rem 0;
}

.local-info {
  background: #ffffff;
}

.services-section {
  background: #f8f9fa;
}

.why-choose {
  background: #ffffff;
}

.service-areas {
  background: #f8f9fa;
}

.faq-section-wrapper {
  background: #ffffff;
}

.city-cta {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1e40af 100%);
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  color: white;
  text-align: center;
}

/* Typography */
h2 {
  color: #1e3a8a;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: 700;
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
  text-align: center;
}

/* Service Grid */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.service-card-link {
  text-decoration: none;
  color: inherit;
}

.service-card {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  height: 100%;
  border: 2px solid transparent;
}

.service-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  border-color: #2563eb;
}

.service-icon {
  color: #2563EB;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  border-left: 4px solid #2563EB;
}

/* Areas List */
.areas-list {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  margin: 2rem 0;
  text-align: center;
}

/* CTA Section */
.city-cta h2 {
  color: white;
}

.city-cta p {
  color: white;
}

.cta-buttons {
  margin: 2rem 0;
}

.hours {
  opacity: 0.95;
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
  
  .btn-primary, .btn-secondary {
    width: 100%;
    max-width: 300px;
  }
  
  h2 {
    font-size: 2rem;
  }
  
  .services-grid {
    grid-template-columns: 1fr;
  }
}
</style>`;

// City data for each location
const cityDataMap = {
  // Collin County
  'allen': { cityName: 'Allen', countyName: 'Collin County', population: '111,000', neighborhoods: 'Allen Centre, Twin Creeks, Watters Branch, The Courses' },
  'anna': { cityName: 'Anna', countyName: 'Collin County', population: '20,000', neighborhoods: 'Downtown Anna, Hurricane Creek, Sherley Heritage' },
  'celina': { cityName: 'Celina', countyName: 'Collin County', population: '28,000', neighborhoods: 'Downtown Celina, Light Farms, Cambridge Crossing' },
  'fairview': { cityName: 'Fairview', countyName: 'Collin County', population: '11,000', neighborhoods: 'Heritage Ranch, The Meadows at Fairview' },
  'frisco': { cityName: 'Frisco', countyName: 'Collin County', population: '220,000', neighborhoods: 'Frisco Square, Legacy West, The Star, Stonebriar' },
  'lucas': { cityName: 'Lucas', countyName: 'Collin County', population: '9,000', neighborhoods: 'Forest Grove, Brockdale Park, Lovejoy' },
  'mckinney': { cityName: 'McKinney', countyName: 'Collin County', population: '210,000', neighborhoods: 'Historic Downtown, Adriatica Village, Craig Ranch, Stonebridge Ranch' },
  'melissa': { cityName: 'Melissa', countyName: 'Collin County', population: '14,000', neighborhoods: 'Downtown Melissa, Melissa Ridge, North Creek' },
  'murphy': { cityName: 'Murphy', countyName: 'Collin County', population: '21,000', neighborhoods: 'Maxwell Creek, Murphy Marketplace area' },
  'parker': { cityName: 'Parker', countyName: 'Collin County', population: '6,000', neighborhoods: 'Downtown Parker, Southfork Ranch area' },
  'princeton': { cityName: 'Princeton', countyName: 'Collin County', population: '20,000', neighborhoods: 'Downtown Princeton, Winchester, Arcadia Farms' },
  'prosper': { cityName: 'Prosper', countyName: 'Collin County', population: '35,000', neighborhoods: 'Windsong Ranch, Whitley Place, Gates of Prosper' },
  'wylie': { cityName: 'Wylie', countyName: 'Collin County', population: '58,000', neighborhoods: 'Historic Downtown, Birmingham Farms, Watermark' },
  
  // Dallas County
  'addison': { cityName: 'Addison', countyName: 'Dallas County', population: '17,000', neighborhoods: 'Addison Circle, Vitruvian Park, Village on the Parkway' },
  'carrollton': { cityName: 'Carrollton', countyName: 'Dallas County', population: '140,000', neighborhoods: 'Downtown Carrollton, Castle Hills, Austin Ranch' },
  'cedar-hill': { cityName: 'Cedar Hill', countyName: 'Dallas County', population: '50,000', neighborhoods: 'Lake Ridge, High Pointe, Uptown Village' },
  'dallas': { cityName: 'Dallas', countyName: 'Dallas County', population: '1,300,000', neighborhoods: 'Downtown, Uptown, Deep Ellum, Bishop Arts, Highland Park, Oak Lawn' },
  'desoto': { cityName: 'DeSoto', countyName: 'Dallas County', population: '56,000', neighborhoods: 'Hampton Creek, Candle Meadow, Eagle Point' },
  'duncanville': { cityName: 'Duncanville', countyName: 'Dallas County', population: '40,000', neighborhoods: 'Downtown Duncanville, Greenstone, Swan Ridge' },
  'farmers-branch': { cityName: 'Farmers Branch', countyName: 'Dallas County', population: '36,000', neighborhoods: 'Valley View, Brookhaven, Rawhide' },
  'highland-park': { cityName: 'Highland Park', countyName: 'Dallas County', population: '9,000', neighborhoods: 'Highland Park Village area, West Highland Park' },
  'irving': { cityName: 'Irving', countyName: 'Dallas County', population: '260,000', neighborhoods: 'Las Colinas, Valley Ranch, Heritage District' },
  'lancaster': { cityName: 'Lancaster', countyName: 'Dallas County', population: '41,000', neighborhoods: 'Historic Town Square, Bear Creek, Lancaster Mills' },
  'mesquite': { cityName: 'Mesquite', countyName: 'Dallas County', population: '150,000', neighborhoods: 'Downtown Mesquite, Falcon\'s Lair, Creek Crossing' },
  'plano': { cityName: 'Plano', countyName: 'Dallas County', population: '290,000', neighborhoods: 'Legacy West, Willow Bend, Downtown Plano, West Plano' },
  'richardson': { cityName: 'Richardson', countyName: 'Dallas County', population: '120,000', neighborhoods: 'Canyon Creek, Breckinridge Park, Telecom Corridor' },
  'rowlett': { cityName: 'Rowlett', countyName: 'Dallas County', population: '70,000', neighborhoods: 'Downtown Rowlett, Bayside, Sapphire Bay' },
  'sachse': { cityName: 'Sachse', countyName: 'Dallas County', population: '30,000', neighborhoods: 'Woodbridge, Salmon Park, Stone Creek' },
  'university-park': { cityName: 'University Park', countyName: 'Dallas County', population: '25,000', neighborhoods: 'SMU area, Snider Plaza, University Park Village' },
  
  // Denton County
  'argyle': { cityName: 'Argyle', countyName: 'Denton County', population: '5,000', neighborhoods: 'Canyon Falls, Country Lakes, Harvest' },
  'coppell': { cityName: 'Coppell', countyName: 'Denton County', population: '43,000', neighborhoods: 'Old Town Coppell, Cypress Waters, Riverchase' },
  'corinth': { cityName: 'Corinth', countyName: 'Denton County', population: '23,000', neighborhoods: 'Oakmont, The Meadows, Lake Sharon' },
  'flower-mound': { cityName: 'Flower Mound', countyName: 'Denton County', population: '80,000', neighborhoods: 'River Walk, Bridlewood, Canyon Falls' },
  'hickory-creek': { cityName: 'Hickory Creek', countyName: 'Denton County', population: '5,000', neighborhoods: 'Point Vista, The Point' },
  'highland-village': { cityName: 'Highland Village', countyName: 'Denton County', population: '16,000', neighborhoods: 'Highland Shores, Castlewood, The Village' },
  'lake-dallas': { cityName: 'Lake Dallas', countyName: 'Denton County', population: '8,000', neighborhoods: 'Willow Grove, The Cove, Town Center' },
  'lewisville': { cityName: 'Lewisville', countyName: 'Denton County', population: '130,000', neighborhoods: 'Old Town, Castle Hills, Valley Ridge' },
  'little-elm': { cityName: 'Little Elm', countyName: 'Denton County', population: '55,000', neighborhoods: 'Lakefront, Union Park, Valencia on the Lake' },
  'roanoke': { cityName: 'Roanoke', countyName: 'Denton County', population: '10,000', neighborhoods: 'Historic Downtown, Oak Street area' },
  'the-colony': { cityName: 'The Colony', countyName: 'Denton County', population: '45,000', neighborhoods: 'Austin Ranch, Stewart Peninsula, Grandscape' },
  'trophy-club': { cityName: 'Trophy Club', countyName: 'Denton County', population: '13,000', neighborhoods: 'Trophy Club, Hogan\'s Glen, The Highlands' },
  
  // Ellis County
  'midlothian': { cityName: 'Midlothian', countyName: 'Ellis County', population: '36,000', neighborhoods: 'Historic Downtown, Arbor Manors, Mockingbird Heights' },
  'red-oak': { cityName: 'Red Oak', countyName: 'Ellis County', population: '14,000', neighborhoods: 'Downtown Red Oak, Garden Valley, Meadow Ridge' },
  'waxahachie': { cityName: 'Waxahachie', countyName: 'Ellis County', population: '43,000', neighborhoods: 'Downtown Historic District, Gingerbread City, Creekside' },
  
  // Kaufman County
  'forney': { cityName: 'Forney', countyName: 'Kaufman County', population: '28,000', neighborhoods: 'Historic Downtown, Gateway, Devonshire' },
  'terrell': { cityName: 'Terrell', countyName: 'Kaufman County', population: '18,000', neighborhoods: 'Downtown Terrell, Windsor Park, American National' },
  
  // Rockwall County
  'fate': { cityName: 'Fate', countyName: 'Rockwall County', population: '20,000', neighborhoods: 'Woodcreek, Chamberlain Crossing, Williamsburg' },
  'heath': { cityName: 'Heath', countyName: 'Rockwall County', population: '10,000', neighborhoods: 'Rush Creek, Terry Park, Lake area' },
  'mclendon-chisholm': { cityName: 'McLendon-Chisholm', countyName: 'Rockwall County', population: '4,000', neighborhoods: 'Sonoma Verde, Buffalo Creek' },
  'rockwall': { cityName: 'Rockwall', countyName: 'Rockwall County', population: '50,000', neighborhoods: 'Historic Downtown, The Harbor, Chandlers Landing' },
  'royse-city': { cityName: 'Royse City', countyName: 'Rockwall County', population: '18,000', neighborhoods: 'Downtown Royse City, Waterscape, Hidden Creek' },
  
  // Tarrant County
  'arlington': { cityName: 'Arlington', countyName: 'Tarrant County', population: '400,000', neighborhoods: 'Downtown Arlington, Entertainment District, Viridian' },
  'bedford': { cityName: 'Bedford', countyName: 'Tarrant County', population: '50,000', neighborhoods: 'Old Bedford, Stonegate, Bedford Heights' },
  'benbrook': { cityName: 'Benbrook', countyName: 'Tarrant County', population: '24,000', neighborhoods: 'Lakeside, Dutch Branch, Westpark' },
  'burleson': { cityName: 'Burleson', countyName: 'Tarrant County', population: '50,000', neighborhoods: 'Old Town, Hidden Creek, The Links' },
  'colleyville': { cityName: 'Colleyville', countyName: 'Tarrant County', population: '27,000', neighborhoods: 'Colleyville Boulevard area, Montclair, Thornbury' },
  'crowley': { cityName: 'Crowley', countyName: 'Tarrant County', population: '18,000', neighborhoods: 'Downtown Crowley, Summer Creek, Tejas Lakes' },
  'euless': { cityName: 'Euless', countyName: 'Tarrant County', population: '60,000', neighborhoods: 'Downtown Euless, Arbor Park, Bear Creek' },
  'fort-worth': { cityName: 'Fort Worth', countyName: 'Tarrant County', population: '950,000', neighborhoods: 'Downtown, Sundance Square, Cultural District, TCU area, Stockyards' },
  'grand-prairie': { cityName: 'Grand Prairie', countyName: 'Tarrant County', population: '200,000', neighborhoods: 'Downtown Grand Prairie, Lake Ridge, Westchester' },
  'grapevine': { cityName: 'Grapevine', countyName: 'Tarrant County', population: '55,000', neighborhoods: 'Historic Downtown, Silver Lake, Dove Loop' },
  'haltom-city': { cityName: 'Haltom City', countyName: 'Tarrant County', population: '45,000', neighborhoods: 'Downtown Haltom City, Birdville, Buffalo Ridge' },
  'hurst': { cityName: 'Hurst', countyName: 'Tarrant County', population: '40,000', neighborhoods: 'Downtown Hurst, Bellaire Park, Northeast Mall area' },
  'keller': { cityName: 'Keller', countyName: 'Tarrant County', population: '48,000', neighborhoods: 'Old Town Keller, Hidden Lakes, The Highlands' },
  'mansfield': { cityName: 'Mansfield', countyName: 'Tarrant County', population: '75,000', neighborhoods: 'Historic Downtown, Walnut Creek, The Reserve' },
  'north-richland-hills': { cityName: 'North Richland Hills', countyName: 'Tarrant County', population: '72,000', neighborhoods: 'Downtown NRH, Iron Horse, Smithfield' },
  'richland-hills': { cityName: 'Richland Hills', countyName: 'Tarrant County', population: '8,000', neighborhoods: 'Richland Hills, Baker Boulevard area' },
  'southlake': { cityName: 'Southlake', countyName: 'Tarrant County', population: '33,000', neighborhoods: 'Town Square, Timarron, Carroll' },
  'watauga': { cityName: 'Watauga', countyName: 'Tarrant County', population: '24,000', neighborhoods: 'Capp Smith Park area, Cherokee' },
  'white-settlement': { cityName: 'White Settlement', countyName: 'Tarrant County', population: '18,000', neighborhoods: 'Downtown White Settlement, Lockheed area' }
};

// Process files
const locationsDir = path.join(__dirname, 'src', 'pages', 'locations');

function processFile(filePath) {
  const fileName = path.basename(filePath, '.astro');
  
  // Skip index files, already fixed files, and test files
  if (fileName === 'index' || fileName.includes('-fixed') || fileName.includes('test') || 
      fileName === 'garland' || fileName === 'denton') {
    return false;
  }
  
  const cityData = cityDataMap[fileName];
  if (!cityData) {
    console.log(`No city data found for ${fileName}, skipping...`);
    return false;
  }
  
  console.log(`Processing ${fileName}...`);
  const newContent = getTemplate(cityData);
  fs.writeFileSync(filePath, newContent);
  return true;
}

// Find all astro files
function getAllFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (item.endsWith('.astro')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getAllFiles(locationsDir);
let processedCount = 0;

for (const file of files) {
  if (processFile(file)) {
    processedCount++;
  }
}

console.log(`\nProcessed ${processedCount} location files successfully!`);
console.log('All location pages have been updated with the clean, working structure.');