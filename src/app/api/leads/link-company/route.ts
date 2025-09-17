import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@lib/server/supabase';
import { logIntegrationError } from '@lib/utils/logger';

const requestSchema = z.object({
  leadId: z.string().min(1, 'leadId is required'),
  companyId: z.string().min(1).nullable(),
  notes: z.string().nullable()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { leadId, companyId, notes } = parsed.data;

  try {
    const supabase = getSupabaseServiceClient();

    const existing = await supabase
      .from('leads')
      .select('personal_notes')
      .eq('id', leadId)
      .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    if (!existing.data) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    let personal_notes: string | null = existing.data.personal_notes ?? null;

    if (notes && notes.trim().length > 0) {
      const trimmed = notes.trim();
      personal_notes = personal_notes
        ? `${personal_notes}\n\nLinked company note: ${trimmed}`
        : `Linked company note: ${trimmed}`;
    }

    const { error, data } = await supabase
      .from('leads')
      .update({
        associated_company_id: companyId,
        personal_notes
      })
      .eq('id', leadId)
      .select('id, associated_company_id, personal_notes')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({ lead: data });
  } catch (error) {
    logIntegrationError('link-company', error);
    return NextResponse.json(
      {
        error: 'Failed to link company to lead.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
