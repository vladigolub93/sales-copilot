import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@lib/server/supabase';
import type { LeadCSVRow } from '@types';

export async function POST(request: Request) {
  const { rows } = (await request.json()) as { rows: LeadCSVRow[] };
  const supabase = getSupabaseServiceClient();

  const payload = rows.map((row) => ({
    full_name: row.fullName,
    title: row.title,
    email: row.email,
    phone: row.phone,
    company_name: row.companyName,
    associated_company_id: row.associatedCompanyId,
    linkedin: row.linkedIn,
    personal_notes: row.personalNotes
  }));

  const { data, error } = await supabase.from('leads').insert(payload).select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: data?.length ?? 0 });
}
