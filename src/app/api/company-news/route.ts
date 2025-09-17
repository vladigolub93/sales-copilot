import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@lib/server/supabase';
import { getOpenAIClient } from '@lib/clients/openai';
import { buildCompanyNewsPrompt } from '@lib/prompts';
import { logIntegrationError } from '@lib/utils/logger';

const requestSchema = z.object({
  companyId: z.string().optional(),
  companyName: z.string().optional()
});

const newsSchema = z.object({
  items: z
    .array(
      z.object({
        date: z.string().min(1),
        title: z.string().min(1),
        summary: z.string().min(1)
      })
    )
    .optional()
});

const jsonSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['date', 'title', 'summary'],
        properties: {
          date: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string' }
        }
      }
    }
  }
};

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { companyId, companyName } = parsed.data;

  if (!companyId && !companyName) {
    return NextResponse.json({ error: 'Provide a companyId or companyName.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceClient();
    const openai = getOpenAIClient();

    let resolvedName = companyName ?? null;
    let context: string | undefined;

    if (companyId) {
      const companyResponse = await supabase
        .from('companies')
        .select('name, description, sector, funding_stage')
        .eq('id', companyId)
        .maybeSingle();

      if (companyResponse.error) {
        throw companyResponse.error;
      }

      if (!companyResponse.data) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }

      resolvedName = resolvedName ?? companyResponse.data.name ?? null;
      const fragments = [
        companyResponse.data.description,
        companyResponse.data.sector,
        companyResponse.data.funding_stage
      ].filter(Boolean);
      context = fragments.length ? fragments.join(' | ') : undefined;
    }

    if (!resolvedName) {
      return NextResponse.json({ error: 'Unable to resolve company name.' }, { status: 400 });
    }

    const prompt = buildCompanyNewsPrompt(resolvedName, context);

    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: 'You are Sales Copilot, summarizing external news for revenue teams. Respond as JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'company_news',
          schema: jsonSchema
        }
      }
    });

    const output = completion.output_text ?? '{}';
    const parsedOutput = JSON.parse(output) as unknown;
    const validation = newsSchema.safeParse(parsedOutput);

    if (!validation.success) {
      throw new Error(`Invalid news payload: ${validation.error.message}`);
    }

    const items = validation.data.items ?? [];

    console.info('company-news-generated', {
      companyId: companyId ?? 'n/a',
      companyName: resolvedName,
      count: items.length
    });

    return NextResponse.json({ items });
  } catch (error) {
    logIntegrationError('company-news', error);
    return NextResponse.json(
      {
        error: 'Failed to gather company news.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
