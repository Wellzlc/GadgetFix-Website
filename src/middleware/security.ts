import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { pathname, origin } = context.url;
  const request = context.request;
  
  // Security logging for admin areas
  if (pathname.startsWith('/admin')) {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               context.clientAddress || 
               'unknown';
    
    console.log(`[SECURITY] Admin area access: ${pathname} from IP: ${ip} at ${new Date().toISOString()}`);
    
    // Check for suspicious patterns
    const userAgent = request.headers.get('user-agent') || '';
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /scanner/i,
      /nmap/i,
      /metasploit/i,
      /burp/i,
      /havij/i,
      /acunetix/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      console.warn(`[SECURITY] Suspicious user agent detected: ${userAgent} from IP: ${ip}`);
      return new Response('Forbidden', { status: 403 });
    }
  }
  
  // Block common attack paths
  const blockedPaths = [
    '/wp-admin',
    '/wp-login',
    '/.env',
    '/config.php',
    '/phpinfo.php',
    '/.git',
    '/.svn',
    '/backup',
    '/sql',
    '/db',
    '/phpmyadmin',
    '/adminer',
    '/shell'
  ];
  
  if (blockedPaths.some(path => pathname.toLowerCase().includes(path))) {
    console.warn(`[SECURITY] Blocked path access attempt: ${pathname}`);
    return new Response('Not Found', { status: 404 });
  }
  
  // Add security headers for responses
  const response = await next();
  
  // Additional security headers (these supplement netlify.toml)
  response.headers.set('X-Request-ID', crypto.randomUUID());
  response.headers.set('X-Powered-By', 'GadgetFix Security');
  
  // Remove potentially revealing headers
  response.headers.delete('Server');
  response.headers.delete('X-Aspnet-Version');
  response.headers.delete('X-AspNetMvc-Version');
  
  return response;
};