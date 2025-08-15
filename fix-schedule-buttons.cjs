const fs = require('fs');
const path = require('path');

// List of all county pages to update
const counties = [
  'tarrant-county',
  'collin-county',
  'denton-county',
  'rockwall-county',
  'kaufman-county',
  'ellis-county'
];

// Function to update the Schedule Service button styling
function updateScheduleButton(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix the main btn-secondary styles
    if (content.includes('.btn-secondary {')) {
      // Replace transparent background with black
      content = content.replace(
        /\.btn-secondary \{[\s\S]*?\}/,
        `.btn-secondary {
	background: #000000;
	color: white;
	border: 2px solid #000000;
}`
      );
      
      // Fix the hover state - find and replace the btn-secondary:hover block
      content = content.replace(
        /\.btn-secondary:hover \{[\s\S]*?\}/,
        `.btn-secondary:hover {
	background: #333333;
	border-color: #333333;
	color: white;
	transform: translateY(-2px);
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}`
      );
      
      // Fix the final CTA section secondary button
      content = content.replace(
        /\.final-cta \.btn-secondary \{[\s\S]*?\}/,
        `.final-cta .btn-secondary {
	background: #000000;
	color: white;
	border: 2px solid #000000;
}`
      );
      
      // Add hover state for final CTA if not exists
      if (!content.includes('.final-cta .btn-secondary:hover')) {
        content = content.replace(
          /\.final-cta \.btn-secondary \{[\s\S]*?\}/,
          `.final-cta .btn-secondary {
	background: #000000;
	color: white;
	border: 2px solid #000000;
}

.final-cta .btn-secondary:hover {
	background: #333333;
	border-color: #333333;
}`
        );
      }
      
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('Fixing Schedule Service button colors to black...\n');
  
  let updatedCount = 0;
  let errorCount = 0;
  
  counties.forEach(county => {
    const filePath = path.join(__dirname, 'src', 'pages', 'locations', county, 'index.astro');
    
    if (fs.existsSync(filePath)) {
      if (updateScheduleButton(filePath)) {
        updatedCount++;
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
      errorCount++;
    }
  });
  
  console.log('\n========================================');
  console.log(`✅ Successfully fixed: ${updatedCount} files`);
  if (errorCount > 0) {
    console.log(`⚠️  Errors encountered: ${errorCount} files`);
  }
  console.log('========================================');
  console.log('\nAll Schedule Service buttons should now be black!');
}

// Run the script
main();