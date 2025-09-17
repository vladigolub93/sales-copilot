'use client';

import { ChangeEvent } from 'react';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { useCsvUpload } from '@hooks/useCsvUpload';

interface UploadCsvFormProps {
  onUpload?: (file: File) => Promise<void> | void;
}

export function UploadCsvForm({ onUpload }: UploadCsvFormProps) {
  const { handleFile, isUploading, rows, error } = useCsvUpload();

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await handleFile(file);
    await onUpload?.(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk import via CSV</CardTitle>
        <CardDescription>
          Upload a CSV with lead contact details. Parsed rows are staged locally before pushing into Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-300 transition hover:border-brand-400 hover:text-white">
          <input type="file" className="hidden" accept=".csv" onChange={onFileChange} />
          <span className="font-semibold">Drop CSV or browse files</span>
          <span className="text-xs text-slate-500">
            Expected headers: fullName, title, email, phone, companyName, associatedCompanyId, linkedIn, personalNotes
          </span>
        </label>
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{rows.length} rows staged</span>
          {error ? <span className="text-red-400">{error}</span> : null}
        </div>
        <Button disabled>{isUploading ? 'Parsing…' : 'Push to Supabase (wire later)'}</Button>
      </CardContent>
    </Card>
  );
}
