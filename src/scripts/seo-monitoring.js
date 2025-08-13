/**
 * SEO Monitoring System for GadgetFix FAQ Schema Implementation
 * Tracks Core Web Vitals, Rich Results, and Local Search Performance
 */

class SEOMonitor {
    constructor() {
        this.metrics = {
            coreWebVitals: {},
            richResults: {},
            localSearch: {},
            faqPerformance: {}
        };
        this.initialized = false;
        this.init();
    }

    async init() {
        // Load Web Vitals library
        if (typeof getCLS === 'undefined') {
            await this.loadWebVitalsLibrary();
        }
        
        // Start monitoring
        this.trackCoreWebVitals();
        this.validateFAQSchema();
        this.trackFAQInteractions();
        this.setupPeriodicChecks();
        
        this.initialized = true;
        console.log('SEO Monitor initialized');
    }

    async loadWebVitalsLibrary() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    trackCoreWebVitals() {
        if (typeof webVitals !== 'undefined') {
            // Track all Core Web Vitals
            webVitals.getCLS((metric) => this.recordVital('CLS', metric));
            webVitals.getFID((metric) => this.recordVital('FID', metric));
            webVitals.getLCP((metric) => this.recordVital('LCP', metric));
            webVitals.getTTFB((metric) => this.recordVital('TTFB', metric));
            
            // Track INP if available
            if (webVitals.getINP) {
                webVitals.getINP((metric) => this.recordVital('INP', metric));
            }
        }
    }

    recordVital(name, metric) {
        this.metrics.coreWebVitals[name] = {
            value: metric.value,
            rating: metric.rating,
            timestamp: new Date().toISOString()
        };

        // Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', name, {
                event_category: 'Web Vitals',
                value: Math.round(name === 'CLS' ? metric.value * 1000 : metric.value),
                event_label: metric.rating,
                non_interaction: true
            });
        }

        // Check thresholds and alert if needed
        this.checkVitalThreshold(name, metric);
        
        // Store for historical tracking
        this.storeMetric(`cwv-${name}`, metric);
    }

    checkVitalThreshold(name, metric) {
        const thresholds = {
            LCP: { good: 2500, poor: 4000 },
            FID: { good: 100, poor: 300 },
            CLS: { good: 0.1, poor: 0.25 },
            INP: { good: 200, poor: 500 },
            TTFB: { good: 800, poor: 1800 }
        };

        const threshold = thresholds[name];
        if (threshold && metric.value > threshold.good) {
            const severity = metric.value > threshold.poor ? 'high' : 'medium';
            this.createAlert({
                type: 'core-web-vitals',
                metric: name,
                value: metric.value,
                severity: severity,
                message: `${name} is ${metric.rating}: ${metric.value}`
            });
        }
    }

    validateFAQSchema() {
        const validation = {
            isValid: false,
            errors: [],
            warnings: [],
            questionCount: 0,
            richResultEligible: false
        };

        // Find FAQ schema
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        let faqSchema = null;

        scripts.forEach(script => {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@type'] === 'FAQPage') {
                    faqSchema = data;
                } else if (Array.isArray(data)) {
                    faqSchema = data.find(item => item['@type'] === 'FAQPage');
                }
            } catch (e) {
                validation.errors.push(`JSON-LD parsing error: ${e.message}`);
            }
        });

        if (faqSchema) {
            validation.isValid = true;
            const questions = faqSchema.mainEntity || [];
            validation.questionCount = questions.length;

            // Check Google requirements
            if (questions.length < 2) {
                validation.warnings.push('Google requires at least 2 FAQ items for rich results');
            } else {
                validation.richResultEligible = true;
            }

            // Validate each question
            questions.forEach((q, index) => {
                if (!q.name) {
                    validation.errors.push(`Question ${index + 1} missing name property`);
                }
                if (!q.acceptedAnswer?.text) {
                    validation.errors.push(`Question ${index + 1} missing answer text`);
                }
            });
        } else {
            validation.errors.push('No FAQ schema found on page');
        }

        this.metrics.faqPerformance.schemaValidation = validation;
        
        // Alert if issues found
        if (validation.errors.length > 0) {
            this.createAlert({
                type: 'schema',
                severity: 'high',
                message: `FAQ schema errors: ${validation.errors.join(', ')}`
            });
        }

        return validation;
    }

    trackFAQInteractions() {
        // Track FAQ accordion interactions
        document.querySelectorAll('.faq-item').forEach((item, index) => {
            item.addEventListener('toggle', (e) => {
                if (e.target.open) {
                    this.recordFAQInteraction('expand', index);
                }
            });
        });

        // Track FAQ visibility
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.recordFAQInteraction('view', 'faq-section');
                    }
                });
            }, { threshold: 0.5 });

            const faqSection = document.querySelector('.faq-container, .faq-section, #faq');
            if (faqSection) {
                observer.observe(faqSection);
            }
        }
    }

    recordFAQInteraction(action, detail) {
        // Track in analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'faq_interaction', {
                event_category: 'FAQ',
                event_action: action,
                event_label: detail
            });
        }

        // Update metrics
        if (!this.metrics.faqPerformance.interactions) {
            this.metrics.faqPerformance.interactions = [];
        }
        
        this.metrics.faqPerformance.interactions.push({
            action: action,
            detail: detail,
            timestamp: new Date().toISOString()
        });

        // Store for analysis
        this.storeMetric('faq-interactions', { action, detail });
    }

    setupPeriodicChecks() {
        // Check schema every page load
        window.addEventListener('load', () => {
            setTimeout(() => this.validateFAQSchema(), 2000);
        });

        // Periodic performance checks (every 5 minutes)
        setInterval(() => {
            this.checkPerformance();
        }, 5 * 60 * 1000);
    }

    checkPerformance() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            const metrics = {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                domInteractive: navigation.domInteractive - navigation.fetchStart,
                serverResponseTime: navigation.responseEnd - navigation.requestStart
            };

            this.metrics.performance = metrics;
            
            // Alert if slow
            if (metrics.loadComplete > 3000) {
                this.createAlert({
                    type: 'performance',
                    severity: 'medium',
                    message: `Page load time (${metrics.loadComplete}ms) exceeds 3 seconds`
                });
            }
        }
    }

    createAlert(alert) {
        alert.timestamp = new Date().toISOString();
        alert.url = window.location.href;
        
        // Store alert
        const alerts = JSON.parse(localStorage.getItem('seo-alerts') || '[]');
        alerts.push(alert);
        localStorage.setItem('seo-alerts', JSON.stringify(alerts.slice(-100)));
        
        // Log to console
        console.warn('SEO Alert:', alert);
        
        // Send to monitoring service if configured
        this.sendToMonitoringService(alert);
    }

    sendToMonitoringService(alert) {
        // This would send to your monitoring service
        // Example: Google Analytics event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'seo_alert', {
                event_category: 'SEO Monitoring',
                event_action: alert.type,
                event_label: alert.message
            });
        }
    }

    storeMetric(key, data) {
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        stored.push({
            ...data,
            timestamp: new Date().toISOString()
        });
        
        // Keep last 100 entries
        localStorage.setItem(key, JSON.stringify(stored.slice(-100)));
    }

    generateReport() {
        return {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            metrics: this.metrics,
            alerts: JSON.parse(localStorage.getItem('seo-alerts') || '[]').slice(-10),
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Check Core Web Vitals
        const cwv = this.metrics.coreWebVitals;
        if (cwv.LCP?.value > 2500) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                issue: 'Slow Largest Contentful Paint',
                solution: 'Optimize images, improve server response time'
            });
        }
        
        if (cwv.CLS?.value > 0.1) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                issue: 'High Cumulative Layout Shift',
                solution: 'Add size attributes to images, reserve space for dynamic content'
            });
        }
        
        // Check FAQ schema
        const schema = this.metrics.faqPerformance.schemaValidation;
        if (schema && !schema.richResultEligible) {
            recommendations.push({
                type: 'schema',
                priority: 'medium',
                issue: 'FAQ not eligible for rich results',
                solution: 'Add more FAQ items (minimum 2 required)'
            });
        }
        
        return recommendations;
    }
}

// Initialize SEO monitoring when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.seoMonitor = new SEOMonitor();
    });
} else {
    window.seoMonitor = new SEOMonitor();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOMonitor;
}