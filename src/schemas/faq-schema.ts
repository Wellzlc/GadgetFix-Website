import { z } from 'zod';

// Allowed FAQ Categories
const FAQCategories = [
  "Security", 
  "Services", 
  "Performance", 
  "Maintenance", 
  "General"
] as const;

// Allowed Locations
const ValidLocations = [
  "Dallas", "Fort Worth", "Plano", 
  "Frisco", "McKinney", "Arlington", 
  "Irving"
] as const;

export const FAQSchema = z.object({
  question: z.string()
    .min(10, { message: "Question must be at least 10 characters" })
    .max(120, { message: "Question cannot exceed 120 characters" }),
  
  answer: z.string()
    .min(20, { message: "Answer must be at least 20 characters" })
    .max(280, { message: "Answer cannot exceed 280 characters" }),
  
  category: z.enum(FAQCategories),
  
  priority: z.number()
    .int()
    .min(1, { message: "Priority must be between 1-10" })
    .max(10, { message: "Priority must be between 1-10" }),
  
  locations: z.array(z.enum(ValidLocations))
    .min(1, { message: "At least one location is required" })
    .max(5, { message: "Maximum 5 locations allowed" }),
  
  keywords: z.array(z.string())
    .min(1, { message: "At least one keyword is required" })
    .max(5, { message: "Maximum 5 keywords allowed" })
});