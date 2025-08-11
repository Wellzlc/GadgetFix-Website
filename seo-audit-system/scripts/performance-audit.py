#!/usr/bin/env python3
"""
Performance & Core Web Vitals Audit Script
==========================================

Comprehensive performance analysis including:
- Core Web Vitals (LCP, INP, CLS)
- Page loading speed analysis
- Resource optimization recommendations
- Critical rendering path analysis
- Image optimization audit
- JavaScript and CSS optimization
- Mobile vs Desktop performance
"""

import asyncio
import json
import logging
import subprocess
import tempfile
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse

import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/performance-audit.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class PerformanceAuditor:
    def __init__(self, base_url: str, config: Dict = None):
        self.base_url = base_url.rstrip('/')
        self.domain = urlparse(base_url).netloc
        self.config = config or self.load_config()
        self.lighthouse_results = {}
        
    @staticmethod
    def load_config() -> Dict:
        """Load configuration from file"""
        try:
            with open('config/audit-settings.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("Config file not found, using default settings")
            return {
                "performance": {
                    "core_web_vitals": {
                        "lcp_threshold": 2.5,
                        "inp_threshold": 200,
                        "cls_threshold": 0.1
                    }
                }
            }

    def save_results(self, results: Dict) -> None:
        """Save audit results to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"reports/performance_audit_{timestamp}.json"
        
        Path("reports").mkdir(exist_ok=True)
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        logger.info(f"Performance audit results saved to {filename}")

    def run_lighthouse_audit(self, url: str, form_factor: str = 'mobile') -> Dict:
        """Run Lighthouse audit using CLI"""
        logger.info(f"Running Lighthouse audit for {url} ({form_factor})")
        
        try:
            # Create temporary file for Lighthouse output
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
                temp_filename = temp_file.name
                
            # Lighthouse command
            lighthouse_cmd = [
                'lighthouse',
                url,
                '--output=json',
                f'--output-path={temp_filename}',
                f'--form-factor={form_factor}',
                '--chrome-flags=--headless',
                '--quiet',
                '--no-enable-error-reporting'
            ]
            
            # Add mobile-specific flags
            if form_factor == 'mobile':
                lighthouse_cmd.extend([
                    '--preset=perf',
                    '--throttling-method=simulate',
                    '--throttling.rttMs=150',
                    '--throttling.throughputKbps=1638',
                    '--throttling.cpuSlowdownMultiplier=4'
                ])
                
            # Run Lighthouse
            result = subprocess.run(
                lighthouse_cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                logger.error(f"Lighthouse failed: {result.stderr}")
                return {'error': f'Lighthouse execution failed: {result.stderr}'}
                
            # Read results
            with open(temp_filename, 'r') as f:
                lighthouse_data = json.load(f)
                
            # Clean up temp file
            Path(temp_filename).unlink()
            
            return self._parse_lighthouse_results(lighthouse_data)
            
        except subprocess.TimeoutExpired:
            logger.error("Lighthouse audit timed out")
            return {'error': 'Lighthouse audit timed out'}
        except Exception as e:
            logger.error(f"Error running Lighthouse: {e}")
            return {'error': f'Lighthouse error: {e}'}

    def _parse_lighthouse_results(self, lighthouse_data: Dict) -> Dict:
        """Parse and extract relevant data from Lighthouse results"""
        audits = lighthouse_data.get('audits', {})
        categories = lighthouse_data.get('categories', {})
        
        # Core Web Vitals
        core_web_vitals = {
            'lcp': {
                'value': audits.get('largest-contentful-paint', {}).get('numericValue'),
                'displayValue': audits.get('largest-contentful-paint', {}).get('displayValue'),
                'score': audits.get('largest-contentful-paint', {}).get('score')
            },
            'inp': {
                'value': audits.get('max-potential-fid', {}).get('numericValue'),  # Using FID as proxy
                'displayValue': audits.get('max-potential-fid', {}).get('displayValue'),
                'score': audits.get('max-potential-fid', {}).get('score')
            },
            'cls': {
                'value': audits.get('cumulative-layout-shift', {}).get('numericValue'),
                'displayValue': audits.get('cumulative-layout-shift', {}).get('displayValue'),
                'score': audits.get('cumulative-layout-shift', {}).get('score')
            }
        }
        
        # Performance metrics
        performance_metrics = {
            'first_contentful_paint': {
                'value': audits.get('first-contentful-paint', {}).get('numericValue'),
                'displayValue': audits.get('first-contentful-paint', {}).get('displayValue'),
                'score': audits.get('first-contentful-paint', {}).get('score')
            },
            'speed_index': {
                'value': audits.get('speed-index', {}).get('numericValue'),
                'displayValue': audits.get('speed-index', {}).get('displayValue'),
                'score': audits.get('speed-index', {}).get('score')
            },
            'time_to_interactive': {
                'value': audits.get('interactive', {}).get('numericValue'),
                'displayValue': audits.get('interactive', {}).get('displayValue'),
                'score': audits.get('interactive', {}).get('score')
            },
            'first_meaningful_paint': {
                'value': audits.get('first-meaningful-paint', {}).get('numericValue'),
                'displayValue': audits.get('first-meaningful-paint', {}).get('displayValue'),
                'score': audits.get('first-meaningful-paint', {}).get('score')
            },
            'total_blocking_time': {
                'value': audits.get('total-blocking-time', {}).get('numericValue'),
                'displayValue': audits.get('total-blocking-time', {}).get('displayValue'),
                'score': audits.get('total-blocking-time', {}).get('score')
            }
        }
        
        # Resource analysis
        resource_summary = audits.get('resource-summary', {}).get('details', {}).get('items', [])
        resources = {}
        for item in resource_summary:
            resource_type = item.get('resourceType', 'unknown')
            resources[resource_type] = {
                'requestCount': item.get('requestCount', 0),
                'transferSize': item.get('transferSize', 0),
                'resourceSize': item.get('resourceSize', 0)
            }
        
        # Opportunities (performance recommendations)
        opportunities = []
        opportunity_audits = [
            'unused-css-rules', 'unused-javascript', 'modern-image-formats',
            'uses-optimized-images', 'uses-webp-images', 'uses-responsive-images',
            'efficient-animated-content', 'render-blocking-resources',
            'unminified-css', 'unminified-javascript', 'uses-text-compression',
            'uses-rel-preconnect', 'uses-rel-preload', 'critical-request-chains'
        ]
        
        for audit_id in opportunity_audits:
            audit = audits.get(audit_id)
            if audit and audit.get('details'):
                opportunities.append({
                    'id': audit_id,
                    'title': audit.get('title'),
                    'description': audit.get('description'),
                    'score': audit.get('score'),
                    'numericValue': audit.get('numericValue'),
                    'displayValue': audit.get('displayValue'),
                    'details': audit.get('details')
                })
        
        # Overall scores
        performance_score = categories.get('performance', {}).get('score', 0) * 100
        
        return {
            'performance_score': performance_score,
            'core_web_vitals': core_web_vitals,
            'performance_metrics': performance_metrics,
            'resource_breakdown': resources,
            'opportunities': opportunities,
            'raw_audits': audits
        }

    def analyze_core_web_vitals(self, lighthouse_results: Dict) -> Dict:
        """Analyze Core Web Vitals against thresholds"""
        cwv_config = self.config.get('performance', {}).get('core_web_vitals', {})
        cwv_data = lighthouse_results.get('core_web_vitals', {})
        
        analysis = {
            'lcp': self._analyze_metric(
                cwv_data.get('lcp', {}),
                cwv_config.get('lcp_threshold', 2.5),
                'seconds',
                'good_threshold': 2.5,
                'needs_improvement_threshold': 4.0
            ),
            'inp': self._analyze_metric(
                cwv_data.get('inp', {}),
                cwv_config.get('inp_threshold', 200),
                'milliseconds',
                'good_threshold': 200,
                'needs_improvement_threshold': 500
            ),
            'cls': self._analyze_metric(
                cwv_data.get('cls', {}),
                cwv_config.get('cls_threshold', 0.1),
                'score',
                'good_threshold': 0.1,
                'needs_improvement_threshold': 0.25
            ),
            'overall_assessment': 'good'
        }
        
        # Determine overall assessment
        poor_count = sum(1 for metric in analysis.values() 
                        if isinstance(metric, dict) and metric.get('assessment') == 'poor')
        needs_improvement_count = sum(1 for metric in analysis.values() 
                                    if isinstance(metric, dict) and metric.get('assessment') == 'needs_improvement')
        
        if poor_count > 0:
            analysis['overall_assessment'] = 'poor'
        elif needs_improvement_count > 0:
            analysis['overall_assessment'] = 'needs_improvement'
            
        return analysis

    def _analyze_metric(self, metric_data: Dict, threshold: float, unit: str, 
                       good_threshold: float, needs_improvement_threshold: float) -> Dict:
        """Analyze individual Core Web Vital metric"""
        value = metric_data.get('value')
        if value is None:
            return {
                'value': None,
                'assessment': 'unknown',
                'message': 'Metric not available'
            }
            
        # Convert to appropriate units
        if unit == 'seconds' and value > 100:  # Likely in milliseconds
            value = value / 1000
        elif unit == 'milliseconds' and value < 1:  # Likely in seconds
            value = value * 1000
            
        # Determine assessment
        if value <= good_threshold:
            assessment = 'good'
            color = '🟢'
        elif value <= needs_improvement_threshold:
            assessment = 'needs_improvement'
            color = '🟡'
        else:
            assessment = 'poor'
            color = '🔴'
            
        return {
            'value': value,
            'display_value': metric_data.get('displayValue'),
            'score': metric_data.get('score'),
            'assessment': assessment,
            'color': color,
            'threshold': threshold,
            'message': f"{color} {assessment.replace('_', ' ').title()}: {metric_data.get('displayValue', value)} {unit}"
        }

    def analyze_resource_optimization(self, lighthouse_results: Dict) -> Dict:
        """Analyze resource optimization opportunities"""
        opportunities = lighthouse_results.get('opportunities', [])
        resource_breakdown = lighthouse_results.get('resource_breakdown', {})
        
        analysis = {
            'total_resources': sum(res.get('requestCount', 0) for res in resource_breakdown.values()),
            'total_transfer_size': sum(res.get('transferSize', 0) for res in resource_breakdown.values()),
            'by_type': resource_breakdown,
            'optimization_opportunities': [],
            'quick_wins': [],
            'priority_fixes': []
        }
        
        # Categorize opportunities by impact
        for opp in opportunities:
            impact_score = opp.get('numericValue', 0)
            
            opportunity_info = {
                'title': opp.get('title'),
                'description': opp.get('description'),
                'potential_savings': opp.get('displayValue'),
                'impact_score': impact_score,
                'score': opp.get('score', 0)
            }
            
            analysis['optimization_opportunities'].append(opportunity_info)
            
            # Categorize by impact and ease of implementation
            if impact_score > 1000:  # High impact (>1s savings)
                analysis['priority_fixes'].append(opportunity_info)
            elif impact_score > 500:  # Medium impact
                analysis['quick_wins'].append(opportunity_info)
                
        return analysis

    def analyze_loading_performance(self, lighthouse_results: Dict) -> Dict:
        """Analyze page loading performance"""
        metrics = lighthouse_results.get('performance_metrics', {})
        
        analysis = {
            'loading_phases': {
                'first_contentful_paint': metrics.get('first_contentful_paint'),
                'first_meaningful_paint': metrics.get('first_meaningful_paint'),
                'largest_contentful_paint': lighthouse_results.get('core_web_vitals', {}).get('lcp'),
                'time_to_interactive': metrics.get('time_to_interactive')
            },
            'bottlenecks': [],
            'recommendations': []
        }
        
        # Identify bottlenecks
        fcp = metrics.get('first_contentful_paint', {}).get('value', 0)
        lcp = lighthouse_results.get('core_web_vitals', {}).get('lcp', {}).get('value', 0)
        tti = metrics.get('time_to_interactive', {}).get('value', 0)
        
        if fcp > 3000:  # >3s
            analysis['bottlenecks'].append("Slow First Contentful Paint")
            analysis['recommendations'].append("Optimize critical rendering path")
            
        if lcp > 2500:  # >2.5s
            analysis['bottlenecks'].append("Slow Largest Contentful Paint")
            analysis['recommendations'].append("Optimize largest content element (images, videos, text blocks)")
            
        if tti > 5000:  # >5s
            analysis['bottlenecks'].append("Slow Time to Interactive")
            analysis['recommendations'].append("Reduce JavaScript execution time and main thread blocking")
            
        return analysis

    def get_pagespeed_insights(self, url: str, strategy: str = 'mobile') -> Dict:
        """Get PageSpeed Insights data using Google API"""
        try:
            # Load API configuration
            with open('config/api-config.json', 'r') as f:
                api_config = json.load(f)
                
            api_key = api_config.get('google_pagespeed', {}).get('api_key')
            if not api_key or api_key == 'YOUR_GOOGLE_PAGESPEED_API_KEY':
                logger.warning("Google PageSpeed Insights API key not configured")
                return {}
                
            api_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
            params = {
                'url': url,
                'key': api_key,
                'strategy': strategy,
                'category': ['performance', 'seo', 'best-practices', 'accessibility']
            }
            
            response = requests.get(api_url, params=params, timeout=60)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Error fetching PageSpeed Insights: {e}")
            return {}

    def analyze_images(self, url: str) -> Dict:
        """Analyze image optimization opportunities"""
        logger.info(f"Analyzing images for {url}")
        
        try:
            # Setup Selenium WebDriver
            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            
            driver.get(url)
            time.sleep(3)  # Wait for page to load
            
            # Get all images
            images = driver.find_elements("tag name", "img")
            
            image_analysis = {
                'total_images': len(images),
                'images_without_alt': 0,
                'oversized_images': 0,
                'missing_width_height': 0,
                'modern_format_candidates': 0,
                'lazy_loading_candidates': 0,
                'image_details': []
            }
            
            for img in images:
                img_data = {
                    'src': img.get_attribute('src'),
                    'alt': img.get_attribute('alt'),
                    'width': img.get_attribute('width'),
                    'height': img.get_attribute('height'),
                    'loading': img.get_attribute('loading'),
                    'srcset': img.get_attribute('srcset'),
                    'sizes': img.get_attribute('sizes')
                }
                
                # Check for issues
                if not img_data['alt']:
                    image_analysis['images_without_alt'] += 1
                    
                if not img_data['width'] or not img_data['height']:
                    image_analysis['missing_width_height'] += 1
                    
                if img_data['loading'] != 'lazy':
                    image_analysis['lazy_loading_candidates'] += 1
                    
                # Check for modern format opportunities (simplified)
                src = img_data['src'] or ''
                if src.endswith(('.jpg', '.jpeg', '.png')) and not src.endswith('.webp'):
                    image_analysis['modern_format_candidates'] += 1
                    
                image_analysis['image_details'].append(img_data)
                
            driver.quit()
            return image_analysis
            
        except Exception as e:
            logger.error(f"Error analyzing images: {e}")
            return {'error': f'Image analysis failed: {e}'}

    def run_full_performance_audit(self, url: str) -> Dict:
        """Run comprehensive performance audit"""
        logger.info(f"Starting performance audit for {url}")
        
        start_time = time.time()
        
        audit_results = {
            'url': url,
            'domain': self.domain,
            'audit_timestamp': datetime.now().isoformat(),
            'mobile': {},
            'desktop': {},
            'summary': {
                'overall_score': 0,
                'core_web_vitals_passed': False,
                'priority_issues': [],
                'quick_wins': []
            }
        }
        
        # Run Lighthouse audits for both mobile and desktop
        logger.info("Running mobile audit...")
        mobile_lighthouse = self.run_lighthouse_audit(url, 'mobile')
        if 'error' not in mobile_lighthouse:
            audit_results['mobile'] = {
                'lighthouse': mobile_lighthouse,
                'core_web_vitals': self.analyze_core_web_vitals(mobile_lighthouse),
                'resource_optimization': self.analyze_resource_optimization(mobile_lighthouse),
                'loading_performance': self.analyze_loading_performance(mobile_lighthouse)
            }
            
        logger.info("Running desktop audit...")
        desktop_lighthouse = self.run_lighthouse_audit(url, 'desktop')
        if 'error' not in desktop_lighthouse:
            audit_results['desktop'] = {
                'lighthouse': desktop_lighthouse,
                'core_web_vitals': self.analyze_core_web_vitals(desktop_lighthouse),
                'resource_optimization': self.analyze_resource_optimization(desktop_lighthouse),
                'loading_performance': self.analyze_loading_performance(desktop_lighthouse)
            }
            
        # Image analysis
        logger.info("Analyzing images...")
        audit_results['image_analysis'] = self.analyze_images(url)
        
        # PageSpeed Insights (if API key available)
        psi_data = self.get_pagespeed_insights(url, 'mobile')
        if psi_data:
            audit_results['pagespeed_insights'] = psi_data
            
        # Generate summary
        self._generate_performance_summary(audit_results)
        
        # Calculate audit duration
        audit_duration = time.time() - start_time
        audit_results['audit_duration_seconds'] = audit_duration
        
        logger.info(f"Performance audit completed in {audit_duration:.2f} seconds")
        
        # Save results
        self.save_results(audit_results)
        
        return audit_results

    def _generate_performance_summary(self, results: Dict) -> None:
        """Generate performance audit summary"""
        summary = results['summary']
        
        # Calculate overall score (average of mobile and desktop)
        scores = []
        if results.get('mobile', {}).get('lighthouse', {}).get('performance_score'):
            scores.append(results['mobile']['lighthouse']['performance_score'])
        if results.get('desktop', {}).get('lighthouse', {}).get('performance_score'):
            scores.append(results['desktop']['lighthouse']['performance_score'])
            
        if scores:
            summary['overall_score'] = sum(scores) / len(scores)
            
        # Check Core Web Vitals
        mobile_cwv = results.get('mobile', {}).get('core_web_vitals', {})
        if mobile_cwv.get('overall_assessment') == 'good':
            summary['core_web_vitals_passed'] = True
            
        # Collect priority issues and quick wins
        for device in ['mobile', 'desktop']:
            if device in results:
                resource_opt = results[device].get('resource_optimization', {})
                summary['priority_issues'].extend(resource_opt.get('priority_fixes', []))
                summary['quick_wins'].extend(resource_opt.get('quick_wins', []))
                
        # Remove duplicates
        summary['priority_issues'] = list({item['title']: item for item in summary['priority_issues']}.values())
        summary['quick_wins'] = list({item['title']: item for item in summary['quick_wins']}.values())

def main():
    """Main function for running performance audit"""
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python performance-audit.py <URL>")
        sys.exit(1)
        
    url = sys.argv[1]
    
    # Create auditor and run audit
    auditor = PerformanceAuditor(url)
    results = auditor.run_full_performance_audit(url)
    
    # Print summary
    print("\n" + "="*50)
    print("PERFORMANCE AUDIT SUMMARY")
    print("="*50)
    print(f"URL: {results['url']}")
    print(f"Overall Score: {results['summary']['overall_score']:.1f}/100")
    print(f"Core Web Vitals Passed: {'✅' if results['summary']['core_web_vitals_passed'] else '❌'}")
    
    if results.get('mobile', {}).get('core_web_vitals'):
        cwv = results['mobile']['core_web_vitals']
        print("\nCore Web Vitals (Mobile):")
        for metric_name, metric_data in cwv.items():
            if metric_name != 'overall_assessment' and isinstance(metric_data, dict):
                print(f"  {metric_name.upper()}: {metric_data.get('message', 'N/A')}")
                
    print(f"\nPriority Issues: {len(results['summary']['priority_issues'])}")
    for issue in results['summary']['priority_issues'][:3]:
        print(f"  - {issue.get('title', 'Unknown issue')}")
        
    print(f"\nQuick Wins: {len(results['summary']['quick_wins'])}")
    for win in results['summary']['quick_wins'][:3]:
        print(f"  - {win.get('title', 'Unknown optimization')}")
        
    print(f"\nAudit Duration: {results['audit_duration_seconds']:.2f}s")
    print(f"\nDetailed results saved to reports/")

if __name__ == "__main__":
    main()