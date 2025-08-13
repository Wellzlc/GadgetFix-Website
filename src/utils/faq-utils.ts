import type { 
  FAQItem, 
  FAQPageSchema, 
  ProcessedFAQ, 
  LocationConfig,
  FAQPerformanceMetrics,
  FAQFilter 
} from '../types/faq';

/**
 * Replace location variables in text with actual location data
 */
export function replaceLocationVariables(
  text: string, 
  config: LocationConfig
): string {
  const replacements: Record<string, string> = {
    '[location]': config.location,
    '[Location]': capitalizeFirst(config.location),
    '[LOCATION]': config.location.toUpperCase(),
    '[county]': config.county || '',
    '[state]': config.state || 'Texas',
    '[neighborhoods]': config.neighborhoods?.join(', ') || '',
    '[landmarks]': config.landmarks?.join(', ') || '',
    ...config.customReplacements
  };

  let result = text;
  for (const [variable, replacement] of Object.entries(replacements)) {
    result = result.replace(new RegExp(escapeRegex(variable), 'g'), replacement);
  }
  
  return result;
}

/**
 * Process FAQ items with location variables and generate IDs
 */
export function processFAQs(
  faqs: FAQItem[], 
  locationConfig?: LocationConfig
): ProcessedFAQ[] {
  return faqs.map((faq, index) => {
    const processed: ProcessedFAQ = {
      ...faq,
      id: `faq-${generateId(faq.question, index)}`,
      processed: true,
      locationReplaced: false
    };

    if (locationConfig && (faq.isLocationSpecific || containsLocationVariables(faq))) {
      processed.question = replaceLocationVariables(faq.question, locationConfig);
      processed.answer = replaceLocationVariables(faq.answer, locationConfig);
      processed.locationReplaced = true;
    }

    return processed;
  });
}

/**
 * Generate FAQ Page schema for JSON-LD
 */
export function generateFAQSchema(
  faqs: FAQItem[], 
  options?: {
    title?: string;
    description?: string;
    organizationName?: string;
    organizationUrl?: string;
  }
): FAQPageSchema {
  const schema: FAQPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question' as const,
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: faq.answer
      }
    }))
  };

  if (options?.title) {
    schema.name = options.title;
  }

  if (options?.description) {
    schema.description = options.description;
  }

  if (options?.organizationName) {
    schema.author = {
      '@type': 'Organization',
      name: options.organizationName,
      url: options.organizationUrl
    };
  }

  const now = new Date().toISOString();
  schema.datePublished = now;
  schema.dateModified = now;

  return schema;
}

/**
 * Filter FAQs by category
 */
export function filterByCategory(
  faqs: FAQItem[], 
  category: string
): FAQItem[] {
  return faqs.filter(faq => faq.category === category);
}

/**
 * Sort FAQs by priority (higher priority first)
 */
export function sortByPriority(faqs: FAQItem[]): FAQItem[] {
  return [...faqs].sort((a, b) => (b.priority || 50) - (a.priority || 50));
}

/**
 * Search FAQs by keyword
 */
export function searchFAQs(
  faqs: FAQItem[], 
  searchTerm: string
): FAQItem[] {
  const term = searchTerm.toLowerCase();
  return faqs.filter(faq => 
    faq.question.toLowerCase().includes(term) ||
    faq.answer.toLowerCase().includes(term) ||
    faq.keywords?.some(keyword => keyword.toLowerCase().includes(term))
  );
}

/**
 * Get related FAQs based on services
 */
export function getRelatedFAQs(
  faqs: FAQItem[], 
  services: string[]
): FAQItem[] {
  return faqs.filter(faq => 
    faq.relatedServices?.some(service => 
      services.includes(service)
    )
  );
}

/**
 * Validate FAQ schema
 */
export function validateFAQSchema(schema: unknown): schema is FAQPageSchema {
  if (typeof schema !== 'object' || schema === null) return false;
  
  const s = schema as any;
  return (
    s['@context'] === 'https://schema.org' &&
    s['@type'] === 'FAQPage' &&
    Array.isArray(s.mainEntity) &&
    s.mainEntity.every((item: any) => 
      item['@type'] === 'Question' &&
      typeof item.name === 'string' &&
      item.acceptedAnswer?.['@type'] === 'Answer' &&
      typeof item.acceptedAnswer?.text === 'string'
    )
  );
}

/**
 * Measure FAQ performance metrics
 */
export function measureFAQPerformance(
  startTime: number,
  faqs: FAQItem[],
  schemaString: string,
  hasInteractivity: boolean
): FAQPerformanceMetrics {
  return {
    renderTime: performance.now() - startTime,
    schemaSize: new Blob([schemaString]).size,
    faqCount: faqs.length,
    hasInteractivity,
    jsLoadTime: hasInteractivity ? performance.now() - startTime : undefined
  };
}

/**
 * Get FAQ analytics data
 */
export function getFAQAnalytics(faqs: ProcessedFAQ[]): {
  totalFAQs: number;
  categoryCounts: Record<string, number>;
  locationSpecificCount: number;
  averagePriority: number;
  hasKeywords: number;
} {
  const analytics = {
    totalFAQs: faqs.length,
    categoryCounts: {} as Record<string, number>,
    locationSpecificCount: 0,
    averagePriority: 0,
    hasKeywords: 0
  };

  let totalPriority = 0;

  for (const faq of faqs) {
    // Count categories
    const category = faq.category || 'general';
    analytics.categoryCounts[category] = (analytics.categoryCounts[category] || 0) + 1;

    // Count location-specific
    if (faq.locationReplaced) {
      analytics.locationSpecificCount++;
    }

    // Sum priorities
    totalPriority += faq.priority || 50;

    // Count FAQs with keywords
    if (faq.keywords && faq.keywords.length > 0) {
      analytics.hasKeywords++;
    }
  }

  analytics.averagePriority = totalPriority / faqs.length;

  return analytics;
}

// Helper functions
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateId(text: string, index: number): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30) + '-' + index;
}

function containsLocationVariables(faq: FAQItem): boolean {
  const pattern = /\[[\w]+\]/;
  return pattern.test(faq.question) || pattern.test(faq.answer);
}

/**
 * Chunk FAQs for progressive loading
 */
export function chunkFAQs<T extends FAQItem>(
  faqs: T[], 
  chunkSize: number = 5
): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < faqs.length; i += chunkSize) {
    chunks.push(faqs.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Generate FAQ breadcrumb data
 */
export function generateBreadcrumb(path: string[], currentPage: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: path.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item,
      item: index === path.length - 1 ? undefined : `/${path.slice(0, index + 1).join('/')}`
    }))
  };
}

/**
 * Get filtered FAQs from content collections
 */
export async function getFilteredFAQs(filter: FAQFilter): Promise<FAQItem[]> {
  try {
    // Import getCollection dynamically to avoid SSR issues
    const { getCollection } = await import('astro:content');
    
    // Get all FAQ collections
    const faqCollections = await getCollection('faqs');
    
    // Flatten all FAQs from all collections
    let allFAQs: FAQItem[] = [];
    for (const collection of faqCollections) {
      if (collection.data.faqs && Array.isArray(collection.data.faqs)) {
        allFAQs.push(...collection.data.faqs);
      }
    }
    
    // Apply filters
    let filteredFAQs = allFAQs;
    
    // Filter by categories
    if (filter.categories && filter.categories.length > 0) {
      filteredFAQs = filteredFAQs.filter(faq => 
        filter.categories!.includes(faq.category || 'general')
      );
    }
    
    // Filter by minimum priority
    if (filter.minPriority !== undefined) {
      filteredFAQs = filteredFAQs.filter(faq => 
        (faq.priority || 50) >= filter.minPriority!
      );
    }
    
    // Sort by priority (higher first)
    filteredFAQs = sortByPriority(filteredFAQs);
    
    // Limit results
    if (filter.maxItems && filter.maxItems > 0) {
      filteredFAQs = filteredFAQs.slice(0, filter.maxItems);
    }
    
    return filteredFAQs;
  } catch (error) {
    console.error('Error loading FAQs from content collections:', error);
    return [];
  }
}