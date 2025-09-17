'use client';

import { useState } from 'react';
import { Button } from '@components/ui/Button';
import { Textarea } from '@components/ui/Textarea';
import type { Company, CompanyEnrichmentPayload } from '@types/company';
import { useCompanyEnrichment } from '@hooks/useCompanyEnrichment';

interface CompanyEnrichmentPanelProps {
  companyId: string;
  defaultNotes?: string;
  onComplete?: (company: Partial<Company>) => void;
}

export function CompanyEnrichmentPanel({ companyId, defaultNotes, onComplete }: CompanyEnrichmentPanelProps) {
  const [notes, setNotes] = useState(defaultNotes ?? '');
  const { enrich, isLoading, error } = useCompanyEnrichment({ onComplete });

  const handleEnrichment = async () => {
    const payload: CompanyEnrichmentPayload = {
      companyId,
      notes,
      enrichmentFields: ['summary', 'competitiveLandscape']
    };

    await enrich(payload);
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Add ICP notes or customer goals for tailored enrichment"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <div className="flex items-center gap-3">
        <Button onClick={handleEnrichment} disabled={isLoading}>
          {isLoading ? 'Enriching…' : 'Enrich company with AI'}
        </Button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
