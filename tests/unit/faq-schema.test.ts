import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { FAQSchema } from '../../src/schemas/faq-schema';

// FAQ Schema Validation Test Suite
describe('FAQ Schema Validation', () => {
  // Test valid FAQ entry
  it('should validate a complete FAQ entry', () => {
    const validFAQ = {
      question: "How do I reset my computer password?",
      answer: "Our technicians can help you reset your computer password securely.",
      category: "Security",
      priority: 5,
      locations: ["Dallas", "Fort Worth"],
      keywords: ["password reset", "computer security"]
    };

    const result = FAQSchema.safeParse(validFAQ);
    expect(result.success).toBe(true);
  });

  // Test invalid FAQ entries
  it('should fail validation for incomplete FAQ', () => {
    const invalidFAQ = {
      question: "", // Empty question
      answer: "Partial answer",
      category: "Invalid Category"
    };

    const result = FAQSchema.safeParse(invalidFAQ);
    expect(result.success).toBe(false);
  });

  // Test location constraints
  it('should validate location array constraints', () => {
    const validFAQ = {
      question: "Can you service my computer?",
      answer: "We provide comprehensive computer services.",
      category: "Services",
      priority: 3,
      locations: ["Dallas", "Plano", "Frisco"],
      keywords: ["computer service"]
    };

    const result = FAQSchema.safeParse(validFAQ);
    expect(result.success).toBe(true);
    expect(result.data?.locations.length).toBeLessThanOrEqual(5);
  });

  // Test priority range
  it('should enforce priority range', () => {
    const invalidPriorityFAQ = {
      question: "Test Priority",
      answer: "Priority should be 1-10",
      category: "General",
      priority: 11, // Out of range
      locations: ["Dallas"],
      keywords: ["test"]
    };

    const result = FAQSchema.safeParse(invalidPriorityFAQ);
    expect(result.success).toBe(false);
  });

  // Test keyword validation
  it('should validate keywords', () => {
    const validFAQ = {
      question: "How do computer viruses spread?",
      answer: "Computer viruses can spread through email, downloads, and infected drives.",
      category: "Security",
      priority: 7,
      locations: ["Dallas"],
      keywords: ["virus", "computer security", "malware"]
    };

    const result = FAQSchema.safeParse(validFAQ);
    expect(result.success).toBe(true);
    expect(result.data?.keywords.length).toBeGreaterThan(0);
  });
});