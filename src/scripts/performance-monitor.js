/**
 * Performance Monitoring and Reporting
 * Tracks Core Web Vitals and custom metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      FCP: 0,  // First Contentful Paint
      LCP: 0,  // Largest Contentful Paint
      FID: 0,  // First Input Delay
      CLS: 0,  // Cumulative Layout Shift
      TTFB: 0, // Time to First Byte
      loadTime: 0,
      domReady: 0,
      resourceCount: 0,
      totalResourceSize: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    this.init();
  }
  
  init() {
    // Only run in production
    if (window.location.hostname === 'localhost') return;
    
    // Observe Core Web Vitals
    this.observeWebVitals();
    
    // Track page load metrics
    this.trackLoadMetrics();
    
    // Monitor resource loading
    this.monitorResources();
    
    // Send metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => this.reportMetrics(), 2000);
    });
  }
  
  observeWebVitals() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {}
      
      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            this.metrics.FID = entries[0].processingStart - entries[0].startTime;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {}
      
      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.CLS = clsValue;
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {}
    }
    
    // First Contentful Paint (fallback)
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.FCP = entry.startTime;
        }
      });
    }
  }
  
  trackLoadMetrics() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      
      window.addEventListener('load', () => {
        this.metrics.TTFB = timing.responseStart - timing.requestStart;
        this.metrics.domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
        this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
      });
    }
  }
  
  monitorResources() {
    if (window.performance && window.performance.getEntriesByType) {
      window.addEventListener('load', () => {
        const resources = performance.getEntriesByType('resource');
        this.metrics.resourceCount = resources.length;
        
        let totalSize = 0;
        let cacheHits = 0;
        
        resources.forEach(resource => {
          if (resource.transferSize) {
            totalSize += resource.transferSize;
            
            // Check if resource was cached
            if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
              cacheHits++;
            }
          }
        });
        
        this.metrics.totalResourceSize = Math.round(totalSize / 1024); // KB
        this.metrics.cacheHits = cacheHits;
        this.metrics.cacheMisses = resources.length - cacheHits;
      });
    }
  }
  
  reportMetrics() {
    // Log to console in development
    console.log('Performance Metrics:', this.metrics);
    
    // Send to analytics if available
    if (typeof gtag !== 'undefined') {
      // Report Core Web Vitals
      gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: 'Core Web Vitals',
        value: Math.round(this.metrics.LCP),
        metric_id: 'LCP',
        metric_value: this.metrics.LCP,
        metric_delta: this.metrics.LCP
      });
      
      // Report load performance
      gtag('event', 'page_load_time', {
        event_category: 'Performance',
        event_label: 'Load Time',
        value: Math.round(this.metrics.loadTime),
        page_load_time: this.metrics.loadTime,
        dom_ready_time: this.metrics.domReady,
        ttfb: this.metrics.TTFB
      });
      
      // Report resource metrics
      gtag('event', 'resource_timing', {
        event_category: 'Performance',
        event_label: 'Resources',
        value: this.metrics.resourceCount,
        resource_count: this.metrics.resourceCount,
        total_size_kb: this.metrics.totalResourceSize,
        cache_hit_rate: Math.round((this.metrics.cacheHits / this.metrics.resourceCount) * 100)
      });
    }
  }
  
  // Public method to get current metrics
  getMetrics() {
    return this.metrics;
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  window.performanceMonitor = new PerformanceMonitor();
}