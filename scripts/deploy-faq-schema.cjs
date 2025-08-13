const fs = require('fs');
const path = require('path');

// FAQ data template
const faqDataTemplate = `
// FAQ data for {cityName}
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
];`;

function processLocationFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has FAQ schema
  if (content.includes('FAQSchema') || content.includes('faqData')) {
    console.log(`Skipping ${filePath} - already has FAQ schema`);
    return false;
  }
  
  // Add FAQSchema import after Layout import
  if (!content.includes("import FAQSchema")) {
    content = content.replace(
      "import Layout from '../../../layouts/Layout.astro';",
      "import Layout from '../../../layouts/Layout.astro';\nimport FAQSchema from '../../../components/FAQSchema.astro';"
    );
  }
  
  // Extract city name (handle both single and double quotes)
  const cityNameMatch = content.match(/const cityName = ["']([^"']+)["']/);
  if (!cityNameMatch) {
    console.log(`Warning: Could not extract city name from ${filePath}`);
    return false;
  }
  const cityName = cityNameMatch[1];
  
  // Add FAQ data after the const declarations
  const lastConstMatch = content.match(/(const majorEmployers[^;]+;)/);
  if (lastConstMatch) {
    const insertPoint = content.indexOf(lastConstMatch[0]) + lastConstMatch[0].length;
    content = content.slice(0, insertPoint) + '\n' + faqDataTemplate.replace(/{cityName}/g, cityName) + content.slice(insertPoint);
  } else {
    // Alternative: add before the closing ---
    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd !== -1) {
      content = content.slice(0, frontmatterEnd) + faqDataTemplate.replace(/{cityName}/g, cityName) + '\n---' + content.slice(frontmatterEnd + 3);
    }
  }
  
  // Add FAQ section before CTA section
  const ctaSectionMatch = content.match(/(\s*)<!-- CTA Section -->/);
  if (ctaSectionMatch) {
    const indent = ctaSectionMatch[1] || '    ';
    const faqSection = `
${indent}<!-- FAQ Section with Schema -->
${indent}<section class="faq-section-wrapper">
${indent}  <div class="container">
${indent}    <FAQSchema faqs={faqData} location={cityName} />
${indent}  </div>
${indent}</section>
`;
    content = content.replace('<!-- CTA Section -->', faqSection + '\n' + indent + '<!-- CTA Section -->');
  }
  
  // Add FAQ section styling if not present
  if (!content.includes('.faq-section-wrapper')) {
    const styleMatch = content.match(/(@media \(max-width: 768px\))/);
    if (styleMatch) {
      const faqStyles = `
/* FAQ Section Styling */
.faq-section-wrapper {
  padding: 3rem 0;
  background: #ffffff;
}

`;
      content = content.replace(styleMatch[0], faqStyles + styleMatch[0]);
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✓ Updated ${filePath} with FAQ schema`);
  return true;
}

function findLocationFiles() {
  const pagesDir = path.join(__dirname, '..', 'src', 'pages', 'locations');
  const files = [];
  
  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.astro') && !item.includes('index')) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(pagesDir);
  return files;
}

// Main execution
console.log('Starting FAQ Schema deployment to all location pages...\n');

const locationFiles = findLocationFiles();
console.log(`Found ${locationFiles.length} location files\n`);

let updated = 0;
let skipped = 0;

for (const file of locationFiles) {
  if (processLocationFile(file)) {
    updated++;
  } else {
    skipped++;
  }
}

console.log(`\n✅ Deployment complete!`);
console.log(`   Updated: ${updated} files`);
console.log(`   Skipped: ${skipped} files (already had FAQ schema)`);