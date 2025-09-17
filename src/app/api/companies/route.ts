import { NextResponse } from 'next/server';
import { createCompany, getCompanies } from '@lib/server/companies';
import type { CompanyCreateInput } from '@types/company';

export async function GET() {
  const companies = await getCompanies();
  return NextResponse.json({ companies });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CompanyCreateInput;
  await createCompany(payload);
  return NextResponse.json({ ok: true }, { status: 201 });
}
