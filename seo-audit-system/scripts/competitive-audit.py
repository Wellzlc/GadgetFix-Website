#!/usr/bin/env python3
"""
Competitive SEO Analysis Script
===============================

Comprehensive competitive analysis including:
- SERP position tracking for target keywords
- Competitor identification and analysis
- Content gap identification
- Technical comparison with competitors
- Backlink analysis (basic)
- Social signal analysis
- Keyword overlap analysis
- Performance benchmarking
"""

import asyncio
import json
import logging
import re
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/competitive-audit.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CompetitiveAnalyzer:
    def __init__(self, base_url: str, competitors: List[str] = None, config: Dict = None):
        self.base_url = base_url.rstrip('/')
        self.domain = urlparse(base_url).netloc
        self.competitors = competitors or []
        self.config = config or self.load_config()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.config.get('general', {}).get('user_agent', 
                'SEO-Audit-Bot/1.0 (Ultimate SEO Audit System)')
        })
        self.target_keywords = self.load_target_keywords()
        self.serp_results = {}
        
    @staticmethod
    def load_config() -> Dict:
        """Load configuration from file"""
        try:
            with open('config/audit-settings.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("Config file not found, using default settings")
            return {"general": {"timeout": 60000}}
    
    def load_target_keywords(self) -> List[str]:
        """Load target keywords from config file"""
        try:
            with open('config/keywords.txt', 'r') as f:
                keywords = [line.strip() for line in f if line.strip() and not line.startswith('#')]
                return keywords
        except FileNotFoundError:
            logger.warning("Keywords file not found")
            return []

    def save_results(self, results: Dict) -> None:
        """Save audit results to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"reports/competitive_audit_{timestamp}.json"
        
        Path("reports").mkdir(exist_ok=True)
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        logger.info(f"Competitive audit results saved to {filename}")

    def setup_webdriver(self) -> webdriver.Chrome:
        """Setup Chrome WebDriver for SERP scraping"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        return driver

    def scrape_google_serp(self, keyword: str, location: str = "United States") -> List[Dict]:
        """Scrape Google SERP for keyword positions"""
        logger.info(f"Scraping SERP for keyword: {keyword}")
        
        results = []
        driver = None
        
        try:
            driver = self.setup_webdriver()
            
            # Construct Google search URL
            search_query = keyword.replace(' ', '+')
            search_url = f"https://www.google.com/search?q={search_query}&hl=en&gl=us"
            
            driver.get(search_url)
            time.sleep(2)  # Wait for page load
            
            # Find organic search results
            search_results = driver.find_elements(By.CSS_SELECTOR, 'div.g')
            
            for i, result in enumerate(search_results[:20], 1):  # Top 20 results
                try:
                    # Extract URL
                    link_element = result.find_element(By.CSS_SELECTOR, 'a')
                    url = link_element.get_attribute('href')
                    
                    # Extract title
                    title_element = result.find_element(By.CSS_SELECTOR, 'h3')
                    title = title_element.text
                    
                    # Extract snippet
                    snippet = ""
                    try:
                        snippet_elements = result.find_elements(By.CSS_SELECTOR, 'span')
                        snippet = ' '.join([elem.text for elem in snippet_elements if elem.text])[:200]
                    except:
                        pass
                    
                    # Extract domain
                    domain = urlparse(url).netloc
                    
                    results.append({
                        'position': i,
                        'url': url,
                        'domain': domain,
                        'title': title,
                        'snippet': snippet,
                        'keyword': keyword
                    })
                    
                except Exception as e:
                    logger.debug(f"Error extracting result {i}: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error scraping SERP for '{keyword}': {e}")
            
        finally:
            if driver:
                driver.quit()
                
        return results

    def analyze_serp_positions(self, keywords: List[str]) -> Dict:
        """Analyze SERP positions for target keywords"""
        logger.info("Analyzing SERP positions for target keywords")
        
        serp_analysis = {
            'keywords_analyzed': len(keywords),
            'target_domain_positions': {},
            'competitor_positions': defaultdict(list),
            'keyword_difficulty': {},
            'serp_features': {},
            'top_competitors': defaultdict(int)
        }
        
        for keyword in keywords:
            # Add delay to avoid being blocked
            time.sleep(2)
            
            serp_results = self.scrape_google_serp(keyword)
            if not serp_results:
                continue
                
            self.serp_results[keyword] = serp_results
            
            # Find target domain position
            target_position = None
            for result in serp_results:
                if self.domain in result['domain']:
                    target_position = result['position']
                    break
                    
            serp_analysis['target_domain_positions'][keyword] = target_position
            
            # Analyze competitor positions
            for result in serp_results:
                domain = result['domain']
                if domain != self.domain:
                    serp_analysis['competitor_positions'][domain].append({
                        'keyword': keyword,
                        'position': result['position'],
                        'title': result['title'],
                        'url': result['url']
                    })
                    
                    # Count appearances in top 10
                    if result['position'] <= 10:
                        serp_analysis['top_competitors'][domain] += 1
                        
            # Basic keyword difficulty assessment
            serp_analysis['keyword_difficulty'][keyword] = self._assess_keyword_difficulty(serp_results)
            
        # Identify top competitors
        serp_analysis['top_competitors'] = dict(
            sorted(serp_analysis['top_competitors'].items(), key=lambda x: x[1], reverse=True)[:10]
        )
        
        return serp_analysis

    def _assess_keyword_difficulty(self, serp_results: List[Dict]) -> Dict:
        """Assess keyword difficulty based on SERP analysis"""
        difficulty = {
            'score': 50,  # Default medium difficulty
            'factors': [],
            'level': 'Medium'
        }
        
        if not serp_results:
            return difficulty
            
        # Factors that increase difficulty
        top_domains = [result['domain'] for result in serp_results[:10]]
        
        # Check for high-authority domains
        authority_domains = [
            'wikipedia.org', 'amazon.com', 'youtube.com', 'facebook.com',
            'linkedin.com', 'twitter.com', 'reddit.com', 'quora.com',
            'medium.com', 'github.com'
        ]
        
        authority_count = sum(1 for domain in top_domains if any(auth in domain for auth in authority_domains))
        
        if authority_count >= 5:
            difficulty['score'] += 20
            difficulty['factors'].append(f"{authority_count} high-authority domains in top 10")
        elif authority_count >= 3:
            difficulty['score'] += 10
            difficulty['factors'].append(f"{authority_count} high-authority domains in top 10")
            
        # Check title optimization
        optimized_titles = sum(1 for result in serp_results[:10] 
                             if any(word in result['title'].lower() 
                                   for word in result['keyword'].lower().split()))
        
        if optimized_titles >= 8:
            difficulty['score'] += 15
            difficulty['factors'].append("Most competitors have optimized titles")
            
        # Determine difficulty level
        if difficulty['score'] >= 80:
            difficulty['level'] = 'Very Hard'
        elif difficulty['score'] >= 60:
            difficulty['level'] = 'Hard'
        elif difficulty['score'] >= 40:
            difficulty['level'] = 'Medium'
        else:
            difficulty['level'] = 'Easy'
            
        return difficulty

    def fetch_competitor_content(self, competitor_url: str) -> Optional[Dict]:
        """Fetch and analyze competitor content"""
        try:
            response = self.session.get(competitor_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
                
            # Extract content
            title = soup.find('title')
            title_text = title.get_text().strip() if title else ""
            
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            meta_desc_text = meta_desc.get('content', '').strip() if meta_desc else ""
            
            # Get main content
            main_content = (soup.find('main') or 
                           soup.find('article') or 
                           soup.find('div', class_=re.compile(r'content|main|article|post')) or
                           soup.find('body'))
            
            body_text = main_content.get_text(separator=' ', strip=True) if main_content else ""
            
            # Headers
            headers = {}
            for level in range(1, 7):
                header_tags = soup.find_all(f'h{level}')
                headers[f'h{level}'] = [h.get_text().strip() for h in header_tags]
                
            # Images
            images = soup.find_all('img')
            image_count = len(images)
            images_with_alt = len([img for img in images if img.get('alt')])
            
            # Links
            internal_links = 0
            external_links = 0
            links = soup.find_all('a', href=True)
            competitor_domain = urlparse(competitor_url).netloc
            
            for link in links:
                href = link.get('href', '')
                if href.startswith('http'):
                    link_domain = urlparse(href).netloc
                    if link_domain == competitor_domain:
                        internal_links += 1
                    else:
                        external_links += 1
                        
            return {
                'url': competitor_url,
                'title': title_text,
                'title_length': len(title_text),
                'meta_description': meta_desc_text,
                'meta_description_length': len(meta_desc_text),
                'body_text': body_text,
                'word_count': len(body_text.split()) if body_text else 0,
                'headers': headers,
                'image_count': image_count,
                'images_with_alt': images_with_alt,
                'internal_links': internal_links,
                'external_links': external_links,
                'status_code': response.status_code,
                'response_time': response.elapsed.total_seconds()
            }
            
        except Exception as e:
            logger.error(f"Error fetching competitor content from {competitor_url}: {e}")
            return None

    def analyze_content_gaps(self, competitor_contents: List[Dict]) -> Dict:
        """Analyze content gaps between target site and competitors"""
        logger.info("Analyzing content gaps")
        
        # Fetch our content for comparison
        our_content = self.fetch_competitor_content(self.base_url)
        if not our_content:
            return {'error': 'Could not fetch target site content'}
            
        gap_analysis = {
            'content_length_comparison': {},
            'keyword_gaps': {},
            'topic_gaps': [],
            'structural_gaps': {},
            'recommendations': []
        }
        
        # Content length comparison
        our_word_count = our_content.get('word_count', 0)
        competitor_word_counts = [comp.get('word_count', 0) for comp in competitor_contents if comp]
        
        if competitor_word_counts:
            avg_competitor_length = sum(competitor_word_counts) / len(competitor_word_counts)
            max_competitor_length = max(competitor_word_counts)
            
            gap_analysis['content_length_comparison'] = {
                'our_word_count': our_word_count,
                'avg_competitor_length': avg_competitor_length,
                'max_competitor_length': max_competitor_length,
                'gap': avg_competitor_length - our_word_count
            }
            
            if our_word_count < avg_competitor_length * 0.8:
                gap_analysis['recommendations'].append(
                    f"Expand content by ~{int(avg_competitor_length - our_word_count)} words to match competitors"
                )
                
        # Topic analysis using TF-IDF
        all_texts = [our_content.get('body_text', '')]
        all_texts.extend([comp.get('body_text', '') for comp in competitor_contents if comp])
        
        if len(all_texts) > 1 and all(text.strip() for text in all_texts):
            try:
                vectorizer = TfidfVectorizer(
                    max_features=100,
                    stop_words='english',
                    ngram_range=(1, 2),
                    min_df=1
                )
                
                tfidf_matrix = vectorizer.fit_transform(all_texts)
                feature_names = vectorizer.get_feature_names_out()
                
                # Compare our content (index 0) with competitors
                our_scores = tfidf_matrix[0].toarray()[0]
                competitor_avg_scores = np.mean(tfidf_matrix[1:].toarray(), axis=0)
                
                # Find topics where competitors score higher
                topic_gaps = []
                for i, (our_score, comp_avg_score) in enumerate(zip(our_scores, competitor_avg_scores)):
                    if comp_avg_score > our_score * 1.5 and comp_avg_score > 0.1:
                        topic_gaps.append({
                            'topic': feature_names[i],
                            'our_score': float(our_score),
                            'competitor_avg_score': float(comp_avg_score),
                            'gap_ratio': float(comp_avg_score / (our_score + 0.001))
                        })
                        
                gap_analysis['topic_gaps'] = sorted(topic_gaps, key=lambda x: x['gap_ratio'], reverse=True)[:10]
                
                if topic_gaps:
                    top_gaps = [gap['topic'] for gap in topic_gaps[:5]]
                    gap_analysis['recommendations'].append(
                        f"Consider adding content about: {', '.join(top_gaps)}"
                    )
                    
            except Exception as e:
                logger.error(f"Error in topic analysis: {e}")
                
        # Structural comparison
        our_headers = our_content.get('headers', {})
        competitor_headers = [comp.get('headers', {}) for comp in competitor_contents if comp]
        
        our_h2_count = len(our_headers.get('h2', []))
        avg_competitor_h2 = np.mean([len(headers.get('h2', [])) for headers in competitor_headers]) if competitor_headers else 0
        
        gap_analysis['structural_gaps'] = {
            'our_h2_count': our_h2_count,
            'avg_competitor_h2': float(avg_competitor_h2),
            'image_optimization': {
                'our_images_with_alt': our_content.get('images_with_alt', 0),
                'our_total_images': our_content.get('image_count', 0),
                'avg_competitor_alt_ratio': np.mean([
                    comp.get('images_with_alt', 0) / max(comp.get('image_count', 1), 1)
                    for comp in competitor_contents if comp
                ]) if competitor_contents else 0
            }
        }
        
        if our_h2_count < avg_competitor_h2 * 0.7:
            gap_analysis['recommendations'].append(
                f"Add more H2 subheadings (competitors average {avg_competitor_h2:.1f})"
            )
            
        return gap_analysis

    def analyze_technical_comparison(self, competitors: List[str]) -> Dict:
        """Compare technical SEO factors with competitors"""
        logger.info("Analyzing technical SEO comparison")
        
        comparison = {
            'sites_analyzed': [self.base_url] + competitors,
            'technical_scores': {},
            'feature_comparison': {},
            'recommendations': []
        }
        
        all_sites = [self.base_url] + competitors
        
        for site_url in all_sites:
            domain = urlparse(site_url).netloc
            
            try:
                response = self.session.get(site_url, timeout=30)
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Technical factors to check
                technical_score = 0
                factors = {}
                
                # HTTPS
                if site_url.startswith('https'):
                    technical_score += 10
                    factors['https'] = True
                else:
                    factors['https'] = False
                    
                # Title tag
                title = soup.find('title')
                if title and title.get_text().strip():
                    technical_score += 10
                    factors['has_title'] = True
                else:
                    factors['has_title'] = False
                    
                # Meta description
                meta_desc = soup.find('meta', attrs={'name': 'description'})
                if meta_desc and meta_desc.get('content'):
                    technical_score += 10
                    factors['has_meta_description'] = True
                else:
                    factors['has_meta_description'] = False
                    
                # Canonical tag
                canonical = soup.find('link', attrs={'rel': 'canonical'})
                if canonical:
                    technical_score += 10
                    factors['has_canonical'] = True
                else:
                    factors['has_canonical'] = False
                    
                # H1 tag
                h1_tags = soup.find_all('h1')
                if len(h1_tags) == 1:
                    technical_score += 10
                    factors['h1_optimization'] = 'optimal'
                elif len(h1_tags) > 1:
                    factors['h1_optimization'] = 'multiple'
                else:
                    factors['h1_optimization'] = 'missing'
                    
                # Open Graph tags
                og_tags = soup.find_all('meta', attrs={'property': re.compile(r'^og:')})
                if len(og_tags) >= 3:
                    technical_score += 10
                    factors['has_og_tags'] = True
                else:
                    factors['has_og_tags'] = False
                    
                # Schema markup
                json_ld = soup.find_all('script', attrs={'type': 'application/ld+json'})
                microdata = soup.find_all(attrs={'itemtype': True})
                if json_ld or microdata:
                    technical_score += 10
                    factors['has_schema'] = True
                else:
                    factors['has_schema'] = False
                    
                # Viewport meta tag
                viewport = soup.find('meta', attrs={'name': 'viewport'})
                if viewport:
                    technical_score += 10
                    factors['mobile_optimized'] = True
                else:
                    factors['mobile_optimized'] = False
                    
                # Alt texts on images
                images = soup.find_all('img')
                images_with_alt = [img for img in images if img.get('alt')]
                alt_ratio = len(images_with_alt) / len(images) if images else 1
                
                if alt_ratio >= 0.8:
                    technical_score += 10
                    factors['image_optimization'] = 'good'
                elif alt_ratio >= 0.5:
                    technical_score += 5
                    factors['image_optimization'] = 'fair'
                else:
                    factors['image_optimization'] = 'poor'
                    
                # Response time
                response_time = response.elapsed.total_seconds()
                if response_time < 2:
                    technical_score += 10
                    factors['fast_loading'] = True
                elif response_time < 4:
                    technical_score += 5
                    factors['fast_loading'] = False
                else:
                    factors['fast_loading'] = False
                    
                comparison['technical_scores'][domain] = technical_score
                comparison['feature_comparison'][domain] = factors
                
            except Exception as e:
                logger.error(f"Error analyzing {site_url}: {e}")
                comparison['technical_scores'][domain] = 0
                comparison['feature_comparison'][domain] = {'error': str(e)}
                
        # Generate recommendations based on comparison
        our_score = comparison['technical_scores'].get(self.domain, 0)
        competitor_scores = [score for domain, score in comparison['technical_scores'].items() 
                           if domain != self.domain]
        
        if competitor_scores:
            avg_competitor_score = sum(competitor_scores) / len(competitor_scores)
            max_competitor_score = max(competitor_scores)
            
            if our_score < avg_competitor_score:
                comparison['recommendations'].append(
                    f"Technical SEO score ({our_score}) below competitor average ({avg_competitor_score:.1f})"
                )
                
            # Specific recommendations based on feature comparison
            our_features = comparison['feature_comparison'].get(self.domain, {})
            
            for feature, value in our_features.items():
                if not value and feature != 'error':
                    # Count how many competitors have this feature
                    competitors_with_feature = sum(
                        1 for domain, features in comparison['feature_comparison'].items()
                        if domain != self.domain and features.get(feature)
                    )
                    
                    if competitors_with_feature >= len(competitors) * 0.5:
                        comparison['recommendations'].append(f"Implement {feature} (most competitors have this)")
                        
        return comparison

    def run_competitive_analysis(self, competitors: List[str] = None) -> Dict:
        """Run comprehensive competitive analysis"""
        logger.info(f"Starting competitive analysis for {self.base_url}")
        
        start_time = time.time()
        competitors = competitors or self.competitors
        
        if not competitors:
            logger.warning("No competitors specified, attempting to identify from SERP data")
            
        audit_results = {
            'target_domain': self.domain,
            'target_url': self.base_url,
            'competitors_analyzed': competitors,
            'audit_timestamp': datetime.now().isoformat(),
            'serp_analysis': {},
            'content_gaps': {},
            'technical_comparison': {},
            'summary': {
                'avg_serp_position': 0,
                'keywords_ranking': 0,
                'top_competitors_identified': [],
                'critical_gaps': [],
                'opportunities': []
            }
        }
        
        # SERP analysis
        if self.target_keywords:
            logger.info(f"Analyzing SERP positions for {len(self.target_keywords)} keywords")
            audit_results['serp_analysis'] = self.analyze_serp_positions(self.target_keywords)
            
            # Update competitors list if not provided
            if not competitors:
                top_serp_competitors = list(audit_results['serp_analysis']['top_competitors'].keys())[:5]
                competitors = [f"https://{domain}" for domain in top_serp_competitors]
                audit_results['competitors_analyzed'] = competitors
                
        # Content gap analysis
        if competitors:
            logger.info("Fetching competitor content for gap analysis")
            competitor_contents = []
            for comp_url in competitors:
                content = self.fetch_competitor_content(comp_url)
                if content:
                    competitor_contents.append(content)
                    
            if competitor_contents:
                audit_results['content_gaps'] = self.analyze_content_gaps(competitor_contents)
                
        # Technical comparison
        if competitors:
            competitor_domains = [urlparse(url).netloc for url in competitors]
            competitor_urls = [f"https://{domain}" for domain in competitor_domains]
            audit_results['technical_comparison'] = self.analyze_technical_comparison(competitor_urls)
            
        # Generate summary
        self._generate_competitive_summary(audit_results)
        
        # Calculate audit duration
        audit_duration = time.time() - start_time
        audit_results['audit_duration_seconds'] = audit_duration
        
        logger.info(f"Competitive analysis completed in {audit_duration:.2f} seconds")
        
        # Save results
        self.save_results(audit_results)
        
        return audit_results

    def _generate_competitive_summary(self, results: Dict) -> None:
        """Generate competitive analysis summary"""
        summary = results['summary']
        
        # SERP analysis summary
        serp_data = results.get('serp_analysis', {})
        if serp_data:
            positions = list(serp_data.get('target_domain_positions', {}).values())
            ranking_positions = [p for p in positions if p is not None]
            
            if ranking_positions:
                summary['avg_serp_position'] = sum(ranking_positions) / len(ranking_positions)
                summary['keywords_ranking'] = len(ranking_positions)
            else:
                summary['avg_serp_position'] = 0
                summary['keywords_ranking'] = 0
                
            summary['top_competitors_identified'] = list(serp_data.get('top_competitors', {}).keys())[:5]
            
        # Content gaps summary
        content_gaps = results.get('content_gaps', {})
        if content_gaps.get('recommendations'):
            summary['critical_gaps'] = content_gaps['recommendations'][:3]
            
        # Technical opportunities
        tech_comparison = results.get('technical_comparison', {})
        if tech_comparison.get('recommendations'):
            summary['opportunities'] = tech_comparison['recommendations'][:3]

def main():
    """Main function for running competitive analysis"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python competitive-audit.py <URL> [competitor1,competitor2,...]")
        sys.exit(1)
        
    url = sys.argv[1]
    competitors = []
    
    if len(sys.argv) > 2:
        competitors = [comp.strip() for comp in sys.argv[2].split(',')]
        
    # Create analyzer and run analysis
    analyzer = CompetitiveAnalyzer(url, competitors)
    results = analyzer.run_competitive_analysis()
    
    # Print summary
    print("\n" + "="*50)
    print("COMPETITIVE ANALYSIS SUMMARY")
    print("="*50)
    print(f"Target Domain: {results['target_domain']}")
    print(f"Competitors Analyzed: {len(results['competitors_analyzed'])}")
    print(f"Average SERP Position: {results['summary']['avg_serp_position']:.1f}" if results['summary']['avg_serp_position'] > 0 else "No rankings found")
    print(f"Keywords Ranking: {results['summary']['keywords_ranking']}")
    
    if results['summary']['top_competitors_identified']:
        print(f"\nTop Competitors Identified:")
        for comp in results['summary']['top_competitors_identified'][:5]:
            print(f"  - {comp}")
            
    if results['summary']['critical_gaps']:
        print(f"\nCritical Content Gaps:")
        for gap in results['summary']['critical_gaps']:
            print(f"  - {gap}")
            
    if results['summary']['opportunities']:
        print(f"\nTechnical Opportunities:")
        for opp in results['summary']['opportunities']:
            print(f"  - {opp}")
            
    print(f"\nAnalysis Duration: {results['audit_duration_seconds']:.2f}s")
    print(f"\nDetailed results saved to reports/")

if __name__ == "__main__":
    main()