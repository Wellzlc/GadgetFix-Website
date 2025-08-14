import type { APIRoute } from 'astro';
import crypto from 'crypto';

// Rate limiting store
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Clean old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.lastAttempt > 3600000) { // 1 hour
      loginAttempts.delete(ip);
    }
  }
}, 3600000);

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                clientAddress || 
                'unknown';
    
    // Check rate limiting (5 attempts per hour)
    const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    const now = Date.now();
    
    if (now - attempts.lastAttempt < 3600000 && attempts.count >= 5) {
      return new Response(JSON.stringify({ 
        error: 'Too many login attempts. Please try again later.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    const body = await request.json();
    const { username, password } = body;
    
    // Validate input
    if (!username || !password) {
      return new Response(JSON.stringify({ 
        error: 'Username and password are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    
    // For initial setup, if no hash is set, use a temporary secure token
    // This should be replaced with proper bcrypt hash in production
    if (!adminPasswordHash) {
      // Generate a secure temporary token for first-time setup
      const tempToken = crypto.randomBytes(32).toString('hex');
      console.warn('No ADMIN_PASSWORD_HASH set. Use this temporary token as password:', tempToken);
      console.warn('Set ADMIN_PASSWORD_HASH environment variable with bcrypt hash of your password');
      
      return new Response(JSON.stringify({ 
        error: 'Admin authentication not configured. Check server logs.' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Simple hash comparison for now (should use bcrypt in production)
    const passwordHash = crypto
      .createHash('sha256')
      .update(password + (process.env.ADMIN_SALT || ''))
      .digest('hex');
    
    // Verify credentials
    if (username === adminUsername && passwordHash === adminPasswordHash) {
      // Generate secure session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      // Set secure cookie
      cookies.set('admin_auth_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600, // 1 hour
        path: '/'
      });
      
      // Also store the token in env for validation (in production, use Redis/DB)
      process.env.ADMIN_AUTH_TOKEN = sessionToken;
      
      // Reset rate limiting on successful login
      loginAttempts.delete(ip);
      
      // Log successful login
      console.log(`Successful admin login from IP: ${ip} at ${new Date().toISOString()}`);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Login successful' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Update rate limiting
      loginAttempts.set(ip, {
        count: attempts.count + 1,
        lastAttempt: now
      });
      
      // Log failed attempt
      console.warn(`Failed login attempt from IP: ${ip} at ${new Date().toISOString()}`);
      
      return new Response(JSON.stringify({ 
        error: 'Invalid credentials' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};