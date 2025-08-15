const fs = require('fs');
const path = require('path');

// List of all county pages
const counties = [
  'tarrant-county',
  'dallas-county',
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
    
    // Check if file needs updating
    if (!content.includes('.btn-secondary {')) {
      console.log(`Skipping ${filePath} - no secondary button styles found`);
      return false;
    }
    
    // Replace the btn-secondary styles to make it black
    content = content.replace(
      `.btn-secondary {
	background: transparent;
	color: white;
	border: 2px solid white;
}`,
      `.btn-secondary {
	background: #000000;
	color: white;
	border: 2px solid #000000;
}`
    );
    
    // Also update the hover state
    content = content.replace(
      `.btn-secondary:hover {
	background: white;
	color: #1e3a8a;
	transform: translateY(-2px);
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}`,
      `.btn-secondary:hover {
	background: #333333;
	color: white;
	border-color: #333333;
	transform: translateY(-2px);
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}`
    );
    
    // Update the final CTA section secondary button if it exists
    content = content.replace(
      `.final-cta .btn-secondary {
	background: transparent;
	color: white;
	border: 2px solid white;
}`,
      `.final-cta .btn-secondary {
	background: #000000;
	color: white;
	border: 2px solid #000000;
}`
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('Starting Schedule Service button updates...\n');
  
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
  console.log(`✅ Successfully updated: ${updatedCount} files`);
  if (errorCount > 0) {
    console.log(`⚠️  Errors encountered: ${errorCount} files`);
  }
  console.log('========================================');
  console.log('\nSchedule Service buttons are now black on all county pages!');
}

// Run the script
main();