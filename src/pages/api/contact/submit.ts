import type { APIRoute } from 'astro';

export const prerender = false;

// Rate limiting store
const submissions = new Map<string, { count: number; lastSubmit: number }>();

// Clean old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of submissions.entries()) {
    if (now - data.lastSubmit > 3600000) { // 1 hour
      submissions.delete(ip);
    }
  }
}, 3600000);

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                clientAddress || 
                'unknown';
    
    // Check rate limiting (10 submissions per hour)
    const attempts = submissions.get(ip) || { count: 0, lastSubmit: 0 };
    const now = Date.now();
    
    if (now - attempts.lastSubmit < 3600000 && attempts.count >= 10) {
      return new Response(JSON.stringify({ 
        error: 'Too many submissions. Please try again later.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse form data
    const formData = await request.formData();
    const data: Record<string, string> = {};
    
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        data[key] = value;
      }
    }
    
    // Basic validation
    if (!data.name || !data.email || !data.phone) {
      return new Response(JSON.stringify({ 
        error: 'Please fill in all required fields' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(JSON.stringify({ 
        error: 'Please enter a valid email address' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Phone validation (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(data.phone)) {
      return new Response(JSON.stringify({ 
        error: 'Please enter a valid phone number' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Honeypot check (if present)
    if (data.website || data.url || data.company) {
      // Silently reject spam
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Thank you for your submission!' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get FormSubmit endpoint from environment variable
    // This should be a unique FormSubmit URL that doesn't expose your email
    const formSubmitEndpoint = process.env.FORM_SUBMIT_ENDPOINT || 
                              'https://formsubmit.co/ajax/YOUR_FORM_ID_HERE';
    
    // Prepare submission data
    const submissionData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message || '',
      service_type: data.service_type || 'General Contact',
      urgency: data.urgency || 'normal',
      device_type: data.device_type || 'not specified',
      _subject: 'New Contact Request from GadgetFix',
      _template: 'table',
      _captcha: 'false'
    };
    
    // Submit to FormSubmit
    const response = await fetch(formSubmitEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(submissionData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit form');
    }
    
    // Update rate limiting
    submissions.set(ip, {
      count: attempts.count + 1,
      lastSubmit: now
    });
    
    // Log submission (without sensitive data)
    console.log(`Form submission from IP: ${ip} at ${new Date().toISOString()}`);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Thank you for contacting GadgetFix! We will respond within 1 hour during business hours.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Form submission error:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred. Please try again or call us directly.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};