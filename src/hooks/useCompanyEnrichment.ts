'use client';

import { useState } from 'react';
import type { Company, CompanyEnrichmentPayload } from '@types';

interface UseCompanyEnrichmentOptions {
  onComplete?: (company: Partial<Company>) => void;
}

export function useCompanyEnrichment({ onComplete }: UseCompanyEnrichmentOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrich = async (payload: CompanyEnrichmentPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/companies/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to enrich company');
      }

      const data = (await response.json()) as { company: Partial<Company> };
      onComplete?.(data.company);
      return data.company;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { enrich, isLoading, error };
}
