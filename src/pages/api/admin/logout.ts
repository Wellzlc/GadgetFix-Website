import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  // Clear the auth cookie
  cookies.delete('admin_auth_token', {
    path: '/'
  });
  
  // Clear the session token from memory (in production, clear from Redis/DB)
  if (process.env.ADMIN_AUTH_TOKEN) {
    delete process.env.ADMIN_AUTH_TOKEN;
  }
  
  console.log(`Admin logout at ${new Date().toISOString()}`);
  
  return new Response(JSON.stringify({ 
    success: true,
    message: 'Logged out successfully' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};