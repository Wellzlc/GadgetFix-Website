/**
 * API endpoint for form validation
 * Integrates with the SpamGuard anti-spam system
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { SpamGuard } from '../../../lib/antispam/SpamGuard';

// Initialize SpamGuard instance
const spamGuard = new SpamGuard();

// FormSubmit.co configuration
const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/wellz.levi@gmail.com';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Log incoming request
    const text = await request.text();
    console.log('Received form data:', text);
    
    if (!text) {
      throw new Error('Empty request body');
    }
    
    const formData = JSON.parse(text);
    
    // Extract form fields
    const { name, email, phone, message, ...otherFields } = formData;
    
    // Get client metadata
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    
    // Prepare submission for spam check
    const submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: formData.sessionId || 'unknown',
      timestamp: new Date(),
      fields: {
        name,
        email,
        phone,
        message,
        ...otherFields
      },
      metadata: {
        formId: formData.formId || 'contact-form',
        formType: formData.formType || 'contact',
        submissionTime: formData.submissionTime || 0,
        keystrokes: formData.keystrokes,
        mouseMovements: formData.mouseMovements,
        fieldFocusOrder: formData.fieldFocusOrder,
        copyPasteEvents: formData.copyPasteEvents,
        timezone: formData.timezone,
        language: formData.language,
        screenResolution: formData.screenResolution,
        colorDepth: formData.colorDepth,
        platform: formData.platform,
        plugins: formData.plugins
      },
      ip,
      userAgent,
      referrer
    };
    
    // Validate submission with SpamGuard
    const result = await spamGuard.validate(submission);
    
    // Handle based on action
    if (result.action === 'block') {
      // Log blocked attempt
      console.log(`[SPAM BLOCKED] IP: ${ip}, Confidence: ${result.confidence}, Threats: ${result.threats.map(t => t.type).join(', ')}`);
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Your submission has been blocked. Please contact us directly at (402) 416-6942 if you believe this is an error.',
        reason: 'spam_detected'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (result.action === 'quarantine') {
      // Return quarantine status - client can decide how to handle
      return new Response(JSON.stringify({
        success: true,
        message: 'Your submission has been received and is pending review. We will contact you within 24 hours.',
        quarantineId: result.quarantineId,
        status: 'pending_review',
        action: 'quarantine'
      }), {
        status: 202,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Submission allowed - return success to client
    // Client will handle sending to FormSubmit directly
    console.log(`[FORM ACCEPTED] From: ${email}, Type: ${formData.formType}, Confidence: ${result.confidence}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Validation passed',
      status: 'accepted',
      action: 'allow'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Form validation error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'An error occurred processing your submission. Please try again or call (402) 416-6942.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};