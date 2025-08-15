const fs = require('fs');
const path = require('path');

// List of county pages that need fixing (excluding tarrant-county which we just fixed)
const counties = [
  'dallas-county',
  'collin-county', 
  'denton-county',
  'rockwall-county',
  'kaufman-county',
  'ellis-county'
];

function fixButtonStyles(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find and replace the button styles section
    const buttonStylesPattern = /\.btn-primary,[\s\S]*?\.btn-secondary:hover \{[\s\S]*?\}/;
    
    const newButtonStyles = `.btn-primary,
.btn-secondary {
	padding: 1rem 2rem;
	border-radius: 100px;
	text-decoration: none;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 1px;
	transition: all 0.3s ease;
	display: inline-block;
}

.btn-primary {
	background: #000000;
	color: white;
	border: 2px solid #000000;
}

.btn-primary:hover {
	background: #333333;
	border-color: #333333;
	transform: translateY(-2px);
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.btn-secondary {
	background: #000000;
	color: white;
	border: 2px solid #000000;
}

.btn-secondary:hover {
	background: #333333;
	border-color: #333333;
	transform: translateY(-2px);
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}`;

    content = content.replace(buttonStylesPattern, newButtonStyles);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('Final fix for Schedule Service buttons...\n');
  
  let successCount = 0;
  
  counties.forEach(county => {
    const filePath = path.join(__dirname, 'src', 'pages', 'locations', county, 'index.astro');
    
    if (fs.existsSync(filePath)) {
      if (fixButtonStyles(filePath)) {
        successCount++;
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  });
  
  console.log('\n========================================');
  console.log(`✅ Successfully fixed: ${successCount} files`);
  console.log('========================================');
  console.log('\nAll buttons are now black!');
}

main();