'use client';

import { useState } from 'react';
import { Button } from '@components/ui/Button';
import { Textarea } from '@components/ui/Textarea';
import type { Lead, LeadEnrichmentPayload } from '@types/lead';
import { useLeadEnrichment } from '@hooks/useLeadEnrichment';

interface LeadEnrichmentPanelProps {
  leadId: string;
  defaultNotes?: string;
  onComplete?: (lead: Partial<Lead>) => void;
}

export function LeadEnrichmentPanel({ leadId, defaultNotes, onComplete }: LeadEnrichmentPanelProps) {
  const [notes, setNotes] = useState(defaultNotes ?? '');
  const { enrich, isLoading, error } = useLeadEnrichment({ onComplete });

  const handleEnrichment = async () => {
    const payload: LeadEnrichmentPayload = {
      leadId,
      notes,
      enrichmentFields: ['summary', 'persona', 'nextSteps']
    };

    await enrich(payload);
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Add any context to personalize enrichment"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <div className="flex items-center gap-3">
        <Button onClick={handleEnrichment} disabled={isLoading}>
          {isLoading ? 'Enriching…' : 'Enrich lead with AI'}
        </Button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
