import { z, defineCollection } from 'astro:content';

// FAQ Schema with comprehensive validation
const faqSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  answer: z.string().min(20, "Answer must be at least 20 characters"),
  category: z.enum([
    'general',
    'services',
    'pricing',
    'technical',
    'emergency',
    'location',
    'business'
  ]).default('general'),
  priority: z.number().min(0).max(100).default(50),
  keywords: z.array(z.string()).optional(),
  relatedServices: z.array(z.string()).optional(),
  lastUpdated: z.date().optional(),
  isLocationSpecific: z.boolean().default(false)
});

// FAQ Collection for individual FAQ items
const faqs = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    faqs: z.array(faqSchema),
    locationVariables: z.boolean().default(false),
    schemaType: z.enum(['FAQPage', 'SpecialAnnouncement', 'HowTo']).default('FAQPage'),
    metadata: z.object({
      author: z.string().optional(),
      datePublished: z.date().optional(),
      dateModified: z.date().optional(),
      tags: z.array(z.string()).optional()
    }).optional()
  })
});

// FAQ Templates for location-specific content
const faqTemplates = defineCollection({
  type: 'data',
  schema: z.object({
    templateName: z.string(),
    description: z.string(),
    variables: z.array(z.string()),
    baseFAQs: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
        category: z.string(),
        priority: z.number()
      })
    ),
    customization: z.object({
      allowAdditions: z.boolean().default(true),
      allowRemoval: z.boolean().default(false),
      maxFAQs: z.number().default(15),
      minFAQs: z.number().default(5)
    }).optional()
  })
});

export const collections = {
  faqs,
  faqTemplates
};