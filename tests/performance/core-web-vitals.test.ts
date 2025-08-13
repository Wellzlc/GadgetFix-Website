import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

// Performance Budget Configuration
const PERFORMANCE_BUDGET = {
  LCP: 2000,      // Largest Contentful Paint: < 2 seconds
  FID: 75,        // First Input Delay: < 75 milliseconds
  CLS: 0.1,       // Cumulative Layout Shift: < 0.1
  TTI: 3500,      // Time to Interactive: < 3.5 seconds
  TotalSize: 1.5 * 1024 * 1024  // Total page size < 1.5 MB
};

// Test multiple location pages
const LOCATION_PAGES = [
  '/locations/dallas',
  '/locations/fort-worth',
  '/locations/plano'
];

LOCATION_PAGES.forEach(page => {
  test(`Performance Metrics for ${page}`, async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const pageObj = await context.newPage();

    // Navigate to page
    const response = await pageObj.goto(`https://www.gadgetfixllc.com${page}`);
    
    // Capture performance metrics
    const metrics = await pageObj.evaluate(() => {
      const performance = window.performance;
      const navigation = performance.getEntriesByType('navigation')[0];
      
      return {
        loadTime: navigation.loadEventEnd - navigation.startTime,
        responseTime: navigation.responseEnd - navigation.requestStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
        transferSize: navigation.transferSize
      };
    });

    // Lighthouse Core Web Vitals Simulation
    const performanceEntries = await pageObj.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      const lcpEntry = entries.find(entry => entry.name === 'largest-contentful-paint');
      return {
        LCP: lcpEntry ? lcpEntry.startTime : 0,
        pageLoad: performance.now()
      };
    });

    // Assertions
    expect(performanceEntries.LCP).toBeLessThan(PERFORMANCE_BUDGET.LCP);
    expect(metrics.loadTime).toBeLessThan(PERFORMANCE_BUDGET.TTI);
    expect(metrics.transferSize).toBeLessThan(PERFORMANCE_BUDGET.TotalSize);

    await browser.close();
  });
});