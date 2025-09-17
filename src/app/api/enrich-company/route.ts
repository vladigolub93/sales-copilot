import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@lib/server/supabase';
import { getOpenAIClient } from '@lib/clients/openai';
import { COMPANY_ENRICHMENT_PROMPT } from '@lib/prompts';
import { logIntegrationError } from '@lib/utils/logger';

const requestSchema = z.object({
  companyId: z.string().min(1, 'companyId is required')
});

const enrichmentSchema = z.object({
  linkedIn: z.string().trim().optional(),
  description: z.string().trim().optional(),
  sector: z.string().trim().optional(),
  subSector: z.string().trim().optional(),
  employees: z.union([z.number(), z.string()]).optional(),
  fundingStage: z.string().trim().optional(),
  investmentInfo: z.unknown().optional()
});

const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    linkedIn: { type: 'string' },
    description: { type: 'string' },
    sector: { type: 'string' },
    subSector: { type: 'string' },
    employees: { anyOf: [{ type: 'integer' }, { type: 'string' }] },
    fundingStage: { type: 'string' },
    investmentInfo: {}
  }
};

export async function POST(request: Request) {
  const body = await request.json();
  const parseResult = requestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
  }

  const { companyId } = parseResult.data;

  try {
    const supabase = getSupabaseServiceClient();
    const openai = getOpenAIClient();

    const companyResponse = await supabase
      .from('companies')
      .select('id, name, website, linkedin, description, sector, sub_sector, employees, funding_stage, investment_info')
      .eq('id', companyId)
      .maybeSingle();

    if (companyResponse.error) {
      throw companyResponse.error;
    }

    if (!companyResponse.data) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const baseCompany = companyResponse.data;

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: `${COMPANY_ENRICHMENT_PROMPT}\nRespond strictly with JSON matching the provided schema.` },
        {
          role: 'user',
          content: JSON.stringify({
            company: baseCompany,
            enrichFields: ['linkedIn', 'description', 'sector', 'subSector', 'employees', 'fundingStage', 'investmentInfo']
          })
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'company_enrichment',
          schema: jsonSchema
        }
      }
    });

    const outputText = response.output_text;

    if (!outputText) {
      throw new Error('OpenAI response did not include JSON output');
    }

    let parsedOutput: unknown;
    try {
      parsedOutput = JSON.parse(outputText);
    } catch (error) {
      throw new Error('Failed to parse OpenAI JSON response');
    }

    const enrichment = enrichmentSchema.safeParse(parsedOutput);

    if (!enrichment.success) {
      throw new Error(`Invalid enrichment payload: ${enrichment.error.message}`);
    }

    const { linkedIn, description, sector, subSector, fundingStage, investmentInfo } = enrichment.data;
    let employees: number | undefined;

    if (typeof enrichment.data.employees === 'number') {
      employees = enrichment.data.employees;
    } else if (typeof enrichment.data.employees === 'string') {
      const numeric = parseInt(enrichment.data.employees.replace(/[^0-9]/g, ''), 10);
      employees = Number.isFinite(numeric) ? numeric : undefined;
    }

    const updatePayload = {
      linkedin: linkedIn ?? baseCompany.linkedin ?? null,
      description: description ?? baseCompany.description ?? null,
      sector: sector ?? baseCompany.sector ?? null,
      sub_sector: subSector ?? baseCompany.sub_sector ?? null,
      employees: employees ?? baseCompany.employees ?? null,
      funding_stage: fundingStage ?? baseCompany.funding_stage ?? null,
      investment_info: investmentInfo ?? baseCompany.investment_info ?? null
    };

    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update(updatePayload)
      .eq('id', companyId)
      .select(
        'id, name, website, linkedin, description, sector, sub_sector, employees, funding_stage, investment_info'
      )
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    console.info('company-enrichment-result', {
      companyId,
      enrichment: enrichment.data
    });

    return NextResponse.json({ company: updatedCompany });
  } catch (error) {
    logIntegrationError('enrich-company', error);
    return NextResponse.json(
      {
        error: 'Failed to enrich company.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
