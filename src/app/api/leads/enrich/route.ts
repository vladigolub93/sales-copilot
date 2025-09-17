import { NextResponse } from 'next/server';
import { getOpenAIClient, extractOutputText } from '@lib/clients/openai';
import { getSupabaseServiceClient } from '@lib/server/supabase';
import type { Database } from '@types';
import { LEAD_ENRICHMENT_PROMPT } from '@lib/prompts';
import { logIntegrationError } from '@lib/utils/logger';
import type { LeadEnrichmentPayload } from '@types';

export async function POST(request: Request) {
  const payload = (await request.json()) as LeadEnrichmentPayload;

  try {
    const openai = getOpenAIClient();
    const supabase = getSupabaseServiceClient();

    const leadResponse = await supabase
      .from('leads')
      .select('id, full_name, title, email, phone, company_name, linkedin, personal_notes, ai_insights')
      .eq('id', payload.leadId)
      .maybeSingle();

    if (leadResponse.error) {
      throw leadResponse.error;
    }

    type LeadRow = Database['public']['Tables']['leads']['Row'];
    const lead = leadResponse.data as LeadRow | null;

    const systemPrompt = LEAD_ENRICHMENT_PROMPT;
    const userPrompt = JSON.stringify({ lead, notes: payload.notes, enrichmentFields: payload.enrichmentFields });

    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    const aiInsights = extractOutputText(completion) ?? 'AI enrichment placeholder. Replace with OpenAI response.';

    const updatePayload: Database['public']['Tables']['leads']['Update'] = {
      ai_insights: aiInsights
    };

    await supabase
      .from('leads')
      .update(updatePayload as never)
      .eq('id', payload.leadId);

    return NextResponse.json({ lead: { id: payload.leadId, aiInsights } });
  } catch (error) {
    logIntegrationError('lead-enrichment', error);
    return NextResponse.json(
      {
        error: 'Failed to enrich lead. Check OpenAI and Supabase credentials.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
