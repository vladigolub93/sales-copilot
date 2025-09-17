'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import Papa, { type ParseResult } from 'papaparse';
import { z } from 'zod';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import type { Database, LeadCreateInput, CompanyCreateInput, LeadCSVRow } from '@types';
import { LeadCreateSchema, LeadCSVRowSchema } from '@types';
import { CompanyCreateSchema } from '@types';
import { supabase } from '@lib/supabase';
import { parseLeadCsv } from '@lib/csv';

const CompanyCsvRowSchema = z.object({
  name: z.string().min(1),
  website: z.string().url().optional(),
  linkedIn: z.string().url().optional(),
  description: z.string().optional(),
  sector: z.string().optional(),
  subSector: z.string().optional(),
  employees: z.union([z.number(), z.string()]).optional(),
  fundingStage: z.string().optional(),
  investmentInfo: z.unknown().optional()
});

type EntityType = 'lead' | 'company';

interface CsvUploaderProps {
  entity?: EntityType;
  allowEntitySwitch?: boolean;
  onComplete?: (result: { entity: EntityType; inserted: number }) => void;
}

export function CSVUploader({ entity = 'lead', allowEntitySwitch = true, onComplete }: CsvUploaderProps) {
  const [selectedEntity, setSelectedEntity] = useState<EntityType>(entity);
  const [isUploading, setIsUploading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState(0);
  const [insertedCount, setInsertedCount] = useState(0);

  const activeEntity = allowEntitySwitch ? selectedEntity : entity;

  const headerHint = useMemo(() => {
    return activeEntity === 'lead'
      ? 'Headers: fullName, title, email, phone, companyName, associatedCompanyId, linkedIn, personalNotes'
      : 'Headers: name, website, linkedIn, description, sector, subSector, employees, fundingStage, investmentInfo';
  }, [activeEntity]);

  const resetState = () => {
    setResultMessage(null);
    setErrorMessage(null);
    setParsedCount(0);
    setInsertedCount(0);
  };

  const handleFile = async (file: File) => {
    resetState();
    setIsUploading(true);

    try {
      if (activeEntity === 'lead') {
        await processLeadCsv(file);
      } else {
        await processCompanyCsv(file);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process CSV.');
    } finally {
      setIsUploading(false);
    }
  };

  const processLeadCsv = async (file: File) => {
    const rows = await parseLeadCsv(file);
    setParsedCount(rows.length);

    if (rows.length === 0) {
      setResultMessage('No rows detected in CSV.');
      return;
    }

    const validated = rows.map((row) => {
      const parsed = LeadCSVRowSchema.parse(row);
      return LeadCreateSchema.parse({
        fullName: parsed.fullName,
        title: parsed.title,
        email: parsed.email,
        phone: parsed.phone,
        companyName: parsed.companyName,
        associatedCompanyId: parsed.associatedCompanyId,
        linkedIn: parsed.linkedIn,
        personalNotes: parsed.personalNotes
      });
    });

    const payload: Database['public']['Tables']['leads']['Insert'][] = validated.map((lead) => ({
      full_name: lead.fullName,
      title: lead.title ?? null,
      email: lead.email ?? null,
      phone: lead.phone ?? null,
      company_name: lead.companyName ?? null,
      associated_company_id: lead.associatedCompanyId ?? null,
      linkedin: lead.linkedIn ?? null,
      personal_notes: lead.personalNotes ?? null
    }));

    const { error } = await supabase.from('leads').insert(payload as never);
    if (error) {
      throw error;
    }

    setInsertedCount(payload.length);
    setResultMessage(`Inserted ${payload.length} lead${payload.length === 1 ? '' : 's'} successfully.`);
    onComplete?.({ entity: 'lead', inserted: payload.length });
  };

  const processCompanyCsv = async (file: File) => {
    const rows = await parseCompanyCsv(file);
    setParsedCount(rows.length);

    if (rows.length === 0) {
      setResultMessage('No rows detected in CSV.');
      return;
    }

    const validated = rows.map((row) => {
      const parsed = CompanyCsvRowSchema.parse(row);
      const employeesValue = parseEmployeeCount(parsed.employees);

      return CompanyCreateSchema.parse({
        name: parsed.name,
        website: parsed.website,
        linkedIn: parsed.linkedIn,
        description: parsed.description,
        sector: parsed.sector,
        subSector: parsed.subSector,
        employees: employeesValue,
        fundingStage: parsed.fundingStage,
        investmentInfo: parsed.investmentInfo
      });
    });

    const payload: Database['public']['Tables']['companies']['Insert'][] = validated.map((company) => ({
      name: company.name,
      website: company.website ?? null,
      linkedin: company.linkedIn ?? null,
      description: company.description ?? null,
      sector: company.sector ?? null,
      sub_sector: company.subSector ?? null,
      employees: company.employees ?? null,
      funding_stage: company.fundingStage ?? null,
      investment_info: company.investmentInfo ?? null
    }));

    const { error } = await supabase.from('companies').insert(payload as never);
    if (error) {
      throw error;
    }

    setInsertedCount(payload.length);
    setResultMessage(`Inserted ${payload.length} compan${payload.length === 1 ? 'y' : 'ies'} successfully.`);
    onComplete?.({ entity: 'company', inserted: payload.length });
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await handleFile(file);
    event.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV uploader</CardTitle>
        <CardDescription>Import records directly into Supabase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {allowEntitySwitch ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={activeEntity === 'lead' ? 'default' : 'ghost'}
              onClick={() => setSelectedEntity('lead')}
              disabled={isUploading}
            >
              Leads
            </Button>
            <Button
              type="button"
              variant={activeEntity === 'company' ? 'default' : 'ghost'}
              onClick={() => setSelectedEntity('company')}
              disabled={isUploading}
            >
              Companies
            </Button>
          </div>
        ) : null}

        <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-300 transition hover:border-brand-400 hover:text-white">
          <input type="file" className="hidden" accept=".csv" onChange={onFileChange} disabled={isUploading} />
          <span className="font-semibold">Drop CSV or browse files</span>
          <span className="text-xs text-slate-500">{headerHint}</span>
        </label>

        <div className="text-sm text-slate-400">
          <p>Rows parsed: {parsedCount}</p>
          <p>Rows inserted: {insertedCount}</p>
        </div>

        {resultMessage ? <p className="text-sm text-emerald-400">{resultMessage}</p> : null}
        {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}

        <Button type="button" variant="ghost" onClick={resetState} disabled={isUploading}>
          Reset state
        </Button>
      </CardContent>
    </Card>
  );
}

async function parseCompanyCsv(file: File) {
  return new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader(header: string) {
        return header.trim();
      },
      complete(result: ParseResult<Record<string, string>>) {
        if (result.errors.length > 0) {
          reject(result.errors[0]);
          return;
        }

        const normalized = result.data.map((row) => ({
          name: row.name ?? row.Name,
          website: row.website ?? row.Website,
          linkedIn: row.linkedIn ?? row.LinkedIn ?? row.linkedin,
          description: row.description ?? row.Description,
          sector: row.sector ?? row.Sector,
          subSector: row.subSector ?? row.SubSector ?? row.subsector,
          employees: row.employees ?? row.Employees,
          fundingStage: row.fundingStage ?? row.FundingStage ?? row.funding_stage,
          investmentInfo: row.investmentInfo ?? row.InvestmentInfo ?? row.investment_info
        }));
        resolve(normalized);
      },
      error(error) {
        reject(error);
      }
    });
  });
}

function parseEmployeeCount(value: string | number | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const numeric = parseInt(value.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  return undefined;
}
