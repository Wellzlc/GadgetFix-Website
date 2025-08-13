import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for the sitemap
const BASE_URL = 'https://www.gadgetfixllc.com';

// Get all .astro files from src/pages
function getAllPages(dir, baseDir = '') {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllPages(fullPath, path.join(baseDir, item)));
    } else if (item.endsWith('.astro')) {
      const relativePath = path.join(baseDir, item);
      files.push(relativePath);
    }
  }
  
  return files;
}

// Convert file path to URL
function fileToUrl(filePath) {
  // Remove .astro extension
  let url = filePath.replace('.astro', '');
  
  // Replace backslashes with forward slashes
  url = url.replace(/\\/g, '/');
  
  // Remove index from URLs
  if (url.endsWith('/index')) {
    url = url.slice(0, -6);
  }
  
  // Handle root index specially
  if (url === 'index' || url === '/index') {
    return '/';
  }
  
  // Add trailing slash if not root
  if (url && !url.endsWith('/')) {
    url += '/';
  }
  
  // Add leading slash
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  
  return url;
}

// Get priority based on path depth and importance
function getPriority(url) {
  if (url === '/') return '1.0';
  
  // High priority pages
  const highPriority = [
    '/services/',
    '/virus-removal-service/',
    '/password-reset-service/',
    '/computer-optimization/',
    '/emergency-computer-service/',
    '/contact/',
    '/about/'
  ];
  
  if (highPriority.includes(url)) return '0.9';
  
  // Medium priority pages
  if (url.includes('/locations/')) return '0.8';
  if (url.includes('/blog/') || url.includes('/faq/')) return '0.7';
  
  // Premium location pages
  if (url.includes('highland-park') || url.includes('university-park') || 
      url.includes('southlake') || url.includes('plano-west')) return '0.8';
  
  // Default priority
  return '0.6';
}

// Generate sitemap XML
function generateSitemap() {
  const pagesDir = path.join(__dirname, '..', 'src', 'pages');
  const pages = getAllPages(pagesDir);
  
  // Filter out test pages and contact forms that shouldn't be indexed
  const excludePatterns = [
    'test-form',
    '404',
    'success',
    'admin/',
    '/index.astro'  // Exclude duplicate index page
  ];
  
  const urls = pages
    .map(fileToUrl)
    .filter(url => !excludePatterns.some(pattern => url.includes(pattern)))
    .sort();
  
  const today = new Date().toISOString().split('T')[0];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;
  
  for (const url of urls) {
    const priority = getPriority(url);
    const changefreq = priority === '1.0' || priority === '0.9' ? 'weekly' : 'monthly';
    
    xml += `
  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }
  
  xml += `
</urlset>`;
  
  // Write sitemap
  const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml);
  
  console.log(`Sitemap generated with ${urls.length} URLs`);
  console.log(`Saved to: ${sitemapPath}`);
}

// Run the generator
generateSitemap();