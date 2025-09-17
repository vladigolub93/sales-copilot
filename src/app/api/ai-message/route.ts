import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@lib/server/supabase';
import { getOpenAIClient } from '@lib/clients/openai';
import { logIntegrationError } from '@lib/utils/logger';

const requestSchema = z.object({
  leadId: z.string().min(1, 'leadId is required')
});

const outreachSchema = z.object({
  email: z.string().min(1),
  linkedIn: z.string().min(1),
  whatsapp: z.string().min(1)
});

const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['email', 'linkedIn', 'whatsapp'],
  properties: {
    email: { type: 'string' },
    linkedIn: { type: 'string' },
    whatsapp: { type: 'string' }
  }
};

export async function POST(request: Request) {
  const body = await request.json();
  const parseResult = requestSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
  }

  const { leadId } = parseResult.data;

  try {
    const supabase = getSupabaseServiceClient();
    const openai = getOpenAIClient();

    const leadResponse = await supabase
      .from('leads')
      .select(
        'id, full_name, title, email, phone, company_name, associated_company_id, linkedIn:linkedin, personal_notes, ai_insights'
      )
      .eq('id', leadId)
      .maybeSingle();

    if (leadResponse.error) {
      throw leadResponse.error;
    }

    const lead = leadResponse.data;

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    let company: Record<string, unknown> | null = null;

    if (lead.associated_company_id) {
      const companyResponse = await supabase
        .from('companies')
        .select(
          'id, name, website, linkedin, description, sector, sub_sector, employees, funding_stage, ai_insights, investment_info'
        )
        .eq('id', lead.associated_company_id)
        .maybeSingle();

      if (companyResponse.error) {
        throw companyResponse.error;
      }

      company = companyResponse.data ?? null;
    }

    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            'You are Sales Copilot, crafting concise, personalized outreach messages. Return JSON only. Tone: warm, professional, value-driven.'
        },
        {
          role: 'user',
          content: JSON.stringify({
            lead: {
              id: lead.id,
              fullName: lead.full_name,
              title: lead.title,
              email: lead.email,
              phone: lead.phone,
              linkedIn: lead.linkedIn,
              companyName: lead.company_name,
              personalNotes: lead.personal_notes,
              aiInsights: lead.ai_insights
            },
            company
          })
        },
        {
          role: 'assistant',
          content:
            'Craft short outreach for three channels: Email (3 sentences), LinkedIn (2 sentences), WhatsApp (one friendly note + CTA). Focus on discovery call value and personalization.'
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'outreach_messages',
          schema: jsonSchema
        }
      }
    });

    const output = completion.output_text;

    if (!output) {
      throw new Error('OpenAI did not return any text output.');
    }

    let parsedOutput: unknown;
    try {
      parsedOutput = JSON.parse(output);
    } catch (error) {
      throw new Error('Unable to parse OpenAI response as JSON.');
    }

    const messagesResult = outreachSchema.safeParse(parsedOutput);

    if (!messagesResult.success) {
      throw new Error(`Invalid outreach payload: ${messagesResult.error.message}`);
    }

    console.info('ai-message-generated', {
      leadId,
      hasCompany: Boolean(company),
      channels: Object.keys(messagesResult.data)
    });

    return NextResponse.json({ leadId, messages: messagesResult.data });
  } catch (error) {
    logIntegrationError('ai-message', error);
    return NextResponse.json(
      {
        error: 'Failed to generate outreach messages.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
