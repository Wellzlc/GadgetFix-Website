const fs = require('fs');
const path = require('path');

// Function to update a file's content
function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Update title tags
    content = content.replace(
        /title=\{`Phone Repair/g,
        'title={`Computer Service'
    );
    content = content.replace(
        /title="Phone Repair/g,
        'title="Computer Service'
    );
    
    // Update Mobile Electronics Repair references
    content = content.replace(
        /Mobile Electronics Repair/g,
        'Mobile Computer Service'
    );
    
    // Update descriptions
    content = content.replace(
        /Professional phone repair in/g,
        'Professional computer service in'
    );
    content = content.replace(
        /iPhone, Samsung, tablet repairs/g,
        'Virus removal, password reset, optimization'
    );
    content = content.replace(
        /device repair/gi,
        'computer service'
    );
    content = content.replace(
        /phone repair/gi,
        'computer service'
    );
    content = content.replace(
        /iphone repair/gi,
        'virus removal'
    );
    content = content.replace(
        /samsung repair/gi,
        'password reset'
    );
    content = content.replace(
        /screen replacement/gi,
        'computer optimization'
    );
    content = content.replace(
        /battery replacement/gi,
        'software installation'
    );
    content = content.replace(
        /tablet repairs/gi,
        'laptop service'
    );
    
    // Update service descriptions in content
    content = content.replace(
        /Screen repairs? with 90-day warranty/gi,
        'Complete virus removal guaranteed'
    );
    content = content.replace(
        /Cracked screens? fixed/gi,
        'Computer issues fixed'
    );
    content = content.replace(
        /Phone won't charge/gi,
        'Computer won\'t start'
    );
    content = content.replace(
        /Broken screens?/gi,
        'Virus infections'
    );
    content = content.replace(
        /Battery issues?/gi,
        'Performance issues'
    );
    content = content.replace(
        /Charging port problems?/gi,
        'WiFi problems'
    );
    content = content.replace(
        /Water damage recovery/gi,
        'Data recovery service'
    );
    
    // Update schema descriptions
    content = content.replace(
        /"Mobile phone repair service/gi,
        '"Mobile computer service'
    );
    content = content.replace(
        /"Phone repair service/gi,
        '"Computer service'
    );
    
    // Update heading content
    content = content.replace(
        />Phone Repair Services? in/gi,
        '>Computer Services in'
    );
    content = content.replace(
        />Mobile Device Repair/gi,
        '>Mobile Computer Service'
    );
    content = content.replace(
        />Device Repair/gi,
        '>Computer Service'
    );
    
    // Save the updated content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
}

// Get all location files
function getAllLocationFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files = files.concat(getAllLocationFiles(fullPath));
        } else if (item.endsWith('.astro')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Main execution
const locationsDir = path.join(__dirname, 'src', 'pages', 'locations');
const locationFiles = getAllLocationFiles(locationsDir);

console.log(`Found ${locationFiles.length} location files to update...`);

locationFiles.forEach(file => {
    updateFile(file);
});

// Also update other pages that might have SEO issues
const otherPages = [
    path.join(__dirname, 'src', 'pages', 'about.astro'),
    path.join(__dirname, 'src', 'pages', 'contact.astro'),
    path.join(__dirname, 'src', 'pages', 'windows-troubleshooting-dfw.astro'),
    path.join(__dirname, 'src', 'pages', 'mac-troubleshooting-dfw.astro')
];

otherPages.forEach(file => {
    if (fs.existsSync(file)) {
        updateFile(file);
    }
});

console.log('SEO update complete!');