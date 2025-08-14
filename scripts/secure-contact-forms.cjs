#!/usr/bin/env node

/**
 * Security Update: Replace exposed emails in contact forms
 * This script updates all contact forms to use the secure API endpoint
 * Run: node scripts/secure-contact-forms.js
 */

const fs = require('fs').promises;
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'src', 'pages');
const OLD_PATTERN = /action="https:\/\/formsubmit\.co\/[^"]+"/g;
const NEW_ACTION = 'action="/api/contact/submit"';

async function findContactForms(dir) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory() && !item.name.startsWith('.')) {
      files.push(...await findContactForms(fullPath));
    } else if (item.isFile() && item.name.endsWith('.astro')) {
      const content = await fs.readFile(fullPath, 'utf-8');
      if (content.includes('formsubmit.co')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

async function updateContactForm(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    
    // Replace form action
    content = content.replace(OLD_PATTERN, NEW_ACTION);
    
    // Update method to ensure it's POST
    content = content.replace(/method="POST"/g, 'method="POST" data-secure="true"');
    
    // Add CSRF token field if not present
    if (!content.includes('_csrf')) {
      content = content.replace(
        /<form([^>]+)>/g,
        '<form$1>\n\t\t\t\t\t\t<input type="hidden" name="_csrf" value="" />'
      );
    }
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

async function main() {
  console.log('\n=================================');
  console.log('  CONTACT FORM SECURITY UPDATE');
  console.log('=================================\n');
  
  try {
    console.log('Searching for contact forms with exposed emails...\n');
    
    const contactForms = await findContactForms(PAGES_DIR);
    
    if (contactForms.length === 0) {
      console.log('✅ No contact forms with exposed emails found!');
      return;
    }
    
    console.log(`Found ${contactForms.length} contact forms to update:\n`);
    
    let updatedCount = 0;
    
    for (const formPath of contactForms) {
      const relativePath = path.relative(process.cwd(), formPath);
      process.stdout.write(`Updating ${relativePath}... `);
      
      const updated = await updateContactForm(formPath);
      
      if (updated) {
        console.log('✅');
        updatedCount++;
      } else {
        console.log('⏭️  (no changes needed)');
      }
    }
    
    console.log('\n=================================');
    console.log('  UPDATE SUMMARY');
    console.log('=================================\n');
    console.log(`✅ Updated ${updatedCount} files`);
    console.log(`📁 Total files checked: ${contactForms.length}`);
    
    console.log('\n=================================');
    console.log('  NEXT STEPS');
    console.log('=================================\n');
    console.log('1. Review the changes with: git diff');
    console.log('2. Test forms locally: npm run dev');
    console.log('3. Set FORM_SUBMIT_ENDPOINT in Netlify environment variables');
    console.log('4. Deploy to production');
    console.log('5. Test forms on live site');
    
    console.log('\n=================================');
    console.log('  IMPORTANT NOTES');
    console.log('=================================\n');
    console.log('⚠️  Forms now submit to /api/contact/submit');
    console.log('⚠️  You must set FORM_SUBMIT_ENDPOINT environment variable');
    console.log('⚠️  Use FormSubmit.co dashboard to get your unique endpoint');
    console.log('⚠️  Never expose your email directly in HTML');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();