import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@lib/clients/openai';
import { getSupabaseServiceClient } from '@lib/server/supabase';
import { COMPANY_ENRICHMENT_PROMPT } from '@lib/prompts';
import { logIntegrationError } from '@lib/utils/logger';
import type { CompanyEnrichmentPayload } from '@types';

export async function POST(request: Request) {
  const payload = (await request.json()) as CompanyEnrichmentPayload;

  try {
    const openai = getOpenAIClient();
    const supabase = getSupabaseServiceClient();

    const companyResponse = await supabase
      .from('companies')
      .select('id, name, website, linkedin, description, sector, sub_sector, employees, ai_insights')
      .eq('id', payload.companyId)
      .maybeSingle();

    if (companyResponse.error) {
      throw companyResponse.error;
    }

    const company = companyResponse.data;
    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: COMPANY_ENRICHMENT_PROMPT },
        { role: 'user', content: JSON.stringify({ company, notes: payload.notes, enrichmentFields: payload.enrichmentFields }) }
      ]
    });

    const aiInsights = completion.output_text ?? 'AI enrichment placeholder. Replace with OpenAI response.';

    await supabase
      .from('companies')
      .update({ ai_insights: aiInsights })
      .eq('id', payload.companyId);

    return NextResponse.json({ company: { id: payload.companyId, aiInsights } });
  } catch (error) {
    logIntegrationError('company-enrichment', error);
    return NextResponse.json(
      {
        error: 'Failed to enrich company. Verify OpenAI and Supabase configuration.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
