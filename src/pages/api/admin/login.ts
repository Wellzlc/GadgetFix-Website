import type { APIRoute } from 'astro';
import crypto from 'crypto';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json();
    
    // Get credentials from environment variables
    const ADMIN_USERNAME = import.meta.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD_HASH = import.meta.env.ADMIN_PASSWORD_HASH;
    const ADMIN_SALT = import.meta.env.ADMIN_SALT;
    
    // For initial setup, use direct password check
    // In production, this should use proper hashing
    let isValid = false;
    
    // Direct password check for immediate use
    isValid = username === 'admin' && password === 'GF#2025$Secure@Admin!9401';
    
    // Later, when environment variables are properly set up, use this:
    // if (ADMIN_PASSWORD_HASH && ADMIN_SALT) {
    //   const hash = crypto
    //     .createHash('sha256')
    //     .update(password + ADMIN_SALT)
    //     .digest('hex');
    //   isValid = username === ADMIN_USERNAME && hash === ADMIN_PASSWORD_HASH;
    // }
    
    if (isValid) {
      // Set secure cookie (adjust secure flag for localhost testing)
      const isProduction = import.meta.env.PROD;
      cookies.set('admin_auth_token', 'authenticated', {
        httpOnly: true,
        secure: isProduction, // Only require HTTPS in production
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      });
      
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};