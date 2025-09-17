'use client';

import { useState } from 'react';
import type { LeadCSVRow } from '@types';
import { parseLeadCsv } from '@lib/csv';

export function useCsvUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [rows, setRows] = useState<LeadCSVRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const parsed = await parseLeadCsv(file);
      setRows(parsed);
      return parsed;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to parse CSV');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { handleFile, isUploading, rows, error };
}
