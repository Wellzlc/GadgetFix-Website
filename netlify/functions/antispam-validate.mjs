/**
 * Netlify Function for form validation
 * Integrates with the SpamGuard anti-spam system
 */

// Temporarily disable SpamGuard import due to import.meta issues
// import { SpamGuard } from '../../src/lib/antispam/SpamGuard.ts';

// Initialize SpamGuard instance (disabled temporarily)
// const spamGuard = new SpamGuard();

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Log incoming request
    console.log('Received form data:', event.body);
    
    if (!event.body) {
      throw new Error('Empty request body');
    }
    
    const formData = JSON.parse(event.body);
    
    // Extract form fields
    const { name, email, phone, message, ...otherFields } = formData;
    
    // Get client metadata
    const ip = event.headers['x-forwarded-for'] || 
               event.headers['x-real-ip'] || 
               context.clientContext?.ip || 
               '0.0.0.0';
    const userAgent = event.headers['user-agent'] || '';
    const referrer = event.headers['referer'] || '';
    
    console.log(`Form submission from IP: ${ip}, Email: ${email}`);
    
    // Basic spam checks (simplified version while fixing SpamGuard)
    let result = { action: 'allow', confidence: 0.1, threats: [] };
    
    // Simple honeypot check
    if (otherFields.website && otherFields.website.trim() !== '') {
      console.log(`[SPAM BLOCKED] Honeypot triggered: ${otherFields.website}`);
      result = { action: 'block', confidence: 0.95, threats: [{ type: 'honeypot' }] };
    }
    
    // Basic content checks
    const content = `${name} ${email} ${message}`.toLowerCase();
    const spamKeywords = ['bitcoin', 'crypto', 'investment', 'forex', 'loan', 'debt', 'casino', 'viagra', 'cialis'];
    const hasSpamKeywords = spamKeywords.some(keyword => content.includes(keyword));
    
    if (hasSpamKeywords) {
      console.log(`[SPAM DETECTED] Spam keywords found in: ${email}`);
      result = { action: 'quarantine', confidence: 0.7, threats: [{ type: 'spam_content' }] };
    }
    
    // SpamGuard validation disabled temporarily
    console.log('SpamGuard validation skipped - using basic validation only');
    
    // Handle based on action
    if (result.action === 'block') {
      // Log blocked attempt
      console.log(`[SPAM BLOCKED] IP: ${ip}, Confidence: ${result.confidence}, Threats: ${result.threats.map(t => t.type).join(', ')}`);
      
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          action: 'block',
          message: 'Your submission has been blocked. Please contact us directly at (402) 416-6942 if you believe this is an error.',
          reason: 'spam_detected'
        })
      };
    }
    
    if (result.action === 'quarantine') {
      // Return quarantine status - client can decide how to handle
      return {
        statusCode: 202,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          action: 'quarantine',
          message: 'Your submission has been received and is pending review. We will contact you within 24 hours.',
          quarantineId: result.quarantineId,
          status: 'pending_review'
        })
      };
    }
    
    // Submission allowed - return success to client
    // Client will handle sending to FormSubmit directly
    console.log(`[FORM ACCEPTED] From: ${email}, Type: ${formData.formType}, Confidence: ${result.confidence}`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        action: 'allow',
        message: 'Validation passed',
        status: 'accepted'
      })
    };
    
  } catch (error) {
    console.error('Form validation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'An error occurred processing your submission. Please try again or call (402) 416-6942.'
      })
    };
  }
};