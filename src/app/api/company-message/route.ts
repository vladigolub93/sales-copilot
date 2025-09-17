import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@lib/server/supabase';
import { getOpenAIClient } from '@lib/clients/openai';
import { logIntegrationError } from '@lib/utils/logger';

const requestSchema = z.object({
  companyId: z.string().min(1, 'companyId is required')
});

const messageSchema = z.object({
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
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { companyId } = parsed.data;

  try {
    const supabase = getSupabaseServiceClient();
    const openai = getOpenAIClient();

    const companyResponse = await supabase
      .from('companies')
      .select(
        'id, name, website, linkedin, description, sector, sub_sector, employees, funding_stage, ai_insights, investment_info'
      )
      .eq('id', companyId)
      .maybeSingle();

    if (companyResponse.error) {
      throw companyResponse.error;
    }

    if (!companyResponse.data) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            'You are Sales Copilot, crafting concise account-based outreach. Respond as JSON.'
        },
        {
          role: 'user',
          content: JSON.stringify({ company: companyResponse.data })
        },
        {
          role: 'assistant',
          content:
            'Create three short outreach messages (email, LinkedIn, WhatsApp) referencing company context and urging a discovery conversation.'
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'company_outreach',
          schema: jsonSchema
        }
      }
    });

    const output = completion.output_text ?? '{}';
    const parsedOutput = JSON.parse(output) as unknown;
    const validation = messageSchema.safeParse(parsedOutput);

    if (!validation.success) {
      throw new Error(`Invalid outreach payload: ${validation.error.message}`);
    }

    return NextResponse.json({ messages: validation.data });
  } catch (error) {
    logIntegrationError('company-message', error);
    return NextResponse.json(
      {
        error: 'Failed to generate company outreach.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
