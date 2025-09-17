'use client';

import { useState } from 'react';
import type { Lead, LeadEnrichmentPayload } from '@types/lead';

interface UseLeadEnrichmentOptions {
  onComplete?: (enrichedLead: Partial<Lead>) => void;
}

export function useLeadEnrichment({ onComplete }: UseLeadEnrichmentOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrich = async (payload: LeadEnrichmentPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/leads/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to enrich lead');
      }

      const data = (await response.json()) as { lead: Partial<Lead> };
      onComplete?.(data.lead);
      return data.lead;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { enrich, isLoading, error };
}
