import type { Lead, LeadCreateInput } from '@types/lead';
import { getSupabaseServiceClient } from './supabase';

export async function getLeads(): Promise<Lead[]> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('leads')
      .select(
        'id, full_name, title, email, phone, company_name, associated_company_id, linkedin, personal_notes, ai_insights, news_feed, messages, created_at'
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      fullName: row.full_name ?? '',
      title: row.title ?? undefined,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      companyName: row.company_name ?? undefined,
      associatedCompanyId: row.associated_company_id ?? undefined,
      linkedIn: row.linkedin ?? undefined,
      personalNotes: row.personal_notes ?? undefined,
      aiInsights: row.ai_insights ?? undefined,
      newsFeed: row.news_feed ?? undefined,
      messages: row.messages ?? undefined,
      createdAt: row.created_at ?? new Date().toISOString()
    } satisfies Lead));
  } catch (error) {
    console.warn('Falling back to demo leads. Configure Supabase to see real data.', error);
    return demoLeads;
  }
}

export async function createLead(input: LeadCreateInput) {
  const supabase = getSupabaseServiceClient();
  const payload = {
    full_name: input.fullName,
    title: input.title,
    email: input.email,
    phone: input.phone,
    company_name: input.companyName,
    associated_company_id: input.associatedCompanyId,
    linkedin: input.linkedIn,
    personal_notes: input.personalNotes
  };

  const { data, error } = await supabase.from('leads').insert(payload).select('id').maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

const demoLeads: Lead[] = [
  {
    id: 'demo-1',
    fullName: 'Ada Lovelace',
    title: 'Head of Data Strategy',
    email: 'ada@example.com',
    phone: '+1-555-0100',
    companyName: 'Analytical Engines Inc.',
    associatedCompanyId: 'demo-company-1',
    linkedIn: 'https://linkedin.com/in/ada-lovelace',
    personalNotes: 'Excited about AI copilots for analytics.',
    aiInsights: 'High affinity for automation. Recommend tailored analytics demo.',
    newsFeed: [{ headline: 'Analytical Engines raises Series C', publishedAt: new Date().toISOString() }],
    messages: [
      {
        channel: 'email',
        subject: 'Intro to Sales Copilot',
        sentAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-2',
    fullName: 'Grace Hopper',
    title: 'CTO',
    email: 'grace@example.com',
    phone: '+1-555-0101',
    companyName: 'Compiler Systems',
    associatedCompanyId: 'demo-company-2',
    linkedIn: 'https://linkedin.com/in/grace-hopper',
    personalNotes: 'Wants to modernize sales stack by Q3.',
    aiInsights: 'Focus on efficiency. Pitch integration with existing tooling.',
    newsFeed: [{ headline: 'Compiler Systems launches new code platform', publishedAt: new Date().toISOString() }],
    messages: [
      {
        channel: 'call',
        notes: 'Requested follow-up with solutions engineer.',
        occurredAt: new Date().toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 86_400_000).toISOString()
  }
];
