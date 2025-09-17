import { z } from 'zod';

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  website: z.string().url().optional(),
  linkedIn: z.string().url().optional(),
  description: z.string().optional(),
  sector: z.string().optional(),
  subSector: z.string().optional(),
  employees: z.number().int().nonnegative().optional(),
  fundingStage: z.string().optional(),
  investmentInfo: z.unknown().optional(),
  associatedLeads: z.array(z.string()).optional(),
  aiInsights: z.string().optional(),
  newsFeed: z.unknown().optional(),
  createdAt: z.string()
});

export type Company = z.infer<typeof CompanySchema>;

export const CompanyCreateSchema = CompanySchema.omit({
  id: true,
  associatedLeads: true,
  aiInsights: true,
  newsFeed: true,
  createdAt: true
});

export type CompanyCreateInput = z.infer<typeof CompanyCreateSchema>;

export const CompanyEnrichmentSchema = z.object({
  companyId: z.string(),
  notes: z.string().optional(),
  enrichmentFields: z
    .array(z.enum(['summary', 'competitiveLandscape', 'technologyStack']))
    .optional()
});

export type CompanyEnrichmentPayload = z.infer<typeof CompanyEnrichmentSchema>;
