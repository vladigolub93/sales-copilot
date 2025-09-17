import type { Company, CompanyCreateInput } from '@types';
import { getSupabaseServiceClient } from './supabase';

export async function getCompanies(): Promise<Company[]> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('companies')
      .select(
        'id, name, website, linkedin, description, sector, sub_sector, employees, funding_stage, investment_info, associated_leads, ai_insights, news_feed, created_at'
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      name: row.name ?? '',
      website: row.website ?? undefined,
      linkedIn: row.linkedin ?? undefined,
      description: row.description ?? undefined,
      sector: row.sector ?? undefined,
      subSector: row.sub_sector ?? undefined,
      employees: row.employees ?? undefined,
      fundingStage: row.funding_stage ?? undefined,
      investmentInfo: row.investment_info ?? undefined,
      associatedLeads: (row.associated_leads as string[] | null) ?? undefined,
      aiInsights: row.ai_insights ?? undefined,
      newsFeed: row.news_feed ?? undefined,
      createdAt: row.created_at ?? new Date().toISOString()
    } satisfies Company));
  } catch (error) {
    console.warn('Falling back to demo companies. Configure Supabase to see real data.', error);
    return demoCompanies;
  }
}

export async function createCompany(input: CompanyCreateInput) {
  const supabase = getSupabaseServiceClient();
  const payload = {
    name: input.name,
    website: input.website,
    linkedin: input.linkedIn,
    description: input.description,
    sector: input.sector,
    sub_sector: input.subSector,
    employees: input.employees,
    funding_stage: input.fundingStage,
    investment_info: input.investmentInfo
  };

  const { data, error } = await supabase.from('companies').insert(payload).select('id').maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

const demoCompanies: Company[] = [
  {
    id: 'demo-company-1',
    name: 'Analytical Engines Inc.',
    website: 'https://analytical.engines',
    linkedIn: 'https://linkedin.com/company/analytical-engines',
    description: 'Industrial-grade analytics platform enhanced with AI copilots.',
    sector: 'Artificial Intelligence',
    subSector: 'Analytics',
    employees: 320,
    fundingStage: 'Series C',
    investmentInfo: { investors: ['Turing Ventures', 'Ada Capital'] },
    associatedLeads: ['demo-1'],
    aiInsights: 'Cross-sell advanced automation workflows and enterprise support.',
    newsFeed: [{ headline: 'Announces APAC expansion', publishedAt: new Date().toISOString() }],
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-company-2',
    name: 'Compiler Systems',
    website: 'https://compiler.systems',
    linkedIn: 'https://linkedin.com/company/compiler-systems',
    description: 'Developer tooling company modernizing CI/CD pipelines.',
    sector: 'Developer Tools',
    subSector: 'DevOps',
    employees: 95,
    fundingStage: 'Series B',
    investmentInfo: { investors: ['Grace Labs', 'Navy Fund'] },
    associatedLeads: ['demo-2'],
    aiInsights: 'Emphasize integrations and performance gains in demos.',
    newsFeed: [{ headline: 'Launches AI-assisted code reviews', publishedAt: new Date().toISOString() }],
    createdAt: new Date(Date.now() - 172_800_000).toISOString()
  }
];
