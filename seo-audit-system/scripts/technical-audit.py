#!/usr/bin/env python3
"""
Technical SEO Audit Script
==========================

Comprehensive technical SEO analysis including:
- Site architecture and URL structure
- Robots.txt and sitemap validation
- Meta tags analysis
- Header tag hierarchy
- Schema markup detection
- Internal linking analysis
- Duplicate content detection
- Canonical tag verification
- SSL/HTTPS security analysis
- Mobile-first indexing compliance
"""

import asyncio
import json
import logging
import re
import ssl
import time
import urllib.parse
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from urllib.robotparser import RobotFileParser

import aiohttp
import requests
from bs4 import BeautifulSoup
from lxml import etree, html
from urllib.parse import urljoin, urlparse
import validators
import tldextract
import socket
from certificate_transparency_monitor import monitor

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/technical-audit.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TechnicalSEOAuditor:
    def __init__(self, base_url: str, config: Dict = None):
        self.base_url = base_url.rstrip('/')
        self.domain = urlparse(base_url).netloc
        self.config = config or self.load_config()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.config.get('general', {}).get('user_agent', 
                'SEO-Audit-Bot/1.0 (Ultimate SEO Audit System)')
        })
        self.crawled_urls = set()
        self.internal_links = defaultdict(set)
        self.external_links = defaultdict(set)
        self.meta_data = {}
        self.schema_markup = []
        self.issues = []
        
    @staticmethod
    def load_config() -> Dict:
        """Load configuration from file"""
        try:
            with open('config/audit-settings.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("Config file not found, using default settings")
            return {
                "general": {"timeout": 60000, "retries": 3},
                "seo": {
                    "title_length": {"min": 30, "max": 60},
                    "meta_description_length": {"min": 150, "max": 160}
                }
            }

    def save_results(self, results: Dict) -> None:
        """Save audit results to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"reports/technical_audit_{timestamp}.json"
        
        Path("reports").mkdir(exist_ok=True)
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        logger.info(f"Technical audit results saved to {filename}")

    def fetch_url(self, url: str, timeout: int = 30) -> Optional[requests.Response]:
        """Fetch URL with error handling"""
        try:
            response = self.session.get(url, timeout=timeout, allow_redirects=True)
            return response
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            self.issues.append({
                'type': 'fetch_error',
                'url': url,
                'error': str(e),
                'severity': 'high'
            })
            return None

    def analyze_robots_txt(self) -> Dict:
        """Analyze robots.txt file"""
        logger.info("Analyzing robots.txt...")
        
        robots_url = f"{self.base_url}/robots.txt"
        results = {
            'url': robots_url,
            'exists': False,
            'valid': False,
            'user_agents': [],
            'sitemaps': [],
            'disallowed_paths': [],
            'issues': []
        }
        
        response = self.fetch_url(robots_url)
        if not response or response.status_code != 200:
            results['issues'].append("robots.txt not found or inaccessible")
            return results
            
        results['exists'] = True
        
        try:
            # Parse robots.txt
            rp = RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            
            content = response.text
            results['content'] = content
            results['valid'] = True
            
            # Extract user agents and rules
            lines = content.split('\n')
            current_ua = None
            
            for line in lines:
                line = line.strip()
                if line.lower().startswith('user-agent:'):
                    current_ua = line.split(':', 1)[1].strip()
                    if current_ua not in results['user_agents']:
                        results['user_agents'].append(current_ua)
                        
                elif line.lower().startswith('disallow:'):
                    path = line.split(':', 1)[1].strip()
                    results['disallowed_paths'].append({
                        'user_agent': current_ua,
                        'path': path
                    })
                    
                elif line.lower().startswith('sitemap:'):
                    sitemap = line.split(':', 1)[1].strip()
                    results['sitemaps'].append(sitemap)
            
            # Check common issues
            if '*' not in results['user_agents']:
                results['issues'].append("No wildcard (*) user-agent specified")
                
            if not results['sitemaps']:
                results['issues'].append("No sitemaps declared in robots.txt")
                
        except Exception as e:
            results['valid'] = False
            results['issues'].append(f"Error parsing robots.txt: {e}")
            
        return results

    def analyze_sitemap(self) -> Dict:
        """Analyze XML sitemap"""
        logger.info("Analyzing sitemap...")
        
        results = {
            'found_sitemaps': [],
            'total_urls': 0,
            'valid_urls': 0,
            'issues': [],
            'last_modified': None
        }
        
        # Common sitemap locations
        sitemap_urls = [
            f"{self.base_url}/sitemap.xml",
            f"{self.base_url}/sitemap_index.xml",
            f"{self.base_url}/sitemaps.xml"
        ]
        
        # Also check robots.txt for sitemap declarations
        robots_results = self.analyze_robots_txt()
        sitemap_urls.extend(robots_results.get('sitemaps', []))
        
        for sitemap_url in sitemap_urls:
            response = self.fetch_url(sitemap_url)
            if response and response.status_code == 200:
                results['found_sitemaps'].append(sitemap_url)
                
                try:
                    # Parse XML
                    root = etree.fromstring(response.content)
                    
                    # Handle sitemap index
                    if 'sitemapindex' in root.tag:
                        sitemap_locations = root.xpath('//sitemap/loc/text()')
                        for loc in sitemap_locations:
                            # Recursively analyze sub-sitemaps
                            sub_response = self.fetch_url(loc)
                            if sub_response:
                                self._parse_sitemap_urls(sub_response.content, results)
                    else:
                        # Regular sitemap
                        self._parse_sitemap_urls(response.content, results)
                        
                except etree.XMLSyntaxError as e:
                    results['issues'].append(f"Invalid XML in sitemap {sitemap_url}: {e}")
                    
        if not results['found_sitemaps']:
            results['issues'].append("No accessible sitemap found")
            
        return results

    def _parse_sitemap_urls(self, xml_content: bytes, results: Dict) -> None:
        """Parse URLs from sitemap XML content"""
        try:
            root = etree.fromstring(xml_content)
            urls = root.xpath('//url/loc/text()')
            lastmods = root.xpath('//url/lastmod/text()')
            
            results['total_urls'] += len(urls)
            
            for i, url in enumerate(urls):
                # Validate URL
                if validators.url(url):
                    results['valid_urls'] += 1
                else:
                    results['issues'].append(f"Invalid URL in sitemap: {url}")
                
                # Check last modified dates
                if i < len(lastmods) and lastmods[i]:
                    if not results['last_modified'] or lastmods[i] > results['last_modified']:
                        results['last_modified'] = lastmods[i]
                        
        except Exception as e:
            results['issues'].append(f"Error parsing sitemap content: {e}")

    def analyze_ssl_certificate(self) -> Dict:
        """Analyze SSL certificate and HTTPS implementation"""
        logger.info("Analyzing SSL certificate...")
        
        results = {
            'https_supported': False,
            'certificate_valid': False,
            'certificate_info': {},
            'security_headers': {},
            'issues': []
        }
        
        try:
            # Check HTTPS support
            https_url = self.base_url.replace('http://', 'https://')
            response = self.fetch_url(https_url)
            
            if response and response.status_code == 200:
                results['https_supported'] = True
                
                # Analyze security headers
                security_headers = {
                    'strict-transport-security': response.headers.get('strict-transport-security'),
                    'content-security-policy': response.headers.get('content-security-policy'),
                    'x-frame-options': response.headers.get('x-frame-options'),
                    'x-content-type-options': response.headers.get('x-content-type-options'),
                    'referrer-policy': response.headers.get('referrer-policy')
                }
                results['security_headers'] = security_headers
                
                # Check for missing security headers
                if not security_headers.get('strict-transport-security'):
                    results['issues'].append("Missing HSTS header")
                    
                if not security_headers.get('content-security-policy'):
                    results['issues'].append("Missing Content Security Policy")
                    
                if not security_headers.get('x-frame-options'):
                    results['issues'].append("Missing X-Frame-Options header")
                    
            # Get certificate information
            hostname = urlparse(https_url).netloc
            context = ssl.create_default_context()
            
            with socket.create_connection((hostname, 443)) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    
                    results['certificate_valid'] = True
                    results['certificate_info'] = {
                        'subject': dict(x[0] for x in cert['subject']),
                        'issuer': dict(x[0] for x in cert['issuer']),
                        'version': cert['version'],
                        'serial_number': cert['serialNumber'],
                        'not_before': cert['notBefore'],
                        'not_after': cert['notAfter'],
                        'subject_alt_names': [x[1] for x in cert.get('subjectAltName', [])]
                    }
                    
        except Exception as e:
            results['issues'].append(f"SSL analysis error: {e}")
            
        return results

    def analyze_meta_tags(self, url: str, soup: BeautifulSoup) -> Dict:
        """Analyze meta tags for SEO"""
        meta_analysis = {
            'title': None,
            'meta_description': None,
            'meta_keywords': None,
            'robots': None,
            'canonical': None,
            'og_tags': {},
            'twitter_tags': {},
            'issues': []
        }
        
        # Title tag
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text().strip()
            meta_analysis['title'] = title
            
            # Check title length
            title_config = self.config.get('seo', {}).get('title_length', {})
            min_length = title_config.get('min', 30)
            max_length = title_config.get('max', 60)
            
            if len(title) < min_length:
                meta_analysis['issues'].append(f"Title too short ({len(title)} chars, min: {min_length})")
            elif len(title) > max_length:
                meta_analysis['issues'].append(f"Title too long ({len(title)} chars, max: {max_length})")
        else:
            meta_analysis['issues'].append("Missing title tag")
            
        # Meta description
        desc_tag = soup.find('meta', attrs={'name': 'description'})
        if desc_tag:
            description = desc_tag.get('content', '').strip()
            meta_analysis['meta_description'] = description
            
            # Check description length
            desc_config = self.config.get('seo', {}).get('meta_description_length', {})
            min_length = desc_config.get('min', 150)
            max_length = desc_config.get('max', 160)
            
            if len(description) < min_length:
                meta_analysis['issues'].append(f"Meta description too short ({len(description)} chars)")
            elif len(description) > max_length:
                meta_analysis['issues'].append(f"Meta description too long ({len(description)} chars)")
        else:
            meta_analysis['issues'].append("Missing meta description")
            
        # Meta keywords (not recommended, but check anyway)
        keywords_tag = soup.find('meta', attrs={'name': 'keywords'})
        if keywords_tag:
            meta_analysis['meta_keywords'] = keywords_tag.get('content', '').strip()
            meta_analysis['issues'].append("Meta keywords tag found (not recommended)")
            
        # Robots meta tag
        robots_tag = soup.find('meta', attrs={'name': 'robots'})
        if robots_tag:
            meta_analysis['robots'] = robots_tag.get('content', '').strip()
            
        # Canonical URL
        canonical_tag = soup.find('link', attrs={'rel': 'canonical'})
        if canonical_tag:
            canonical_url = canonical_tag.get('href', '').strip()
            meta_analysis['canonical'] = canonical_url
            
            # Validate canonical URL
            if not validators.url(canonical_url):
                meta_analysis['issues'].append(f"Invalid canonical URL: {canonical_url}")
        else:
            meta_analysis['issues'].append("Missing canonical tag")
            
        # Open Graph tags
        og_tags = soup.find_all('meta', attrs={'property': re.compile(r'^og:')})
        for tag in og_tags:
            property_name = tag.get('property')
            content = tag.get('content', '').strip()
            meta_analysis['og_tags'][property_name] = content
            
        # Twitter Card tags
        twitter_tags = soup.find_all('meta', attrs={'name': re.compile(r'^twitter:')})
        for tag in twitter_tags:
            name = tag.get('name')
            content = tag.get('content', '').strip()
            meta_analysis['twitter_tags'][name] = content
            
        return meta_analysis

    def analyze_header_structure(self, soup: BeautifulSoup) -> Dict:
        """Analyze header tag hierarchy (H1-H6)"""
        header_analysis = {
            'h1_count': 0,
            'h1_text': [],
            'header_hierarchy': [],
            'issues': []
        }
        
        # Find all header tags
        headers = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        
        for header in headers:
            tag_name = header.name
            text = header.get_text().strip()
            
            header_info = {
                'tag': tag_name,
                'text': text,
                'length': len(text)
            }
            
            header_analysis['header_hierarchy'].append(header_info)
            
            if tag_name == 'h1':
                header_analysis['h1_count'] += 1
                header_analysis['h1_text'].append(text)
                
        # Check H1 issues
        if header_analysis['h1_count'] == 0:
            header_analysis['issues'].append("No H1 tag found")
        elif header_analysis['h1_count'] > 1:
            header_analysis['issues'].append(f"Multiple H1 tags found ({header_analysis['h1_count']})")
            
        # Check header hierarchy
        if header_analysis['header_hierarchy']:
            prev_level = 0
            for header in header_analysis['header_hierarchy']:
                level = int(header['tag'][1])
                
                if level > prev_level + 1:
                    header_analysis['issues'].append(
                        f"Header hierarchy skip: {header['tag']} after H{prev_level}"
                    )
                    
                prev_level = level
                
        return header_analysis

    def analyze_schema_markup(self, soup: BeautifulSoup) -> List[Dict]:
        """Analyze structured data (Schema.org markup)"""
        schema_data = []
        
        # JSON-LD structured data
        json_ld_scripts = soup.find_all('script', attrs={'type': 'application/ld+json'})
        for script in json_ld_scripts:
            try:
                schema_json = json.loads(script.string)
                schema_data.append({
                    'type': 'json-ld',
                    'data': schema_json,
                    'valid': True
                })
            except json.JSONDecodeError as e:
                schema_data.append({
                    'type': 'json-ld',
                    'data': script.string,
                    'valid': False,
                    'error': str(e)
                })
                
        # Microdata
        microdata_elements = soup.find_all(attrs={'itemtype': True})
        for element in microdata_elements:
            item_type = element.get('itemtype')
            item_props = {}
            
            # Find item properties
            props = element.find_all(attrs={'itemprop': True})
            for prop in props:
                prop_name = prop.get('itemprop')
                prop_value = prop.get('content') or prop.get_text().strip()
                item_props[prop_name] = prop_value
                
            schema_data.append({
                'type': 'microdata',
                'itemtype': item_type,
                'properties': item_props,
                'valid': True
            })
            
        # RDFa (basic detection)
        rdfa_elements = soup.find_all(attrs={'typeof': True})
        for element in rdfa_elements:
            type_of = element.get('typeof')
            schema_data.append({
                'type': 'rdfa',
                'typeof': type_of,
                'valid': True
            })
            
        return schema_data

    def analyze_internal_links(self, url: str, soup: BeautifulSoup) -> Dict:
        """Analyze internal linking structure"""
        base_domain = urlparse(self.base_url).netloc
        
        link_analysis = {
            'total_links': 0,
            'internal_links': 0,
            'external_links': 0,
            'broken_links': 0,
            'links': [],
            'anchor_text_analysis': defaultdict(int),
            'issues': []
        }
        
        # Find all links
        links = soup.find_all('a', href=True)
        
        for link in links:
            href = link.get('href', '').strip()
            anchor_text = link.get_text().strip()
            
            # Skip empty hrefs, javascript links, and mailto links
            if not href or href.startswith(('#', 'javascript:', 'mailto:')):
                continue
                
            # Convert relative URLs to absolute
            absolute_url = urljoin(url, href)
            parsed_url = urlparse(absolute_url)
            
            is_internal = parsed_url.netloc == base_domain or parsed_url.netloc == ''
            
            link_info = {
                'url': absolute_url,
                'anchor_text': anchor_text,
                'is_internal': is_internal,
                'title': link.get('title', ''),
                'rel': link.get('rel', []),
                'target': link.get('target', '')
            }
            
            link_analysis['links'].append(link_info)
            link_analysis['total_links'] += 1
            
            if is_internal:
                link_analysis['internal_links'] += 1
                self.internal_links[url].add(absolute_url)
            else:
                link_analysis['external_links'] += 1
                self.external_links[url].add(absolute_url)
                
            # Analyze anchor text
            if anchor_text:
                link_analysis['anchor_text_analysis'][anchor_text.lower()] += 1
                
                # Check for generic anchor text
                generic_texts = ['click here', 'read more', 'learn more', 'here', 'link']
                if anchor_text.lower() in generic_texts:
                    link_analysis['issues'].append(f"Generic anchor text: '{anchor_text}'")
                    
        return link_analysis

    def check_duplicate_content(self, url: str, content: str) -> Dict:
        """Basic duplicate content detection"""
        # This is a simplified version - in production, you'd want more sophisticated analysis
        content_hash = hash(content)
        
        duplicate_analysis = {
            'content_hash': content_hash,
            'word_count': len(content.split()),
            'character_count': len(content),
            'is_duplicate': False,
            'duplicate_of': None
        }
        
        # Store content hashes for comparison (in production, use a database)
        if hasattr(self, 'content_hashes'):
            if content_hash in self.content_hashes:
                duplicate_analysis['is_duplicate'] = True
                duplicate_analysis['duplicate_of'] = self.content_hashes[content_hash]
            else:
                self.content_hashes[content_hash] = url
        else:
            self.content_hashes = {content_hash: url}
            
        return duplicate_analysis

    def analyze_mobile_friendliness(self, soup: BeautifulSoup) -> Dict:
        """Analyze mobile-friendly indicators"""
        mobile_analysis = {
            'viewport_meta': None,
            'responsive_images': 0,
            'total_images': 0,
            'touch_friendly_links': 0,
            'total_links': 0,
            'issues': []
        }
        
        # Check viewport meta tag
        viewport_tag = soup.find('meta', attrs={'name': 'viewport'})
        if viewport_tag:
            mobile_analysis['viewport_meta'] = viewport_tag.get('content', '')
            
            # Check for mobile-friendly viewport settings
            content = mobile_analysis['viewport_meta'].lower()
            if 'width=device-width' not in content:
                mobile_analysis['issues'].append("Viewport tag doesn't include 'width=device-width'")
            if 'initial-scale=1' not in content:
                mobile_analysis['issues'].append("Viewport tag doesn't include 'initial-scale=1'")
        else:
            mobile_analysis['issues'].append("Missing viewport meta tag")
            
        # Check for responsive images
        images = soup.find_all('img')
        mobile_analysis['total_images'] = len(images)
        
        for img in images:
            # Check for srcset or sizes attributes (responsive images)
            if img.get('srcset') or img.get('sizes'):
                mobile_analysis['responsive_images'] += 1
                
        # Basic touch-friendly link analysis (this would need more sophisticated checking in production)
        links = soup.find_all('a')
        mobile_analysis['total_links'] = len(links)
        
        return mobile_analysis

    async def audit_url(self, url: str) -> Dict:
        """Comprehensive audit of a single URL"""
        logger.info(f"Auditing URL: {url}")
        
        response = self.fetch_url(url)
        if not response:
            return {'url': url, 'error': 'Failed to fetch URL'}
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Perform all analyses
        audit_results = {
            'url': url,
            'status_code': response.status_code,
            'response_time': response.elapsed.total_seconds(),
            'content_type': response.headers.get('content-type', ''),
            'content_length': len(response.content),
            'timestamp': datetime.now().isoformat(),
            
            # Core analyses
            'meta_tags': self.analyze_meta_tags(url, soup),
            'header_structure': self.analyze_header_structure(soup),
            'schema_markup': self.analyze_schema_markup(soup),
            'internal_links': self.analyze_internal_links(url, soup),
            'duplicate_content': self.check_duplicate_content(url, soup.get_text()),
            'mobile_friendliness': self.analyze_mobile_friendliness(soup)
        }
        
        self.crawled_urls.add(url)
        return audit_results

    async def run_full_audit(self) -> Dict:
        """Run complete technical SEO audit"""
        logger.info(f"Starting technical SEO audit for {self.base_url}")
        
        start_time = time.time()
        
        # Initialize results
        audit_results = {
            'domain': self.domain,
            'base_url': self.base_url,
            'audit_timestamp': datetime.now().isoformat(),
            'robots_txt': self.analyze_robots_txt(),
            'sitemap': self.analyze_sitemap(),
            'ssl_certificate': self.analyze_ssl_certificate(),
            'pages': [],
            'summary': {
                'total_pages_audited': 0,
                'total_issues': 0,
                'critical_issues': 0,
                'warnings': 0,
                'recommendations': []
            }
        }
        
        # Audit main page first
        main_page_results = await self.audit_url(self.base_url)
        audit_results['pages'].append(main_page_results)
        
        # TODO: Implement crawling for additional pages
        # This would typically involve following internal links up to a certain depth
        
        # Calculate summary statistics
        total_issues = 0
        critical_issues = 0
        
        for page in audit_results['pages']:
            for category in ['meta_tags', 'header_structure', 'internal_links', 'mobile_friendliness']:
                if category in page and 'issues' in page[category]:
                    issues_count = len(page[category]['issues'])
                    total_issues += issues_count
                    
                    # Count critical issues (simplified logic)
                    for issue in page[category]['issues']:
                        if any(keyword in issue.lower() for keyword in ['missing', 'no ', 'invalid']):
                            critical_issues += 1
                            
        audit_results['summary']['total_pages_audited'] = len(audit_results['pages'])
        audit_results['summary']['total_issues'] = total_issues
        audit_results['summary']['critical_issues'] = critical_issues
        audit_results['summary']['warnings'] = total_issues - critical_issues
        
        # Generate recommendations
        recommendations = []
        
        if not audit_results['robots_txt']['exists']:
            recommendations.append("Create a robots.txt file")
            
        if not audit_results['sitemap']['found_sitemaps']:
            recommendations.append("Create and submit an XML sitemap")
            
        if not audit_results['ssl_certificate']['https_supported']:
            recommendations.append("Implement HTTPS with valid SSL certificate")
            
        for page in audit_results['pages']:
            if 'missing title tag' in str(page.get('meta_tags', {}).get('issues', [])):
                recommendations.append("Add title tags to all pages")
                break
                
        audit_results['summary']['recommendations'] = recommendations
        
        # Calculate audit duration
        audit_duration = time.time() - start_time
        audit_results['audit_duration_seconds'] = audit_duration
        
        logger.info(f"Technical audit completed in {audit_duration:.2f} seconds")
        
        # Save results
        self.save_results(audit_results)
        
        return audit_results

def main():
    """Main function for running technical SEO audit"""
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python technical-audit.py <URL>")
        sys.exit(1)
        
    url = sys.argv[1]
    
    if not validators.url(url):
        print(f"Error: Invalid URL '{url}'")
        sys.exit(1)
        
    # Create auditor and run audit
    auditor = TechnicalSEOAuditor(url)
    
    # Run audit
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    results = loop.run_until_complete(auditor.run_full_audit())
    
    # Print summary
    print("\n" + "="*50)
    print("TECHNICAL SEO AUDIT SUMMARY")
    print("="*50)
    print(f"Domain: {results['domain']}")
    print(f"Pages Audited: {results['summary']['total_pages_audited']}")
    print(f"Total Issues: {results['summary']['total_issues']}")
    print(f"Critical Issues: {results['summary']['critical_issues']}")
    print(f"Warnings: {results['summary']['warnings']}")
    print(f"Audit Duration: {results['audit_duration_seconds']:.2f}s")
    
    if results['summary']['recommendations']:
        print("\nTop Recommendations:")
        for i, rec in enumerate(results['summary']['recommendations'][:5], 1):
            print(f"{i}. {rec}")
    
    print(f"\nDetailed results saved to reports/")

if __name__ == "__main__":
    main()