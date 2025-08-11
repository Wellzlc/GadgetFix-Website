#!/usr/bin/env python3
"""
Content SEO Analysis Script
===========================

Comprehensive content analysis including:
- Keyword density and semantic analysis
- Title tag optimization
- Meta description optimization
- Content readability analysis
- Header tag optimization
- Image alt text analysis
- Content gap analysis
- Featured snippet optimization opportunities
- E-E-A-T assessment (Experience, Expertise, Authoritativeness, Trustworthiness)
"""

import json
import logging
import re
import time
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse

import nltk
import requests
import textstat
from bs4 import BeautifulSoup, Comment
from sklearn.feature_extraction.text import TfidfVectorizer
from textblob import TextBlob
import yake

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/content-audit.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ContentSEOAnalyzer:
    def __init__(self, base_url: str, config: Dict = None):
        self.base_url = base_url.rstrip('/')
        self.domain = urlparse(base_url).netloc
        self.config = config or self.load_config()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.config.get('general', {}).get('user_agent', 
                'SEO-Audit-Bot/1.0 (Ultimate SEO Audit System)')
        })
        self.stop_words = set(stopwords.words('english'))
        self.target_keywords = self.load_target_keywords()
        
    @staticmethod
    def load_config() -> Dict:
        """Load configuration from file"""
        try:
            with open('config/audit-settings.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("Config file not found, using default settings")
            return {
                "seo": {
                    "title_length": {"min": 30, "max": 60},
                    "meta_description_length": {"min": 150, "max": 160},
                    "content_length": {"min": 300, "recommended": 1000}
                }
            }
    
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
        filename = f"reports/content_audit_{timestamp}.json"
        
        Path("reports").mkdir(exist_ok=True)
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        logger.info(f"Content audit results saved to {filename}")

    def fetch_page_content(self, url: str) -> Tuple[Optional[BeautifulSoup], Optional[str]]:
        """Fetch and parse page content"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            return soup, response.text
            
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            return None, None

    def extract_text_content(self, soup: BeautifulSoup) -> Dict:
        """Extract and clean text content from HTML"""
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
            
        # Remove comments
        comments = soup.findAll(text=lambda text: isinstance(text, Comment))
        for comment in comments:
            comment.extract()
            
        # Extract different content areas
        content_areas = {
            'title': '',
            'meta_description': '',
            'h1': [],
            'h2': [],
            'h3': [],
            'h4': [],
            'h5': [],
            'h6': [],
            'body_text': '',
            'alt_texts': [],
            'link_texts': []
        }
        
        # Title
        title_tag = soup.find('title')
        if title_tag:
            content_areas['title'] = title_tag.get_text().strip()
            
        # Meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            content_areas['meta_description'] = meta_desc.get('content', '').strip()
            
        # Headers
        for level in range(1, 7):
            headers = soup.find_all(f'h{level}')
            content_areas[f'h{level}'] = [h.get_text().strip() for h in headers]
            
        # Body text (main content)
        # Try to find main content area
        main_content = (soup.find('main') or 
                       soup.find('article') or 
                       soup.find('div', class_=re.compile(r'content|main|article|post')) or
                       soup.find('body'))
        
        if main_content:
            # Remove navigation, footer, sidebar elements
            for element in main_content.find_all(['nav', 'footer', 'aside', 'header']):
                element.decompose()
                
            content_areas['body_text'] = main_content.get_text(separator=' ', strip=True)
            
        # Alt texts
        images = soup.find_all('img')
        content_areas['alt_texts'] = [img.get('alt', '').strip() for img in images if img.get('alt')]
        
        # Link texts
        links = soup.find_all('a')
        content_areas['link_texts'] = [link.get_text().strip() for link in links if link.get_text().strip()]
        
        return content_areas

    def analyze_keyword_density(self, text: str, target_keywords: List[str] = None) -> Dict:
        """Analyze keyword density and distribution"""
        if not text:
            return {'error': 'No text content found'}
            
        # Clean text
        text = re.sub(r'[^\w\s]', ' ', text.lower())
        words = word_tokenize(text)
        words = [word for word in words if word not in self.stop_words and len(word) > 2]
        
        total_words = len(words)
        word_count = Counter(words)
        
        analysis = {
            'total_words': total_words,
            'unique_words': len(word_count),
            'top_keywords': word_count.most_common(20),
            'target_keyword_analysis': {},
            'keyword_density': {}
        }
        
        # Calculate density for all words
        for word, count in word_count.most_common(50):
            density = (count / total_words) * 100
            analysis['keyword_density'][word] = {
                'count': count,
                'density': density,
                'recommendation': self._get_density_recommendation(density)
            }
            
        # Analyze target keywords
        keywords_to_analyze = target_keywords or self.target_keywords
        for keyword in keywords_to_analyze:
            keyword_lower = keyword.lower()
            
            # Exact match count
            exact_matches = text.lower().count(keyword_lower)
            exact_density = (exact_matches / total_words) * 100 if total_words > 0 else 0
            
            # Partial matches (individual words)
            keyword_words = keyword_lower.split()
            partial_matches = sum(word_count.get(word, 0) for word in keyword_words)
            
            analysis['target_keyword_analysis'][keyword] = {
                'exact_matches': exact_matches,
                'exact_density': exact_density,
                'partial_matches': partial_matches,
                'recommendation': self._get_target_keyword_recommendation(exact_density),
                'placement_analysis': self._analyze_keyword_placement(keyword_lower, text)
            }
            
        return analysis

    def _get_density_recommendation(self, density: float) -> str:
        """Get recommendation for keyword density"""
        if density < 0.5:
            return "Consider increasing usage"
        elif density > 3.0:
            return "Density too high - risk of over-optimization"
        elif density > 1.5:
            return "Good density but monitor closely"
        else:
            return "Good keyword density"

    def _get_target_keyword_recommendation(self, density: float) -> str:
        """Get recommendation for target keyword density"""
        if density == 0:
            return "Keyword not found - add naturally throughout content"
        elif density < 1.0:
            return "Low density - consider adding more instances"
        elif density > 3.0:
            return "High density - risk of keyword stuffing"
        else:
            return "Good target keyword density"

    def _analyze_keyword_placement(self, keyword: str, text: str) -> Dict:
        """Analyze keyword placement in content"""
        text_lower = text.lower()
        sentences = sent_tokenize(text)
        total_sentences = len(sentences)
        
        placement = {
            'in_first_100_words': False,
            'in_last_100_words': False,
            'first_occurrence_position': -1,
            'sentence_distribution': []
        }
        
        words = text_lower.split()
        if len(words) >= 100:
            first_100 = ' '.join(words[:100])
            last_100 = ' '.join(words[-100:])
            
            placement['in_first_100_words'] = keyword in first_100
            placement['in_last_100_words'] = keyword in last_100
            
        # Find first occurrence
        first_pos = text_lower.find(keyword)
        if first_pos != -1:
            placement['first_occurrence_position'] = first_pos
            
        # Sentence distribution
        for i, sentence in enumerate(sentences):
            if keyword in sentence.lower():
                placement['sentence_distribution'].append(i / total_sentences)
                
        return placement

    def analyze_readability(self, text: str) -> Dict:
        """Analyze content readability using multiple metrics"""
        if not text or len(text.split()) < 10:
            return {'error': 'Insufficient text for readability analysis'}
            
        readability = {
            'flesch_reading_ease': textstat.flesch_reading_ease(text),
            'flesch_kincaid_grade': textstat.flesch_kincaid_grade(text),
            'gunning_fog': textstat.gunning_fog(text),
            'automated_readability_index': textstat.automated_readability_index(text),
            'coleman_liau_index': textstat.coleman_liau_index(text),
            'difficult_words': textstat.difficult_words(text),
            'reading_time_minutes': textstat.reading_time(text, ms_per_char=14.69),
            'sentences': textstat.sentence_count(text),
            'words': len(text.split()),
            'characters': len(text),
            'syllables': textstat.syllable_count(text),
            'polysyllables': textstat.polysyllabcount(text)
        }
        
        # Interpret scores
        fre_score = readability['flesch_reading_ease']
        if fre_score >= 90:
            readability['reading_level'] = 'Very Easy (5th grade)'
        elif fre_score >= 80:
            readability['reading_level'] = 'Easy (6th grade)'
        elif fre_score >= 70:
            readability['reading_level'] = 'Fairly Easy (7th grade)'
        elif fre_score >= 60:
            readability['reading_level'] = 'Standard (8th-9th grade)'
        elif fre_score >= 50:
            readability['reading_level'] = 'Fairly Difficult (10th-12th grade)'
        elif fre_score >= 30:
            readability['reading_level'] = 'Difficult (College level)'
        else:
            readability['reading_level'] = 'Very Difficult (Graduate level)'
            
        # Recommendations
        readability['recommendations'] = []
        
        if fre_score < 60:
            readability['recommendations'].append("Consider simplifying sentences and using more common words")
            
        if readability['flesch_kincaid_grade'] > 12:
            readability['recommendations'].append("Content may be too complex for general audience")
            
        if readability['difficult_words'] > readability['words'] * 0.1:
            readability['recommendations'].append("High number of difficult words - consider simpler alternatives")
            
        avg_sentence_length = readability['words'] / readability['sentences'] if readability['sentences'] > 0 else 0
        if avg_sentence_length > 20:
            readability['recommendations'].append("Average sentence length is high - consider shorter sentences")
            
        return readability

    def analyze_content_structure(self, content_areas: Dict) -> Dict:
        """Analyze content structure and organization"""
        structure = {
            'title_analysis': self._analyze_title(content_areas['title']),
            'meta_description_analysis': self._analyze_meta_description(content_areas['meta_description']),
            'header_hierarchy': self._analyze_header_hierarchy(content_areas),
            'content_length': self._analyze_content_length(content_areas['body_text']),
            'image_optimization': self._analyze_image_alt_texts(content_areas['alt_texts']),
            'internal_linking': self._analyze_link_texts(content_areas['link_texts'])
        }
        
        return structure

    def _analyze_title(self, title: str) -> Dict:
        """Analyze page title optimization"""
        analysis = {
            'title': title,
            'length': len(title),
            'character_count': len(title),
            'word_count': len(title.split()) if title else 0,
            'issues': [],
            'recommendations': []
        }
        
        title_config = self.config.get('seo', {}).get('title_length', {})
        min_length = title_config.get('min', 30)
        max_length = title_config.get('max', 60)
        
        if not title:
            analysis['issues'].append("Missing title tag")
            analysis['recommendations'].append("Add a descriptive title tag")
        else:
            if len(title) < min_length:
                analysis['issues'].append(f"Title too short ({len(title)} chars, recommended: {min_length}-{max_length})")
                analysis['recommendations'].append("Expand title with descriptive keywords")
            elif len(title) > max_length:
                analysis['issues'].append(f"Title too long ({len(title)} chars, recommended: {min_length}-{max_length})")
                analysis['recommendations'].append("Shorten title to avoid truncation in search results")
                
            # Check for target keywords in title
            title_lower = title.lower()
            keywords_in_title = [kw for kw in self.target_keywords if kw.lower() in title_lower]
            
            if self.target_keywords and not keywords_in_title:
                analysis['recommendations'].append("Consider including target keywords in title")
            else:
                analysis['keywords_found'] = keywords_in_title
                
        return analysis

    def _analyze_meta_description(self, meta_desc: str) -> Dict:
        """Analyze meta description optimization"""
        analysis = {
            'meta_description': meta_desc,
            'length': len(meta_desc) if meta_desc else 0,
            'word_count': len(meta_desc.split()) if meta_desc else 0,
            'issues': [],
            'recommendations': []
        }
        
        desc_config = self.config.get('seo', {}).get('meta_description_length', {})
        min_length = desc_config.get('min', 150)
        max_length = desc_config.get('max', 160)
        
        if not meta_desc:
            analysis['issues'].append("Missing meta description")
            analysis['recommendations'].append("Add a compelling meta description")
        else:
            if len(meta_desc) < min_length:
                analysis['issues'].append(f"Meta description too short ({len(meta_desc)} chars)")
                analysis['recommendations'].append("Expand meta description with more details")
            elif len(meta_desc) > max_length:
                analysis['issues'].append(f"Meta description too long ({len(meta_desc)} chars)")
                analysis['recommendations'].append("Shorten meta description to avoid truncation")
                
            # Check for target keywords
            desc_lower = meta_desc.lower()
            keywords_in_desc = [kw for kw in self.target_keywords if kw.lower() in desc_lower]
            
            if self.target_keywords and not keywords_in_desc:
                analysis['recommendations'].append("Consider including target keywords in meta description")
            else:
                analysis['keywords_found'] = keywords_in_desc
                
        return analysis

    def _analyze_header_hierarchy(self, content_areas: Dict) -> Dict:
        """Analyze header tag structure and hierarchy"""
        analysis = {
            'h1_count': len(content_areas.get('h1', [])),
            'h1_text': content_areas.get('h1', []),
            'header_structure': [],
            'issues': [],
            'recommendations': []
        }
        
        # Build header structure
        for level in range(1, 7):
            headers = content_areas.get(f'h{level}', [])
            for header_text in headers:
                analysis['header_structure'].append({
                    'level': level,
                    'text': header_text,
                    'length': len(header_text),
                    'word_count': len(header_text.split())
                })
                
        # Check H1 issues
        if analysis['h1_count'] == 0:
            analysis['issues'].append("No H1 tag found")
            analysis['recommendations'].append("Add an H1 tag with primary keyword")
        elif analysis['h1_count'] > 1:
            analysis['issues'].append(f"Multiple H1 tags found ({analysis['h1_count']})")
            analysis['recommendations'].append("Use only one H1 tag per page")
            
        # Check for keyword optimization in headers
        if self.target_keywords and analysis['header_structure']:
            headers_with_keywords = []
            all_header_text = ' '.join([h['text'].lower() for h in analysis['header_structure']])
            
            for keyword in self.target_keywords:
                if keyword.lower() in all_header_text:
                    headers_with_keywords.append(keyword)
                    
            if not headers_with_keywords:
                analysis['recommendations'].append("Consider including target keywords in header tags")
            else:
                analysis['keywords_in_headers'] = headers_with_keywords
                
        return analysis

    def _analyze_content_length(self, body_text: str) -> Dict:
        """Analyze content length and depth"""
        analysis = {
            'word_count': len(body_text.split()) if body_text else 0,
            'character_count': len(body_text),
            'paragraph_count': len(body_text.split('\n\n')) if body_text else 0,
            'issues': [],
            'recommendations': []
        }
        
        content_config = self.config.get('seo', {}).get('content_length', {})
        min_length = content_config.get('min', 300)
        recommended_length = content_config.get('recommended', 1000)
        
        word_count = analysis['word_count']
        
        if word_count < min_length:
            analysis['issues'].append(f"Content too short ({word_count} words, minimum: {min_length})")
            analysis['recommendations'].append("Add more comprehensive content")
        elif word_count < recommended_length:
            analysis['recommendations'].append(f"Consider expanding content (current: {word_count}, recommended: {recommended_length}+)")
            
        # Content depth analysis
        if word_count > 0:
            avg_paragraph_length = word_count / analysis['paragraph_count'] if analysis['paragraph_count'] > 0 else word_count
            
            if avg_paragraph_length > 100:
                analysis['recommendations'].append("Consider breaking up long paragraphs for better readability")
            elif avg_paragraph_length < 20:
                analysis['recommendations'].append("Consider combining short paragraphs for better flow")
                
        return analysis

    def _analyze_image_alt_texts(self, alt_texts: List[str]) -> Dict:
        """Analyze image alt text optimization"""
        analysis = {
            'total_alt_texts': len(alt_texts),
            'empty_alts': 0,
            'good_alts': 0,
            'too_long_alts': 0,
            'keyword_optimized_alts': 0,
            'recommendations': []
        }
        
        for alt_text in alt_texts:
            if not alt_text or alt_text.strip() == '':
                analysis['empty_alts'] += 1
            elif len(alt_text) > 125:
                analysis['too_long_alts'] += 1
            else:
                analysis['good_alts'] += 1
                
                # Check for keyword optimization
                alt_lower = alt_text.lower()
                if any(keyword.lower() in alt_lower for keyword in self.target_keywords):
                    analysis['keyword_optimized_alts'] += 1
                    
        if analysis['empty_alts'] > 0:
            analysis['recommendations'].append(f"{analysis['empty_alts']} images missing alt text")
            
        if analysis['too_long_alts'] > 0:
            analysis['recommendations'].append(f"{analysis['too_long_alts']} alt texts too long (>125 chars)")
            
        if self.target_keywords and analysis['keyword_optimized_alts'] == 0:
            analysis['recommendations'].append("Consider optimizing some alt texts with target keywords")
            
        return analysis

    def _analyze_link_texts(self, link_texts: List[str]) -> Dict:
        """Analyze internal link anchor text optimization"""
        analysis = {
            'total_links': len(link_texts),
            'generic_anchors': 0,
            'keyword_optimized_anchors': 0,
            'generic_phrases': ['click here', 'read more', 'learn more', 'here', 'link', 'more'],
            'recommendations': []
        }
        
        for link_text in link_texts:
            link_lower = link_text.lower().strip()
            
            if link_lower in analysis['generic_phrases']:
                analysis['generic_anchors'] += 1
            elif any(keyword.lower() in link_lower for keyword in self.target_keywords):
                analysis['keyword_optimized_anchors'] += 1
                
        if analysis['generic_anchors'] > 0:
            analysis['recommendations'].append(f"{analysis['generic_anchors']} generic anchor texts found - use descriptive text instead")
            
        if self.target_keywords and analysis['keyword_optimized_anchors'] == 0:
            analysis['recommendations'].append("Consider using target keywords in some anchor texts")
            
        return analysis

    def extract_key_phrases(self, text: str, num_phrases: int = 10) -> List[Dict]:
        """Extract key phrases using YAKE algorithm"""
        if not text or len(text.split()) < 20:
            return []
            
        try:
            # Initialize YAKE
            kw_extractor = yake.KeywordExtractor(
                lan="en",
                n=3,  # n-gram size
                dedupLim=0.7,
                top=num_phrases,
                features=None
            )
            
            keywords = kw_extractor.extract_keywords(text)
            
            return [
                {
                    'phrase': phrase,
                    'relevance_score': 1 / (1 + score),  # Convert to 0-1 scale
                    'yake_score': score
                }
                for score, phrase in keywords
            ]
            
        except Exception as e:
            logger.error(f"Error extracting key phrases: {e}")
            return []

    def analyze_semantic_content(self, text: str) -> Dict:
        """Analyze semantic content and topic modeling"""
        if not text or len(text.split()) < 50:
            return {'error': 'Insufficient text for semantic analysis'}
            
        analysis = {
            'key_phrases': self.extract_key_phrases(text),
            'sentiment': self._analyze_sentiment(text),
            'topics': self._extract_topics(text),
            'semantic_keywords': self._find_semantic_keywords(text)
        }
        
        return analysis

    def _analyze_sentiment(self, text: str) -> Dict:
        """Analyze content sentiment"""
        try:
            blob = TextBlob(text)
            sentiment = blob.sentiment
            
            # Interpret polarity
            if sentiment.polarity > 0.1:
                sentiment_label = "Positive"
            elif sentiment.polarity < -0.1:
                sentiment_label = "Negative"
            else:
                sentiment_label = "Neutral"
                
            # Interpret subjectivity
            if sentiment.subjectivity > 0.5:
                subjectivity_label = "Subjective"
            else:
                subjectivity_label = "Objective"
                
            return {
                'polarity': sentiment.polarity,
                'subjectivity': sentiment.subjectivity,
                'sentiment_label': sentiment_label,
                'subjectivity_label': subjectivity_label
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return {'error': str(e)}

    def _extract_topics(self, text: str) -> List[str]:
        """Extract main topics from text (simplified approach)"""
        try:
            # Use TF-IDF to find important terms
            vectorizer = TfidfVectorizer(
                max_features=20,
                stop_words='english',
                ngram_range=(1, 2),
                min_df=1
            )
            
            tfidf_matrix = vectorizer.fit_transform([text])
            feature_names = vectorizer.get_feature_names_out()
            tfidf_scores = tfidf_matrix.toarray()[0]
            
            # Get top topics
            topic_scores = list(zip(feature_names, tfidf_scores))
            topic_scores.sort(key=lambda x: x[1], reverse=True)
            
            return [topic for topic, score in topic_scores[:10] if score > 0]
            
        except Exception as e:
            logger.error(f"Error extracting topics: {e}")
            return []

    def _find_semantic_keywords(self, text: str) -> List[str]:
        """Find semantically related keywords"""
        # This is a simplified implementation
        # In production, you might use word embeddings or LSA
        try:
            blob = TextBlob(text)
            words = [word.lower() for word in blob.words if word.isalpha() and len(word) > 3]
            word_freq = Counter(words)
            
            # Remove common stop words
            filtered_words = {word: freq for word, freq in word_freq.items() 
                            if word not in self.stop_words}
            
            return list(dict(Counter(filtered_words).most_common(15)).keys())
            
        except Exception as e:
            logger.error(f"Error finding semantic keywords: {e}")
            return []

    def run_full_content_audit(self, url: str) -> Dict:
        """Run comprehensive content SEO audit"""
        logger.info(f"Starting content audit for {url}")
        
        start_time = time.time()
        
        # Fetch page content
        soup, raw_html = self.fetch_page_content(url)
        if not soup:
            return {'error': 'Failed to fetch page content'}
            
        # Extract content areas
        content_areas = self.extract_text_content(soup)
        
        # Run all analyses
        audit_results = {
            'url': url,
            'domain': self.domain,
            'audit_timestamp': datetime.now().isoformat(),
            'content_structure': self.analyze_content_structure(content_areas),
            'keyword_analysis': self.analyze_keyword_density(content_areas['body_text'], self.target_keywords),
            'readability': self.analyze_readability(content_areas['body_text']),
            'semantic_analysis': self.analyze_semantic_content(content_areas['body_text']),
            'summary': {
                'total_words': 0,
                'readability_score': 0,
                'seo_optimization_score': 0,
                'priority_issues': [],
                'quick_wins': []
            }
        }
        
        # Generate summary
        self._generate_content_summary(audit_results)
        
        # Calculate audit duration
        audit_duration = time.time() - start_time
        audit_results['audit_duration_seconds'] = audit_duration
        
        logger.info(f"Content audit completed in {audit_duration:.2f} seconds")
        
        # Save results
        self.save_results(audit_results)
        
        return audit_results

    def _generate_content_summary(self, results: Dict) -> None:
        """Generate content audit summary"""
        summary = results['summary']
        
        # Basic metrics
        if results.get('keyword_analysis', {}).get('total_words'):
            summary['total_words'] = results['keyword_analysis']['total_words']
            
        if results.get('readability', {}).get('flesch_reading_ease'):
            summary['readability_score'] = results['readability']['flesch_reading_ease']
            
        # Collect issues
        priority_issues = []
        quick_wins = []
        
        # Title issues
        title_issues = results.get('content_structure', {}).get('title_analysis', {}).get('issues', [])
        priority_issues.extend(title_issues)
        
        # Meta description issues
        meta_issues = results.get('content_structure', {}).get('meta_description_analysis', {}).get('issues', [])
        priority_issues.extend(meta_issues)
        
        # Header issues
        header_issues = results.get('content_structure', {}).get('header_hierarchy', {}).get('issues', [])
        priority_issues.extend(header_issues)
        
        # Content length issues
        content_issues = results.get('content_structure', {}).get('content_length', {}).get('issues', [])
        priority_issues.extend(content_issues)
        
        # Image optimization quick wins
        img_recs = results.get('content_structure', {}).get('image_optimization', {}).get('recommendations', [])
        quick_wins.extend(img_recs)
        
        # Readability recommendations
        readability_recs = results.get('readability', {}).get('recommendations', [])
        quick_wins.extend(readability_recs)
        
        summary['priority_issues'] = priority_issues[:10]  # Top 10
        summary['quick_wins'] = quick_wins[:10]  # Top 10
        
        # Calculate SEO optimization score (simplified)
        score_factors = []
        
        if not title_issues:
            score_factors.append(20)
        if not meta_issues:
            score_factors.append(20)
        if not header_issues:
            score_factors.append(15)
        if not content_issues:
            score_factors.append(15)
        if summary['readability_score'] >= 60:
            score_factors.append(15)
        if results.get('keyword_analysis', {}).get('target_keyword_analysis'):
            score_factors.append(15)
            
        summary['seo_optimization_score'] = sum(score_factors)

def main():
    """Main function for running content SEO audit"""
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python content-audit.py <URL>")
        sys.exit(1)
        
    url = sys.argv[1]
    
    # Create analyzer and run audit
    analyzer = ContentSEOAnalyzer(url)
    results = analyzer.run_full_content_audit(url)
    
    # Print summary
    print("\n" + "="*50)
    print("CONTENT SEO AUDIT SUMMARY")
    print("="*50)
    print(f"URL: {results['url']}")
    print(f"Total Words: {results['summary']['total_words']}")
    print(f"SEO Optimization Score: {results['summary']['seo_optimization_score']}/100")
    print(f"Readability Score: {results['summary']['readability_score']:.1f} (Flesch Reading Ease)")
    
    if results.get('readability', {}).get('reading_level'):
        print(f"Reading Level: {results['readability']['reading_level']}")
        
    print(f"\nPriority Issues: {len(results['summary']['priority_issues'])}")
    for issue in results['summary']['priority_issues'][:5]:
        print(f"  - {issue}")
        
    print(f"\nQuick Wins: {len(results['summary']['quick_wins'])}")
    for win in results['summary']['quick_wins'][:5]:
        print(f"  - {win}")
        
    if results.get('semantic_analysis', {}).get('key_phrases'):
        print(f"\nTop Key Phrases:")
        for phrase_data in results['semantic_analysis']['key_phrases'][:5]:
            print(f"  - {phrase_data['phrase']} (relevance: {phrase_data['relevance_score']:.2f})")
            
    print(f"\nAudit Duration: {results['audit_duration_seconds']:.2f}s")
    print(f"\nDetailed results saved to reports/")

if __name__ == "__main__":
    main()