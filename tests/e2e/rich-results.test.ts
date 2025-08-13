import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

// Rich Results Validation Test Suite
test('FAQ Rich Results Validation', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to a location page
  await page.goto('https://www.gadgetfixllc.com/locations/dallas');

  // Extract JSON-LD script
  const jsonLdScript = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const faqScript = Array.from(scripts).find(script => 
      script.textContent?.includes('FAQPage')
    );
    return faqScript ? JSON.parse(faqScript.textContent || '{}') : null;
  });

  // Validate FAQ Rich Results structure
  expect(jsonLdScript).toBeTruthy();
  expect(jsonLdScript['@type']).toBe('FAQPage');
  expect(jsonLdScript.mainEntity).toBeTruthy();
  expect(Array.isArray(jsonLdScript.mainEntity)).toBe(true);

  // Validate each FAQ entry
  jsonLdScript.mainEntity.forEach((entry: any) => {
    expect(entry['@type']).toBe('Question');
    expect(entry.name).toBeTruthy();
    expect(entry.acceptedAnswer).toBeTruthy();
    expect(entry.acceptedAnswer['@type']).toBe('Answer');
    expect(entry.acceptedAnswer.text).toBeTruthy();
  });

  await browser.close();
});

// Mobile-Friendly Test
test('Mobile-Friendly Rich Results', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 } // iPhone X dimensions
  });
  const page = await context.newPage();

  // Navigate to location page
  await page.goto('https://www.gadgetfixllc.com/locations/dallas');

  // Check mobile-specific meta tags
  const mobileMetaTags = await page.evaluate(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    return {
      viewportContent: viewport?.getAttribute('content'),
      mobileOptimized: document.querySelector('meta[name="MobileOptimized"]'),
      handheldfriendly: document.querySelector('meta[name="handheldfriendly"]')
    };
  });

  expect(mobileMetaTags.viewportContent).toContain('width=device-width');
  expect(mobileMetaTags.viewportContent).toContain('initial-scale=1');

  await browser.close();
});