'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { Button } from '@components/ui/Button';

interface LeadFormState {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  companyName: string;
  associatedCompanyId: string;
  linkedIn: string;
  personalNotes: string;
}

const INITIAL_FORM: LeadFormState = {
  fullName: '',
  title: '',
  email: '',
  phone: '',
  companyName: '',
  associatedCompanyId: '',
  linkedIn: '',
  personalNotes: ''
};

export default function NewLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState<LeadFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (
    field: keyof LeadFormState
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const trimmed = Object.fromEntries(
        Object.entries(form).flatMap(([key, value]) => {
          const next = value.trim();
          if (key === 'fullName') {
            return [[key, next]];
          }
          return next.length === 0 ? [] : [[key, next]];
        })
      );

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trimmed)
      });

      if (!response.ok) {
        throw new Error('Unable to create lead');
      }

      router.push('/leads');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Create lead" subtitle="Capture a new prospect and kick off enrichment workflows." />
      <Card>
        <CardHeader>
          <CardTitle>Lead details</CardTitle>
          <CardDescription>
            Provide as much context as you have. Sales Copilot can backfill the rest via enrichment and automations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                required
                placeholder="Ada Lovelace"
                value={form.fullName}
                onChange={updateField('fullName')}
              />
              <Input
                placeholder="Head of Data Strategy"
                value={form.title}
                onChange={updateField('title')}
              />
              <Input
                type="email"
                placeholder="ada@example.com"
                value={form.email}
                onChange={updateField('email')}
              />
              <Input
                placeholder="+1 (555) 123-4567"
                value={form.phone}
                onChange={updateField('phone')}
              />
              <Input
                placeholder="Analytical Engines Inc."
                value={form.companyName}
                onChange={updateField('companyName')}
              />
              <Input
                placeholder="Associated company ID (if known)"
                value={form.associatedCompanyId}
                onChange={updateField('associatedCompanyId')}
              />
              <Input
                placeholder="https://linkedin.com/in/ada-lovelace"
                value={form.linkedIn}
                onChange={updateField('linkedIn')}
              />
            </div>
            <Textarea
              placeholder="Add any notes, relevant context, or disqualifiers."
              value={form.personalNotes}
              onChange={updateField('personalNotes')}
            />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting || !form.fullName.trim()}>
                {isSubmitting ? 'Creating…' : 'Create lead'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setForm(INITIAL_FORM)}
                disabled={isSubmitting}
              >
                Reset form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
