import { z } from 'zod';

export const LeadSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  title: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  associatedCompanyId: z.string().optional(),
  linkedIn: z.string().url().optional(),
  personalNotes: z.string().optional(),
  aiInsights: z.string().optional(),
  newsFeed: z.unknown().optional(),
  messages: z.unknown().optional(),
  createdAt: z.string()
});

export type Lead = z.infer<typeof LeadSchema>;

export const LeadCreateSchema = LeadSchema.omit({
  id: true,
  aiInsights: true,
  newsFeed: true,
  messages: true,
  createdAt: true
});

export type LeadCreateInput = z.infer<typeof LeadCreateSchema>;

export const LeadEnrichmentSchema = z.object({
  leadId: z.string(),
  notes: z.string().optional(),
  enrichmentFields: z
    .array(z.enum(['summary', 'persona', 'nextSteps', 'firmographics']))
    .optional()
});

export type LeadEnrichmentPayload = z.infer<typeof LeadEnrichmentSchema>;

export const LeadCSVRowSchema = z.object({
  fullName: z.string(),
  title: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  associatedCompanyId: z.string().optional(),
  linkedIn: z.string().optional(),
  personalNotes: z.string().optional()
});

export type LeadCSVRow = z.infer<typeof LeadCSVRowSchema>;
