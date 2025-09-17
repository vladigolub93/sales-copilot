import { NextResponse } from 'next/server';
import { createLead, getLeads } from '@lib/server/leads';
import type { LeadCreateInput } from '@types/lead';

export async function GET() {
  const leads = await getLeads();
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as LeadCreateInput;
  await createLead(payload);
  return NextResponse.json({ ok: true }, { status: 201 });
}
