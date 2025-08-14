#!/usr/bin/env node

/**
 * Security Utility: Generate Admin Credentials
 * Run: node scripts/generate-admin-credentials.js
 */

const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=================================');
console.log('  ADMIN CREDENTIALS GENERATOR');
console.log('=================================\n');

function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function main() {
  try {
    // Get username
    const username = await question('Enter admin username (default: admin): ');
    const finalUsername = username.trim() || 'admin';
    
    // Get password
    const password = await question('Enter admin password (min 12 chars): ');
    
    if (password.length < 12) {
      console.error('\n❌ Password must be at least 12 characters long!');
      rl.close();
      process.exit(1);
    }
    
    // Generate salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Generate password hash
    const passwordHash = crypto
      .createHash('sha256')
      .update(password + salt)
      .digest('hex');
    
    // Generate session secret
    const sessionSecret = crypto.randomBytes(32).toString('hex');
    
    // Generate FormSubmit ID (for email obfuscation)
    const formSubmitId = crypto.randomBytes(16).toString('hex');
    
    console.log('\n=================================');
    console.log('  ENVIRONMENT VARIABLES');
    console.log('=================================\n');
    console.log('Add these to your .env file in Netlify dashboard:\n');
    console.log(`ADMIN_USERNAME=${finalUsername}`);
    console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
    console.log(`ADMIN_SALT=${salt}`);
    console.log(`SESSION_SECRET=${sessionSecret}`);
    console.log(`FORM_SUBMIT_ENDPOINT=https://formsubmit.co/ajax/${formSubmitId}`);
    
    console.log('\n=================================');
    console.log('  NETLIFY SETUP INSTRUCTIONS');
    console.log('=================================\n');
    console.log('1. Go to Netlify Dashboard > Site Settings > Environment Variables');
    console.log('2. Add each environment variable above');
    console.log('3. Deploy your site');
    console.log('4. Configure FormSubmit.co:');
    console.log(`   - Go to https://formsubmit.co/${formSubmitId}`);
    console.log('   - Activate your form endpoint');
    console.log('   - Set your email address to receive submissions');
    console.log('\n=================================');
    console.log('  SECURITY NOTES');
    console.log('=================================\n');
    console.log('✅ Password is hashed with SHA256 + salt');
    console.log('✅ Original password is not stored anywhere');
    console.log('✅ Each deployment should use unique values');
    console.log('✅ Never commit .env files to git');
    console.log('✅ Use strong passwords (12+ chars, mixed case, numbers, symbols)');
    console.log('\n=================================\n');
    
    // Additional security recommendations
    if (password.length < 16) {
      console.log('⚠️  Consider using a longer password (16+ characters)');
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      console.log('⚠️  Consider using mixed case letters and numbers');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      console.log('⚠️  Consider adding special characters');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

main();