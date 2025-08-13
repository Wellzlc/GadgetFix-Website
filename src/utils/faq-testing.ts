/**
 * FAQ Testing and Validation Utilities
 * Comprehensive testing tools for the enhanced FAQ system
 */

import type { 
  ProcessedFAQ, 
  FAQPageSchema, 
  SchemaValidationResult,
  FAQFilter,
  FAQSearchResult,
  FAQPerformanceMetrics,
  FAQErrorInfo
} from '../types/faq';

/**
 * Mock FAQ data for testing
 */
export const mockFAQs: ProcessedFAQ[] = [
  {
    question: "How long does virus removal take?",
    answer: "Most virus removals take 30-60 minutes depending on the severity of the infection.",
    category: "service",
    priority: 10,
    clickTrackingId: "virus-removal-time",
    metaTitle: "Virus Removal Time - FAQ",
    metaDescription: "Learn how long computer virus removal takes"
  },
  {
    question: "Do you come to my location in [location]?",
    answer: "Yes! We provide mobile service throughout [location] and surrounding areas.",
    category: "service", 
    priority: 9,
    clickTrackingId: "mobile-service-location"
  },
  {
    question: "What guarantee do you offer?",
    answer: "All services come with our satisfaction guarantee and 90-day warranty.",
    category: "warranty",
    priority: 8,
    clickTrackingId: "service-guarantee"
  },
  {
    question: "Can you reset Windows passwords?",
    answer: "Yes, we can reset Windows passwords for local accounts, Microsoft accounts, and administrator accounts.",
    category: "device",
    priority: 7,
    clickTrackingId: "windows-password-reset"
  },
  {
    question: "Do you offer emergency service?",
    answer: "Yes, we offer same-day emergency service with typical response times of 30 minutes to 1 hour.",
    category: "booking",
    priority: 9,
    clickTrackingId: "emergency-service"
  }
];

/**
 * FAQ Schema Testing Suite
 */
export class FAQSchemaValidator {
  private schema: FAQPageSchema;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor(schema: FAQPageSchema) {
    this.schema = schema;
  }

  /**
   * Comprehensive schema validation
   */
  validate(): SchemaValidationResult {
    this.errors = [];
    this.warnings = [];

    this.validateRequiredProperties();
    this.validateQuestions();
    this.validateAnswers();
    this.validateStructure();
    this.validateSEOOptimization();
    this.validateAccessibility();

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      schema: this.schema
    };
  }

  private validateRequiredProperties(): void {
    if (!this.schema['@context']) {
      this.errors.push('Missing required @context property');
    } else if (this.schema['@context'] !== 'https://schema.org') {
      this.errors.push('Invalid @context value, should be "https://schema.org"');
    }

    if (!this.schema['@type']) {
      this.errors.push('Missing required @type property');
    } else if (this.schema['@type'] !== 'FAQPage') {
      this.errors.push('Invalid @type value, should be "FAQPage"');
    }

    if (!this.schema.mainEntity) {
      this.errors.push('Missing required mainEntity property');
    } else if (!Array.isArray(this.schema.mainEntity)) {
      this.errors.push('mainEntity should be an array');
    } else if (this.schema.mainEntity.length === 0) {
      this.errors.push('mainEntity array cannot be empty');
    }
  }

  private validateQuestions(): void {
    if (!this.schema.mainEntity || !Array.isArray(this.schema.mainEntity)) return;

    this.schema.mainEntity.forEach((question, index) => {
      const questionNum = index + 1;

      if (!question['@type'] || question['@type'] !== 'Question') {
        this.errors.push(`Question ${questionNum}: Invalid or missing @type`);
      }

      if (!question.name) {
        this.errors.push(`Question ${questionNum}: Missing name property`);
      } else {
        if (typeof question.name !== 'string') {
          this.errors.push(`Question ${questionNum}: name must be a string`);
        } else {
          if (question.name.length < 10) {
            this.warnings.push(`Question ${questionNum}: Question text is very short (${question.name.length} chars)`);
          }
          if (question.name.length > 200) {
            this.warnings.push(`Question ${questionNum}: Question text is very long (${question.name.length} chars)`);
          }
          if (!question.name.endsWith('?')) {
            this.warnings.push(`Question ${questionNum}: Question should end with a question mark`);
          }
        }
      }

      // Check for duplicate questions
      const duplicates = this.schema.mainEntity.filter(q => q.name === question.name);
      if (duplicates.length > 1) {
        this.errors.push(`Question ${questionNum}: Duplicate question detected`);
      }
    });
  }

  private validateAnswers(): void {
    if (!this.schema.mainEntity || !Array.isArray(this.schema.mainEntity)) return;

    this.schema.mainEntity.forEach((question, index) => {
      const questionNum = index + 1;

      if (!question.acceptedAnswer) {
        this.errors.push(`Question ${questionNum}: Missing acceptedAnswer`);
        return;
      }

      const answer = question.acceptedAnswer;

      if (!answer['@type'] || answer['@type'] !== 'Answer') {
        this.errors.push(`Question ${questionNum}: Invalid acceptedAnswer @type`);
      }

      if (!answer.text) {
        this.errors.push(`Question ${questionNum}: Missing answer text`);
      } else {
        if (typeof answer.text !== 'string') {
          this.errors.push(`Question ${questionNum}: Answer text must be a string`);
        } else {
          if (answer.text.length < 20) {
            this.warnings.push(`Question ${questionNum}: Answer text is very short (${answer.text.length} chars)`);
          }
          if (answer.text.length > 1000) {
            this.warnings.push(`Question ${questionNum}: Answer text is very long (${answer.text.length} chars)`);
          }
        }
      }
    });
  }

  private validateStructure(): void {
    // Check for proper ID structure
    if (this.schema.mainEntity && Array.isArray(this.schema.mainEntity)) {
      this.schema.mainEntity.forEach((question, index) => {
        if (question['@id'] && !question['@id'].startsWith('#')) {
          this.warnings.push(`Question ${index + 1}: @id should start with '#' for fragment identifiers`);
        }
      });
    }

    // Check for proper date format
    if (this.schema.dateModified) {
      try {
        new Date(this.schema.dateModified);
      } catch {
        this.errors.push('Invalid dateModified format, should be ISO 8601');
      }
    }

    // Check language specification
    if (!this.schema.inLanguage) {
      this.warnings.push('Missing inLanguage property for better internationalization');
    }
  }

  private validateSEOOptimization(): void {
    if (!this.schema.mainEntity || !Array.isArray(this.schema.mainEntity)) return;

    const totalQuestions = this.schema.mainEntity.length;
    
    if (totalQuestions > 30) {
      this.warnings.push(`Large number of questions (${totalQuestions}) may impact page performance`);
    }

    // Check for keyword stuffing
    const allText = this.schema.mainEntity
      .map(q => `${q.name} ${q.acceptedAnswer.text}`)
      .join(' ').toLowerCase();

    const commonKeywords = ['computer', 'service', 'repair', 'fix', 'virus', 'password'];
    commonKeywords.forEach(keyword => {
      const matches = (allText.match(new RegExp(keyword, 'g')) || []).length;
      const density = matches / allText.split(' ').length;
      if (density > 0.05) {
        this.warnings.push(`High keyword density for "${keyword}" (${(density * 100).toFixed(1)}%)`);
      }
    });
  }

  private validateAccessibility(): void {
    if (!this.schema.mainEntity || !Array.isArray(this.schema.mainEntity)) return;

    this.schema.mainEntity.forEach((question, index) => {
      const questionNum = index + 1;
      
      // Check for proper heading structure in answers
      if (question.acceptedAnswer.text && question.acceptedAnswer.text.includes('<h')) {
        this.warnings.push(`Question ${questionNum}: Avoid using heading tags in answer text for proper accessibility`);
      }

      // Check for alt text requirements
      if (question.acceptedAnswer.text && question.acceptedAnswer.text.includes('<img') && 
          !question.acceptedAnswer.text.includes('alt=')) {
        this.errors.push(`Question ${questionNum}: Images in answer text must have alt attributes`);
      }
    });
  }
}

/**
 * Performance Testing Utilities
 */
export class FAQPerformanceTester {
  private metrics: FAQPerformanceMetrics[] = [];

  /**
   * Measure FAQ loading performance
   */
  async measureLoadTime<T>(
    operation: string,
    asyncOperation: () => Promise<T>
  ): Promise<{ result: T; metrics: FAQPerformanceMetrics }> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await asyncOperation();
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const metrics: FAQPerformanceMetrics = {
        operation,
        startTime,
        endTime,
        duration: endTime - startTime,
        memoryUsage: endMemory - startMemory
      };

      this.metrics.push(metrics);
      return { result, metrics };
    } catch (error) {
      const endTime = performance.now();
      const metrics: FAQPerformanceMetrics = {
        operation: `${operation} (failed)`,
        startTime,
        endTime,
        duration: endTime - startTime
      };
      
      this.metrics.push(metrics);
      throw error;
    }
  }

  /**
   * Get memory usage (when available)
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    if (this.metrics.length === 0) {
      return 'No performance metrics collected';
    }

    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const avgTime = totalTime / this.metrics.length;
    const slowestOperation = this.metrics.reduce((max, m) => 
      m.duration > max.duration ? m : max
    );

    return `
FAQ Performance Report
=====================
Total Operations: ${this.metrics.length}
Total Time: ${totalTime.toFixed(2)}ms
Average Time: ${avgTime.toFixed(2)}ms
Slowest Operation: ${slowestOperation.operation} (${slowestOperation.duration.toFixed(2)}ms)

Operations:
${this.metrics.map(m => 
  `- ${m.operation}: ${m.duration.toFixed(2)}ms${m.memoryUsage ? ` (${(m.memoryUsage / 1024).toFixed(1)}KB)` : ''}`
).join('\n')}
    `.trim();
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

/**
 * FAQ Search Testing
 */
export class FAQSearchTester {
  private faqs: ProcessedFAQ[];

  constructor(faqs: ProcessedFAQ[]) {
    this.faqs = faqs;
  }

  /**
   * Test search functionality with various queries
   */
  testSearchQueries(): { query: string; results: number; firstResult?: string }[] {
    const testQueries = [
      'virus removal',
      'password reset', 
      'how long',
      'guarantee',
      'emergency',
      'windows',
      'mobile service',
      'xyz123' // Non-existent query
    ];

    return testQueries.map(query => {
      const results = this.performMockSearch(query);
      return {
        query,
        results: results.length,
        firstResult: results[0]?.question
      };
    });
  }

  /**
   * Mock search implementation for testing
   */
  private performMockSearch(query: string): FAQSearchResult[] {
    const queryWords = query.toLowerCase().split(' ');
    
    return this.faqs
      .map(faq => {
        let score = 0;
        const questionLower = faq.question.toLowerCase();
        const answerLower = faq.answer.toLowerCase();
        
        queryWords.forEach(word => {
          if (questionLower.includes(word)) score += 2;
          if (answerLower.includes(word)) score += 1;
        });

        return {
          ...faq,
          relevanceScore: score,
          matchedFields: []
        } as FAQSearchResult;
      })
      .filter(result => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

/**
 * FAQ Content Quality Analyzer
 */
export class FAQQualityAnalyzer {
  private faqs: ProcessedFAQ[];

  constructor(faqs: ProcessedFAQ[]) {
    this.faqs = faqs;
  }

  /**
   * Analyze FAQ content quality
   */
  analyzeQuality(): {
    score: number;
    issues: string[];
    recommendations: string[];
    stats: {
      totalFAQs: number;
      avgQuestionLength: number;
      avgAnswerLength: number;
      categoriesUsed: string[];
      priorityDistribution: Record<number, number>;
    };
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Basic stats
    const stats = this.calculateStats();

    // Quality checks
    this.checkQuestionQuality(issues, recommendations);
    this.checkAnswerQuality(issues, recommendations);
    this.checkCategoryDistribution(issues, recommendations);
    this.checkPriorityDistribution(issues, recommendations);

    // Calculate score based on issues
    score -= issues.length * 5; // Subtract 5 points per issue
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      issues,
      recommendations,
      stats
    };
  }

  private calculateStats() {
    const questionLengths = this.faqs.map(faq => faq.question.length);
    const answerLengths = this.faqs.map(faq => faq.answer.length);
    const categories = [...new Set(this.faqs.map(faq => faq.category).filter(Boolean))];
    const priorities = this.faqs.reduce((acc, faq) => {
      const priority = faq.priority || 5;
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalFAQs: this.faqs.length,
      avgQuestionLength: questionLengths.reduce((a, b) => a + b, 0) / questionLengths.length,
      avgAnswerLength: answerLengths.reduce((a, b) => a + b, 0) / answerLengths.length,
      categoriesUsed: categories,
      priorityDistribution: priorities
    };
  }

  private checkQuestionQuality(issues: string[], recommendations: string[]): void {
    this.faqs.forEach((faq, index) => {
      // Check question length
      if (faq.question.length < 10) {
        issues.push(`Question ${index + 1}: Too short (${faq.question.length} chars)`);
      }
      if (faq.question.length > 150) {
        issues.push(`Question ${index + 1}: Too long (${faq.question.length} chars)`);
      }

      // Check question format
      if (!faq.question.endsWith('?')) {
        issues.push(`Question ${index + 1}: Should end with question mark`);
      }

      // Check for clarity
      const complexWords = ['utilize', 'facilitate', 'implement'];
      complexWords.forEach(word => {
        if (faq.question.toLowerCase().includes(word)) {
          recommendations.push(`Question ${index + 1}: Consider simpler language (${word})`);
        }
      });
    });
  }

  private checkAnswerQuality(issues: string[], recommendations: string[]): void {
    this.faqs.forEach((faq, index) => {
      // Check answer length
      if (faq.answer.length < 20) {
        issues.push(`Answer ${index + 1}: Too short (${faq.answer.length} chars)`);
      }
      if (faq.answer.length > 500) {
        recommendations.push(`Answer ${index + 1}: Consider breaking into multiple FAQs (${faq.answer.length} chars)`);
      }

      // Check for actionable information
      const actionWords = ['call', 'contact', 'schedule', 'visit'];
      const hasAction = actionWords.some(word => faq.answer.toLowerCase().includes(word));
      if (!hasAction && faq.category === 'booking') {
        recommendations.push(`Answer ${index + 1}: Consider adding call-to-action`);
      }
    });
  }

  private checkCategoryDistribution(issues: string[], recommendations: string[]): void {
    const categoryCount = this.faqs.reduce((acc, faq) => {
      const category = faq.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalFAQs = this.faqs.length;
    Object.entries(categoryCount).forEach(([category, count]) => {
      const percentage = (count / totalFAQs) * 100;
      if (percentage > 50) {
        recommendations.push(`Consider diversifying FAQ categories (${category}: ${percentage.toFixed(1)}%)`);
      }
    });

    const uncategorized = categoryCount['uncategorized'] || 0;
    if (uncategorized > 0) {
      issues.push(`${uncategorized} FAQs without categories`);
    }
  }

  private checkPriorityDistribution(issues: string[], recommendations: string[]): void {
    const withoutPriority = this.faqs.filter(faq => !faq.priority).length;
    if (withoutPriority > 0) {
      recommendations.push(`${withoutPriority} FAQs without explicit priority`);
    }

    const highPriority = this.faqs.filter(faq => (faq.priority || 5) >= 8).length;
    const percentage = (highPriority / this.faqs.length) * 100;
    if (percentage > 30) {
      recommendations.push(`High percentage of high-priority FAQs (${percentage.toFixed(1)}%)`);
    }
  }
}

/**
 * Integration Testing Helper
 */
export class FAQIntegrationTester {
  /**
   * Test complete FAQ workflow
   */
  async testWorkflow(location: string = 'Dallas'): Promise<{
    success: boolean;
    steps: Array<{ step: string; success: boolean; duration: number; error?: string }>;
  }> {
    const steps: Array<{ step: string; success: boolean; duration: number; error?: string }> = [];
    
    // Step 1: Load content collections
    await this.testStep('Load Content Collections', steps, async () => {
      // Mock content collection loading
      return mockFAQs;
    });

    // Step 2: Process location variables
    await this.testStep('Process Location Variables', steps, async () => {
      const { replaceLocationVariables } = await import('./faq-utils');
      return mockFAQs.map(faq => ({
        ...faq,
        question: replaceLocationVariables(faq.question, location),
        answer: replaceLocationVariables(faq.answer, location)
      }));
    });

    // Step 3: Generate schema
    await this.testStep('Generate Schema', steps, async () => {
      const { generateFAQSchema } = await import('./faq-utils');
      return generateFAQSchema(mockFAQs, { location });
    });

    // Step 4: Validate schema
    await this.testStep('Validate Schema', steps, async () => {
      const { generateFAQSchema, validateFAQSchema } = await import('./faq-utils');
      const schema = generateFAQSchema(mockFAQs, { location });
      const validation = validateFAQSchema(schema);
      if (!validation.isValid) {
        throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
      }
      return validation;
    });

    const allSuccessful = steps.every(step => step.success);
    return { success: allSuccessful, steps };
  }

  private async testStep<T>(
    stepName: string,
    steps: Array<{ step: string; success: boolean; duration: number; error?: string }>,
    operation: () => Promise<T>
  ): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      steps.push({ step: stepName, success: true, duration });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      steps.push({ 
        step: stepName, 
        success: false, 
        duration, 
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
}

/**
 * Export testing utilities
 */
export function createTestSuite() {
  return {
    validator: new FAQSchemaValidator,
    performance: new FAQPerformanceTester(),
    search: new FAQSearchTester(mockFAQs),
    quality: new FAQQualityAnalyzer(mockFAQs),
    integration: new FAQIntegrationTester(),
    mockData: mockFAQs
  };
}