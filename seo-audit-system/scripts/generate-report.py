#!/usr/bin/env python3
"""
SEO Audit Report Generation Script
==================================

Generates comprehensive HTML and PDF reports from audit data:
- Executive summary dashboard
- Detailed technical reports
- Actionable recommendations
- Performance visualizations
- Competitive analysis charts
- Progress tracking
"""

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import matplotlib.pyplot as plt
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import plotly.offline as pyo
from jinja2 import Environment, FileSystemLoader
import seaborn as sns
from weasyprint import HTML, CSS

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/report-generation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Set matplotlib style
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class SEOReportGenerator:
    def __init__(self, reports_dir: str = "reports"):
        self.reports_dir = Path(reports_dir)
        self.templates_dir = Path("templates")
        self.data_dir = Path("data")
        
        # Ensure directories exist
        self.reports_dir.mkdir(exist_ok=True)
        self.templates_dir.mkdir(exist_ok=True)
        self.data_dir.mkdir(exist_ok=True)
        
        # Setup Jinja2 environment
        self.jinja_env = Environment(loader=FileSystemLoader(self.templates_dir))
        
    def load_audit_data(self, technical_file: str = None, performance_file: str = None,
                       content_file: str = None, competitive_file: str = None) -> Dict:
        """Load audit data from JSON files"""
        audit_data = {
            'technical': {},
            'performance': {},
            'content': {},
            'competitive': {},
            'timestamp': datetime.now().isoformat(),
            'available_audits': []
        }
        
        # Load technical audit data
        if technical_file and Path(technical_file).exists():
            try:
                with open(technical_file, 'r') as f:
                    audit_data['technical'] = json.load(f)
                    audit_data['available_audits'].append('technical')
                    logger.info(f"Loaded technical audit data from {technical_file}")
            except Exception as e:
                logger.error(f"Error loading technical data: {e}")
                
        # Load performance audit data
        if performance_file and Path(performance_file).exists():
            try:
                with open(performance_file, 'r') as f:
                    audit_data['performance'] = json.load(f)
                    audit_data['available_audits'].append('performance')
                    logger.info(f"Loaded performance audit data from {performance_file}")
            except Exception as e:
                logger.error(f"Error loading performance data: {e}")
                
        # Load content audit data
        if content_file and Path(content_file).exists():
            try:
                with open(content_file, 'r') as f:
                    audit_data['content'] = json.load(f)
                    audit_data['available_audits'].append('content')
                    logger.info(f"Loaded content audit data from {content_file}")
            except Exception as e:
                logger.error(f"Error loading content data: {e}")
                
        # Load competitive audit data
        if competitive_file and Path(competitive_file).exists():
            try:
                with open(competitive_file, 'r') as f:
                    audit_data['competitive'] = json.load(f)
                    audit_data['available_audits'].append('competitive')
                    logger.info(f"Loaded competitive audit data from {competitive_file}")
            except Exception as e:
                logger.error(f"Error loading competitive data: {e}")
                
        return audit_data

    def find_latest_audit_files(self) -> Dict:
        """Find the most recent audit files"""
        audit_files = {
            'technical': None,
            'performance': None,
            'content': None,
            'competitive': None
        }
        
        for audit_type in audit_files.keys():
            pattern = f"{audit_type}_audit_*.json"
            matching_files = list(self.reports_dir.glob(pattern))
            
            if matching_files:
                # Sort by modification time, get most recent
                latest_file = max(matching_files, key=lambda x: x.stat().st_mtime)
                audit_files[audit_type] = str(latest_file)
                
        return audit_files

    def calculate_overall_seo_score(self, audit_data: Dict) -> Dict:
        """Calculate overall SEO health score"""
        scores = {}
        weights = {
            'technical': 0.3,
            'performance': 0.3,
            'content': 0.25,
            'competitive': 0.15
        }
        
        # Technical score (0-100)
        if 'technical' in audit_data['available_audits']:
            tech_data = audit_data['technical']
            tech_score = 0
            
            # Robots.txt (10 points)
            if tech_data.get('robots_txt', {}).get('exists'):
                tech_score += 10
                
            # Sitemap (10 points)
            if tech_data.get('sitemap', {}).get('found_sitemaps'):
                tech_score += 10
                
            # SSL (15 points)
            if tech_data.get('ssl_certificate', {}).get('https_supported'):
                tech_score += 15
                
            # Meta tags (30 points total)
            for page in tech_data.get('pages', []):
                meta_issues = len(page.get('meta_tags', {}).get('issues', []))
                if meta_issues == 0:
                    tech_score += 15
                elif meta_issues <= 2:
                    tech_score += 10
                break  # Only check first page for now
                
            # Header structure (15 points)
            for page in tech_data.get('pages', []):
                header_issues = len(page.get('header_structure', {}).get('issues', []))
                if header_issues == 0:
                    tech_score += 15
                elif header_issues <= 1:
                    tech_score += 10
                break
                
            # Schema markup (10 points)
            for page in tech_data.get('pages', []):
                if page.get('schema_markup'):
                    tech_score += 10
                break
                
            # Mobile friendliness (10 points)
            for page in tech_data.get('pages', []):
                mobile_issues = len(page.get('mobile_friendliness', {}).get('issues', []))
                if mobile_issues == 0:
                    tech_score += 10
                elif mobile_issues <= 1:
                    tech_score += 5
                break
                
            scores['technical'] = min(tech_score, 100)
            
        # Performance score
        if 'performance' in audit_data['available_audits']:
            perf_data = audit_data['performance']
            scores['performance'] = perf_data.get('summary', {}).get('overall_score', 0)
            
        # Content score
        if 'content' in audit_data['available_audits']:
            content_data = audit_data['content']
            scores['content'] = content_data.get('summary', {}).get('seo_optimization_score', 0)
            
        # Competitive score (based on SERP positions)
        if 'competitive' in audit_data['available_audits']:
            comp_data = audit_data['competitive']
            avg_position = comp_data.get('summary', {}).get('avg_serp_position', 0)
            
            # Convert average position to score (1st position = 100, 10th = 10, >10 = 0)
            if avg_position > 0:
                if avg_position <= 1:
                    comp_score = 100
                elif avg_position <= 10:
                    comp_score = int(100 - (avg_position - 1) * 10)
                else:
                    comp_score = 0
            else:
                comp_score = 0  # No rankings found
                
            scores['competitive'] = comp_score
            
        # Calculate weighted overall score
        overall_score = 0
        total_weight = 0
        
        for audit_type, score in scores.items():
            if score is not None:
                overall_score += score * weights[audit_type]
                total_weight += weights[audit_type]
                
        if total_weight > 0:
            overall_score = overall_score / total_weight
        else:
            overall_score = 0
            
        return {
            'overall_score': round(overall_score, 1),
            'component_scores': scores,
            'score_breakdown': {
                'technical_weight': weights['technical'],
                'performance_weight': weights['performance'],
                'content_weight': weights['content'],
                'competitive_weight': weights['competitive']
            }
        }

    def generate_charts(self, audit_data: Dict, output_dir: Path) -> Dict:
        """Generate charts and visualizations"""
        charts = {}
        charts_dir = output_dir / "charts"
        charts_dir.mkdir(exist_ok=True)
        
        # Overall SEO score breakdown
        if audit_data['available_audits']:
            seo_scores = self.calculate_overall_seo_score(audit_data)
            component_scores = seo_scores['component_scores']
            
            # Create pie chart for score breakdown
            if component_scores:
                fig = px.pie(
                    values=list(component_scores.values()),
                    names=list(component_scores.keys()),
                    title="SEO Score Breakdown by Category"
                )
                fig.update_traces(textposition='inside', textinfo='percent+label')
                pie_chart_path = charts_dir / "seo_score_breakdown.html"
                fig.write_html(str(pie_chart_path))
                charts['seo_score_breakdown'] = str(pie_chart_path)
                
        # Performance metrics chart
        if 'performance' in audit_data['available_audits']:
            perf_data = audit_data['performance']
            
            # Core Web Vitals chart
            mobile_cwv = perf_data.get('mobile', {}).get('core_web_vitals', {})
            if mobile_cwv:
                metrics = []
                values = []
                thresholds = []
                
                for metric, data in mobile_cwv.items():
                    if metric != 'overall_assessment' and isinstance(data, dict):
                        metrics.append(metric.upper())
                        value = data.get('value')
                        if value is not None:
                            values.append(value)
                            # Get threshold for this metric
                            if metric == 'lcp':
                                thresholds.append(2.5)
                            elif metric == 'inp':
                                thresholds.append(200)
                            elif metric == 'cls':
                                thresholds.append(0.1)
                            else:
                                thresholds.append(0)
                        else:
                            values.append(0)
                            thresholds.append(0)
                            
                if metrics and values:
                    fig = go.Figure()
                    fig.add_trace(go.Bar(
                        x=metrics,
                        y=values,
                        name='Current Values',
                        marker_color=['green' if v <= t else 'red' for v, t in zip(values, thresholds)]
                    ))
                    fig.add_trace(go.Scatter(
                        x=metrics,
                        y=thresholds,
                        mode='lines+markers',
                        name='Good Thresholds',
                        line=dict(color='orange', dash='dash')
                    ))
                    
                    fig.update_layout(
                        title='Core Web Vitals Performance',
                        xaxis_title='Metrics',
                        yaxis_title='Values',
                        barmode='group'
                    )
                    
                    cwv_chart_path = charts_dir / "core_web_vitals.html"
                    fig.write_html(str(cwv_chart_path))
                    charts['core_web_vitals'] = str(cwv_chart_path)
                    
        # Content analysis chart
        if 'content' in audit_data['available_audits']:
            content_data = audit_data['content']
            keyword_analysis = content_data.get('keyword_analysis', {})
            
            if keyword_analysis.get('top_keywords'):
                top_keywords = keyword_analysis['top_keywords'][:10]
                keywords = [kw[0] for kw in top_keywords]
                frequencies = [kw[1] for kw in top_keywords]
                
                fig = px.bar(
                    x=frequencies,
                    y=keywords,
                    orientation='h',
                    title='Top Keywords by Frequency',
                    labels={'x': 'Frequency', 'y': 'Keywords'}
                )
                fig.update_layout(yaxis={'categoryorder': 'total ascending'})
                
                keyword_chart_path = charts_dir / "top_keywords.html"
                fig.write_html(str(keyword_chart_path))
                charts['top_keywords'] = str(keyword_chart_path)
                
        # Competitive analysis chart
        if 'competitive' in audit_data['available_audits']:
            comp_data = audit_data['competitive']
            serp_analysis = comp_data.get('serp_analysis', {})
            
            if serp_analysis.get('target_domain_positions'):
                positions = serp_analysis['target_domain_positions']
                keywords = list(positions.keys())
                position_values = [pos if pos is not None else 100 for pos in positions.values()]
                
                fig = px.bar(
                    x=keywords,
                    y=position_values,
                    title='SERP Positions by Keyword',
                    labels={'x': 'Keywords', 'y': 'Position (lower is better)'}
                )
                fig.update_layout(yaxis_autorange='reversed')  # Lower positions at top
                
                serp_chart_path = charts_dir / "serp_positions.html"
                fig.write_html(str(serp_chart_path))
                charts['serp_positions'] = str(serp_chart_path)
                
        return charts

    def create_html_template(self) -> str:
        """Create comprehensive HTML report template"""
        template_content = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO Audit Report - {{ domain }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: #333; 
            background: #f8f9fa;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 40px 20px; 
            text-align: center; 
            margin-bottom: 30px;
            border-radius: 10px;
        }
        .score-card { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        .score-number { 
            font-size: 4rem; 
            font-weight: bold; 
            color: {{ score_color }};
            display: block;
        }
        .score-label { font-size: 1.2rem; color: #666; margin-top: 10px; }
        .section { 
            background: white; 
            margin-bottom: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .section-header { 
            background: #f8f9fa; 
            padding: 20px; 
            border-bottom: 1px solid #eee;
        }
        .section-title { 
            font-size: 1.5rem; 
            font-weight: 600; 
            color: #333;
        }
        .section-content { padding: 20px; }
        .metric { 
            display: flex; 
            justify-content: space-between; 
            padding: 15px 0; 
            border-bottom: 1px solid #eee;
        }
        .metric:last-child { border-bottom: none; }
        .metric-label { font-weight: 500; }
        .metric-value { color: #667eea; font-weight: 600; }
        .issue-list { list-style: none; }
        .issue-item { 
            padding: 10px; 
            margin: 5px 0; 
            border-left: 4px solid #dc3545;
            background: #fff5f5;
            border-radius: 4px;
        }
        .recommendation-item { 
            padding: 10px; 
            margin: 5px 0; 
            border-left: 4px solid #28a745;
            background: #f8fff8;
            border-radius: 4px;
        }
        .status-good { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .chart-container { 
            text-align: center; 
            margin: 20px 0;
        }
        .timestamp { 
            color: #666; 
            font-size: 0.9rem; 
            text-align: center; 
            margin-top: 30px;
        }
        @media print {
            .container { max-width: none; padding: 10px; }
            .section { page-break-inside: avoid; margin-bottom: 20px; }
            .chart-container iframe { display: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SEO Audit Report</h1>
            <h2>{{ domain }}</h2>
            <p>Generated on {{ timestamp }}</p>
        </div>

        <div class="score-card">
            <span class="score-number">{{ overall_score }}</span>
            <div class="score-label">Overall SEO Health Score</div>
        </div>

        {% if 'technical' in available_audits %}
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">🔧 Technical SEO Analysis</h2>
            </div>
            <div class="section-content">
                <div class="grid">
                    <div class="card">
                        <h3>Site Infrastructure</h3>
                        <div class="metric">
                            <span class="metric-label">Robots.txt</span>
                            <span class="metric-value {{ 'status-good' if technical.robots_txt.exists else 'status-error' }}">
                                {{ '✅ Found' if technical.robots_txt.exists else '❌ Missing' }}
                            </span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">XML Sitemap</span>
                            <span class="metric-value {{ 'status-good' if technical.sitemap.found_sitemaps else 'status-error' }}">
                                {{ '✅ Found' if technical.sitemap.found_sitemaps else '❌ Missing' }}
                            </span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">HTTPS</span>
                            <span class="metric-value {{ 'status-good' if technical.ssl_certificate.https_supported else 'status-error' }}">
                                {{ '✅ Enabled' if technical.ssl_certificate.https_supported else '❌ Disabled' }}
                            </span>
                        </div>
                    </div>
                    
                    {% if technical.pages %}
                    <div class="card">
                        <h3>Page Optimization</h3>
                        {% set page = technical.pages[0] %}
                        <div class="metric">
                            <span class="metric-label">Title Tag</span>
                            <span class="metric-value {{ 'status-good' if not page.meta_tags.issues or 'title' not in page.meta_tags.issues|join else 'status-error' }}">
                                {{ '✅ Optimized' if not page.meta_tags.issues or 'title' not in page.meta_tags.issues|join else '❌ Issues Found' }}
                            </span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Meta Description</span>
                            <span class="metric-value {{ 'status-good' if not page.meta_tags.issues or 'description' not in page.meta_tags.issues|join else 'status-error' }}">
                                {{ '✅ Optimized' if not page.meta_tags.issues or 'description' not in page.meta_tags.issues|join else '❌ Issues Found' }}
                            </span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">H1 Tags</span>
                            <span class="metric-value {{ 'status-good' if page.header_structure.h1_count == 1 else 'status-error' }}">
                                {{ page.header_structure.h1_count }} found
                            </span>
                        </div>
                    </div>
                    {% endif %}
                </div>

                {% if technical.summary.recommendations %}
                <h3>Key Recommendations</h3>
                <ul class="issue-list">
                    {% for recommendation in technical.summary.recommendations %}
                    <li class="recommendation-item">{{ recommendation }}</li>
                    {% endfor %}
                </ul>
                {% endif %}
            </div>
        </div>
        {% endif %}

        {% if 'performance' in available_audits %}
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">⚡ Performance Analysis</h2>
            </div>
            <div class="section-content">
                <div class="grid">
                    <div class="card">
                        <h3>Performance Score</h3>
                        <div class="metric">
                            <span class="metric-label">Overall Score</span>
                            <span class="metric-value">{{ performance.summary.overall_score }}/100</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Core Web Vitals</span>
                            <span class="metric-value {{ 'status-good' if performance.summary.core_web_vitals_passed else 'status-error' }}">
                                {{ '✅ Passed' if performance.summary.core_web_vitals_passed else '❌ Failed' }}
                            </span>
                        </div>
                    </div>
                    
                    {% if performance.mobile.core_web_vitals %}
                    <div class="card">
                        <h3>Core Web Vitals (Mobile)</h3>
                        {% set cwv = performance.mobile.core_web_vitals %}
                        {% for metric, data in cwv.items() %}
                            {% if metric != 'overall_assessment' and data.message %}
                            <div class="metric">
                                <span class="metric-label">{{ metric.upper() }}</span>
                                <span class="metric-value">{{ data.display_value or 'N/A' }}</span>
                            </div>
                            {% endif %}
                        {% endfor %}
                    </div>
                    {% endif %}
                </div>

                {% if performance.summary.priority_issues %}
                <h3>Priority Issues</h3>
                <ul class="issue-list">
                    {% for issue in performance.summary.priority_issues %}
                    <li class="issue-item">{{ issue.title or issue }}</li>
                    {% endfor %}
                </ul>
                {% endif %}

                {% if charts.core_web_vitals %}
                <div class="chart-container">
                    <iframe src="{{ charts.core_web_vitals }}" width="100%" height="400" frameborder="0"></iframe>
                </div>
                {% endif %}
            </div>
        </div>
        {% endif %}

        {% if 'content' in available_audits %}
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">📝 Content SEO Analysis</h2>
            </div>
            <div class="section-content">
                <div class="grid">
                    <div class="card">
                        <h3>Content Metrics</h3>
                        <div class="metric">
                            <span class="metric-label">Word Count</span>
                            <span class="metric-value">{{ content.summary.total_words }} words</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">SEO Score</span>
                            <span class="metric-value">{{ content.summary.seo_optimization_score }}/100</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Readability Score</span>
                            <span class="metric-value">{{ content.summary.readability_score|round(1) }}</span>
                        </div>
                    </div>
                    
                    {% if content.readability %}
                    <div class="card">
                        <h3>Readability Analysis</h3>
                        <div class="metric">
                            <span class="metric-label">Reading Level</span>
                            <span class="metric-value">{{ content.readability.reading_level }}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Reading Time</span>
                            <span class="metric-value">{{ content.readability.reading_time_minutes|round(1) }} min</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Sentences</span>
                            <span class="metric-value">{{ content.readability.sentences }}</span>
                        </div>
                    </div>
                    {% endif %}
                </div>

                {% if content.summary.priority_issues %}
                <h3>Priority Issues</h3>
                <ul class="issue-list">
                    {% for issue in content.summary.priority_issues %}
                    <li class="issue-item">{{ issue }}</li>
                    {% endfor %}
                </ul>
                {% endif %}

                {% if charts.top_keywords %}
                <div class="chart-container">
                    <iframe src="{{ charts.top_keywords }}" width="100%" height="400" frameborder="0"></iframe>
                </div>
                {% endif %}
            </div>
        </div>
        {% endif %}

        {% if 'competitive' in available_audits %}
        <div class="section">
            <div class="section-header">
                <h2 class="section-title">🏆 Competitive Analysis</h2>
            </div>
            <div class="section-content">
                <div class="grid">
                    <div class="card">
                        <h3>SERP Performance</h3>
                        <div class="metric">
                            <span class="metric-label">Average Position</span>
                            <span class="metric-value">
                                {% if competitive.summary.avg_serp_position > 0 %}
                                    {{ competitive.summary.avg_serp_position|round(1) }}
                                {% else %}
                                    Not ranking
                                {% endif %}
                            </span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Keywords Ranking</span>
                            <span class="metric-value">{{ competitive.summary.keywords_ranking }}</span>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3>Top Competitors</h3>
                        {% for competitor in competitive.summary.top_competitors_identified[:5] %}
                        <div class="metric">
                            <span class="metric-label">{{ loop.index }}</span>
                            <span class="metric-value">{{ competitor }}</span>
                        </div>
                        {% endfor %}
                    </div>
                </div>

                {% if competitive.summary.critical_gaps %}
                <h3>Critical Content Gaps</h3>
                <ul class="issue-list">
                    {% for gap in competitive.summary.critical_gaps %}
                    <li class="issue-item">{{ gap }}</li>
                    {% endfor %}
                </ul>
                {% endif %}

                {% if charts.serp_positions %}
                <div class="chart-container">
                    <iframe src="{{ charts.serp_positions }}" width="100%" height="400" frameborder="0"></iframe>
                </div>
                {% endif %}
            </div>
        </div>
        {% endif %}

        <div class="section">
            <div class="section-header">
                <h2 class="section-title">📋 Action Plan</h2>
            </div>
            <div class="section-content">
                <div class="grid">
                    <div class="card">
                        <h3>Quick Wins (1-2 hours)</h3>
                        <ul class="issue-list">
                            {% for audit_type in available_audits %}
                                {% set audit_data_ref = audit_data[audit_type] %}
                                {% if audit_data_ref.summary and audit_data_ref.summary.quick_wins %}
                                    {% for win in audit_data_ref.summary.quick_wins[:3] %}
                                    <li class="recommendation-item">{{ win.title if win.title else win }}</li>
                                    {% endfor %}
                                {% endif %}
                            {% endfor %}
                        </ul>
                    </div>
                    
                    <div class="card">
                        <h3>Priority Fixes (1-5 hours)</h3>
                        <ul class="issue-list">
                            {% for audit_type in available_audits %}
                                {% set audit_data_ref = audit_data[audit_type] %}
                                {% if audit_data_ref.summary and audit_data_ref.summary.priority_issues %}
                                    {% for issue in audit_data_ref.summary.priority_issues[:3] %}
                                    <li class="issue-item">{{ issue.title if issue.title else issue }}</li>
                                    {% endfor %}
                                {% endif %}
                            {% endfor %}
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="timestamp">
            Report generated on {{ timestamp }} by Ultimate SEO Audit System
        </div>
    </div>
</body>
</html>
        '''
        return template_content

    def generate_html_report(self, audit_data: Dict, output_path: str = None) -> str:
        """Generate comprehensive HTML report"""
        logger.info("Generating HTML report...")
        
        if not output_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = self.reports_dir / f"seo_audit_report_{timestamp}.html"
        else:
            output_path = Path(output_path)
            
        # Calculate overall scores
        seo_scores = self.calculate_overall_seo_score(audit_data)
        
        # Determine score color
        overall_score = seo_scores['overall_score']
        if overall_score >= 80:
            score_color = '#28a745'  # Green
        elif overall_score >= 60:
            score_color = '#ffc107'  # Yellow
        else:
            score_color = '#dc3545'  # Red
            
        # Generate charts
        charts = self.generate_charts(audit_data, output_path.parent)
        
        # Get domain name
        domain = "Unknown"
        for audit_type in audit_data['available_audits']:
            if audit_data[audit_type].get('domain'):
                domain = audit_data[audit_type]['domain']
                break
                
        # Create template and render
        template_content = self.create_html_template()
        template_path = self.templates_dir / "report_template.html"
        
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(template_content)
            
        template = self.jinja_env.get_template("report_template.html")
        
        html_content = template.render(
            domain=domain,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            overall_score=int(overall_score),
            score_color=score_color,
            available_audits=audit_data['available_audits'],
            technical=audit_data.get('technical', {}),
            performance=audit_data.get('performance', {}),
            content=audit_data.get('content', {}),
            competitive=audit_data.get('competitive', {}),
            charts=charts,
            audit_data=audit_data
        )
        
        # Save HTML report
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
            
        logger.info(f"HTML report generated: {output_path}")
        return str(output_path)

    def generate_pdf_report(self, html_path: str, pdf_path: str = None) -> str:
        """Generate PDF report from HTML"""
        if not pdf_path:
            pdf_path = html_path.replace('.html', '.pdf')
            
        try:
            # Read HTML content
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
                
            # Generate PDF
            HTML(string=html_content, base_url=str(Path(html_path).parent)).write_pdf(pdf_path)
            
            logger.info(f"PDF report generated: {pdf_path}")
            return pdf_path
            
        except Exception as e:
            logger.error(f"Error generating PDF: {e}")
            return None

    def generate_executive_summary(self, audit_data: Dict) -> str:
        """Generate executive summary"""
        seo_scores = self.calculate_overall_seo_score(audit_data)
        overall_score = seo_scores['overall_score']
        
        # Collect key issues and recommendations
        critical_issues = []
        quick_wins = []
        
        for audit_type in audit_data['available_audits']:
            audit_summary = audit_data[audit_type].get('summary', {})
            
            if audit_summary.get('priority_issues'):
                critical_issues.extend(audit_summary['priority_issues'][:2])
                
            if audit_summary.get('quick_wins'):
                quick_wins.extend(audit_summary['quick_wins'][:2])
                
        # Get domain
        domain = "your website"
        for audit_type in audit_data['available_audits']:
            if audit_data[audit_type].get('domain'):
                domain = audit_data[audit_type]['domain']
                break
                
        # Generate summary text
        summary = f"""
SEO AUDIT EXECUTIVE SUMMARY
===========================

Website: {domain}
Overall SEO Health Score: {overall_score:.1f}/100

CURRENT STATUS:
"""
        
        if overall_score >= 80:
            summary += f"✅ Excellent - {domain} has strong SEO foundations with minor optimization opportunities.\n"
        elif overall_score >= 60:
            summary += f"⚠️ Good - {domain} has solid SEO basics but has room for improvement in key areas.\n"
        elif overall_score >= 40:
            summary += f"⚠️ Fair - {domain} needs attention in several SEO areas to improve search visibility.\n"
        else:
            summary += f"❌ Poor - {domain} requires immediate attention to address critical SEO issues.\n"
            
        summary += f"\nAUDITS COMPLETED: {', '.join(audit_data['available_audits']).title()}\n"
        
        if critical_issues:
            summary += f"\nCRITICAL ISSUES TO ADDRESS:\n"
            for i, issue in enumerate(critical_issues[:5], 1):
                issue_text = issue.get('title', issue) if isinstance(issue, dict) else issue
                summary += f"{i}. {issue_text}\n"
                
        if quick_wins:
            summary += f"\nQUICK WINS (Easy Improvements):\n"
            for i, win in enumerate(quick_wins[:5], 1):
                win_text = win.get('title', win) if isinstance(win, dict) else win
                summary += f"{i}. {win_text}\n"
                
        # Component scores
        if seo_scores.get('component_scores'):
            summary += f"\nSCORE BREAKDOWN:\n"
            for component, score in seo_scores['component_scores'].items():
                if score is not None:
                    summary += f"- {component.title()}: {score:.1f}/100\n"
                    
        summary += f"\nRECOMMENDED NEXT STEPS:\n"
        summary += f"1. Address critical issues immediately\n"
        summary += f"2. Implement quick wins for fast improvements\n"
        summary += f"3. Schedule regular monitoring and re-auditing\n"
        summary += f"4. Consider competitive analysis for strategic insights\n"
        
        return summary

def main():
    """Main function for generating SEO reports"""
    import sys
    
    generator = SEOReportGenerator()
    
    if len(sys.argv) > 1 and sys.argv[1] == '--latest':
        # Use latest audit files
        audit_files = generator.find_latest_audit_files()
        print("Found audit files:")
        for audit_type, file_path in audit_files.items():
            if file_path:
                print(f"  {audit_type}: {file_path}")
                
        audit_data = generator.load_audit_data(**audit_files)
    else:
        # Manual file specification
        if len(sys.argv) < 2:
            print("Usage:")
            print("  python generate-report.py --latest")
            print("  python generate-report.py <technical_file> [performance_file] [content_file] [competitive_file]")
            sys.exit(1)
            
        files = sys.argv[1:5]  # Up to 4 files
        audit_data = generator.load_audit_data(*files)
        
    if not audit_data['available_audits']:
        print("Error: No valid audit data found")
        sys.exit(1)
        
    print(f"Generating report for audits: {', '.join(audit_data['available_audits'])}")
    
    # Generate HTML report
    html_path = generator.generate_html_report(audit_data)
    print(f"✅ HTML report generated: {html_path}")
    
    # Generate PDF report
    try:
        pdf_path = generator.generate_pdf_report(html_path)
        if pdf_path:
            print(f"✅ PDF report generated: {pdf_path}")
    except ImportError:
        print("⚠️ PDF generation skipped (weasyprint not available)")
    except Exception as e:
        print(f"⚠️ PDF generation failed: {e}")
        
    # Generate executive summary
    summary = generator.generate_executive_summary(audit_data)
    print("\n" + "="*50)
    print(summary)
    print("="*50)
    
    # Save summary to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    summary_path = generator.reports_dir / f"executive_summary_{timestamp}.txt"
    with open(summary_path, 'w') as f:
        f.write(summary)
    print(f"\n📋 Executive summary saved: {summary_path}")

if __name__ == "__main__":
    main()