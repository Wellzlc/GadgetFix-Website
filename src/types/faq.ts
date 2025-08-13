// Comprehensive TypeScript types for FAQ system

export type FAQCategory = 
  | 'general'
  | 'services'
  | 'pricing'
  | 'technical'
  | 'emergency'
  | 'location'
  | 'business';

export type SchemaType = 'FAQPage' | 'SpecialAnnouncement' | 'HowTo';

export interface FAQItem {
  question: string;
  answer: string;
  category?: FAQCategory;
  priority?: number;
  keywords?: string[];
  relatedServices?: string[];
  lastUpdated?: Date;
  isLocationSpecific?: boolean;
}

export interface FAQCollection {
  title: string;
  description?: string;
  faqs: FAQItem[];
  locationVariables?: boolean;
  schemaType?: SchemaType;
  metadata?: FAQMetadata;
}

export interface FAQMetadata {
  author?: string;
  datePublished?: Date;
  dateModified?: Date;
  tags?: string[];
}

export interface FAQTemplate {
  templateName: string;
  description: string;
  variables: string[];
  baseFAQs: FAQItem[];
  customization?: FAQCustomization;
}

export interface FAQCustomization {
  allowAdditions?: boolean;
  allowRemoval?: boolean;
  maxFAQs?: number;
  minFAQs?: number;
}

// JSON-LD Schema Types
export interface FAQPageSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: QuestionAnswer[];
  name?: string;
  description?: string;
  author?: Organization;
  datePublished?: string;
  dateModified?: string;
}

export interface QuestionAnswer {
  '@type': 'Question';
  name: string;
  acceptedAnswer: {
    '@type': 'Answer';
    text: string;
  };
}

export interface Organization {
  '@type': 'Organization';
  name: string;
  url?: string;
}

// Props for components
export interface FAQSchemaProps {
  faqs: FAQItem[];
  location?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showSearch?: boolean;
  showCategories?: boolean;
  analyticsEnabled?: boolean;
  lazyLoad?: boolean;
  initialCount?: number;
}

// Location replacement configuration
export interface LocationConfig {
  location: string;
  county?: string;
  state?: string;
  neighborhoods?: string[];
  landmarks?: string[];
  customReplacements?: Record<string, string>;
}

// Performance metrics
export interface FAQPerformanceMetrics {
  renderTime: number;
  schemaSize: number;
  faqCount: number;
  hasInteractivity: boolean;
  jsLoadTime?: number;
}

// Type guards
export function isFAQItem(item: unknown): item is FAQItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'question' in item &&
    'answer' in item &&
    typeof (item as FAQItem).question === 'string' &&
    typeof (item as FAQItem).answer === 'string'
  );
}

export function isFAQCollection(collection: unknown): collection is FAQCollection {
  return (
    typeof collection === 'object' &&
    collection !== null &&
    'title' in collection &&
    'faqs' in collection &&
    Array.isArray((collection as FAQCollection).faqs)
  );
}

// Utility type for dynamic FAQ IDs
export type FAQId = `faq-${string}`;

// Template literal types for location variables
export type LocationVariable = `[${string}]`;

// Mapped type for FAQ transformations
export type ProcessedFAQ<T extends FAQItem = FAQItem> = T & {
  id: FAQId;
  processed: boolean;
  locationReplaced?: boolean;
};