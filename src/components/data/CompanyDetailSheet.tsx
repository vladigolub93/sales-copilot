'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '@components/ui/Button';
import { Card, CardContent } from '@components/ui/Card';
import type { Company } from '@types';
import type { Lead } from '@types';
import { startRetellCall } from '@lib/retell';

interface CompanyDetailSheetProps {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  onRefresh: () => void;
}

interface OutreachMessages {
  email: string;
  linkedIn: string;
  whatsapp: string;
}

interface NewsItem {
  date: string;
  title: string;
  summary: string;
}

export function CompanyDetailSheet({ open, company, onClose, onRefresh }: CompanyDetailSheetProps) {
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<OutreachMessages | null>(null);

  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[] | null>(null);

  const [callLoading, setCallLoading] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [callResult, setCallResult] = useState<string | null>(null);

  useEffect(() => {
    setAiMessages(null);
    setNewsItems(null);
    setCallResult(null);
    setEnrichError(null);
    setMessageError(null);
    setNewsError(null);
    setCallError(null);
  }, [company]);

  const infoRows = useMemo(() => {
    if (!company) return [];
    return [
      { label: 'Name', value: company.name },
      { label: 'Website', value: company.website ?? '—' },
      { label: 'LinkedIn', value: company.linkedIn ?? '—' },
      { label: 'Description', value: company.description ?? '—' },
      { label: 'Sector', value: company.sector ?? '—' },
      { label: 'Sub-sector', value: company.subSector ?? '—' },
      { label: 'Employees', value: company.employees ?? '—' },
      { label: 'Funding stage', value: company.fundingStage ?? '—' },
      { label: 'Investment info', value: formatValue(company.investmentInfo) },
      { label: 'AI insights', value: company.aiInsights ?? 'Not generated yet' },
      { label: 'News feed', value: formatValue(company.newsFeed) },
      { label: 'Associated leads', value: company.associatedLeads?.join(', ') ?? '—' },
      { label: 'Created', value: new Date(company.createdAt).toLocaleString() }
    ];
  }, [company]);

  const handleEnrich = async () => {
    if (!company) return;
    setEnrichLoading(true);
    setEnrichError(null);
    try {
      const response = await fetch('/api/companies/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to enrich company.');
      }

      onRefresh();
    } catch (error) {
      setEnrichError(error instanceof Error ? error.message : 'Unable to enrich company.');
    } finally {
      setEnrichLoading(false);
    }
  };

  const handleAiMessage = async () => {
    if (!company) return;
    setMessageLoading(true);
    setAiMessages(null);

    setMessageError(null);
    try {
      const response = await fetch('/api/company-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to generate outreach.');
      }

      const payload = (await response.json()) as { messages: OutreachMessages };
      setAiMessages(payload.messages);
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : 'Unable to generate outreach.');
    } finally {
      setMessageLoading(false);
    }
  };

  const handleAiNews = async () => {
    if (!company) return;
    setNewsLoading(true);
    setNewsError(null);
    try {
      const response = await fetch('/api/company-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to gather news.');
      }

      const payload = (await response.json()) as { items: NewsItem[] };
      setNewsItems(payload.items);
    } catch (error) {
      setNewsError(error instanceof Error ? error.message : 'Unable to gather news.');
    } finally {
      setNewsLoading(false);
    }
  };

  const handleWhatsApp = () => {
    setMessageError(null);
    if (!company?.website) {
      setMessageError('No company website available.');
      return;
    }

    window.open(company.website, '_blank');
  };

  const handleTelegram = () => {
    setMessageError(null);
    if (!company?.linkedIn) {
      setMessageError('No LinkedIn profile available.');
      return;
    }

    window.open(company.linkedIn, '_blank');
  };

  const handleAiCall = async () => {
    if (!company) return;
    setCallLoading(true);
    setCallError(null);
    try {
      const pseudoLead: Lead = {
        id: `company-${company.id}`,
        fullName: `${company.name} team`,
        title: 'Revenue leader',
        email: undefined,
        phone: undefined,
        companyName: company.name,
        associatedCompanyId: company.id,
        linkedIn: company.linkedIn,
        personalNotes: company.description,
        aiInsights: company.aiInsights,
        newsFeed: company.newsFeed,
        messages: undefined,
        createdAt: company.createdAt
      };

      const { callId } = await startRetellCall(pseudoLead, company);
      setCallResult(`AI call prepared for ${company.name}. Tracking ID: ${callId}`);
    } catch (error) {
      setCallError(error instanceof Error ? error.message : 'Failed to create AI call prompt.');
    } finally {
      setCallLoading(false);
    }
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/80" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-4xl space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-2xl font-semibold text-white">
                      {company?.name ?? 'Company details'}
                    </Dialog.Title>
                    <p className="text-sm text-slate-400">
                      Review firmographic context and trigger AI workflows.
                    </p>
                  </div>
                  <Button variant="ghost" onClick={onClose}>
                    Close
                  </Button>
                </div>

                <Card>
                  <CardContent className="space-y-4 p-5">
                    <h3 className="text-lg font-semibold text-white">Company information</h3>
                    <dl className="space-y-3 text-sm text-slate-300">
                      {infoRows.map((row) => (
                        <div key={row.label} className="grid grid-cols-[140px,1fr] gap-3">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {row.label}
                          </dt>
                          <dd>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-4 p-5">
                    <h3 className="text-lg font-semibold text-white">Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleEnrich} disabled={enrichLoading}>
                        {enrichLoading ? 'Enriching…' : 'Enrich'}
                      </Button>
                      <Button onClick={handleAiMessage} disabled={messageLoading}>
                        {messageLoading ? 'Generating…' : 'AI Message'}
                      </Button>
                      <Button onClick={handleAiNews} disabled={newsLoading}>
                        {newsLoading ? 'Gathering…' : 'AI News'}
                      </Button>
                      <Button onClick={handleWhatsApp} variant="secondary">
                        Check WhatsApp
                      </Button>
                      <Button onClick={handleTelegram} variant="secondary">
                        Check Telegram
                      </Button>
                      <Button onClick={handleAiCall} disabled={callLoading}>
                        {callLoading ? 'Preparing…' : 'AI Call'}
                      </Button>
                    </div>
                    {enrichError ? <p className="text-sm text-red-400">{enrichError}</p> : null}
                    {messageError ? <p className="text-sm text-red-400">{messageError}</p> : null}
                    {newsError ? <p className="text-sm text-red-400">{newsError}</p> : null}
                    {callError ? <p className="text-sm text-red-400">{callError}</p> : null}
                    {callResult ? <p className="text-sm text-emerald-400">{callResult}</p> : null}
                  </CardContent>
                </Card>

                {aiMessages ? (
                  <Card>
                    <CardContent className="space-y-3 p-5">
                      <h3 className="text-lg font-semibold text-white">Generated outreach</h3>
                      <div className="space-y-2 text-sm text-slate-200">
                        <div>
                          <p className="font-semibold text-brand-200">Email</p>
                          <p className="text-slate-300">{aiMessages.email}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-brand-200">LinkedIn</p>
                          <p className="text-slate-300">{aiMessages.linkedIn}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-brand-200">WhatsApp</p>
                          <p className="text-slate-300">{aiMessages.whatsapp}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {newsItems ? (
                  <Card>
                    <CardContent className="space-y-3 p-5">
                      <h3 className="text-lg font-semibold text-white">Latest news</h3>
                      <div className="space-y-2 text-sm text-slate-200">
                        {newsItems.map((item) => (
                          <div key={`${item.date}-${item.title}`} className="rounded-md border border-slate-800 p-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">{item.date}</p>
                            <p className="font-semibold text-white">{item.title}</p>
                            <p className="text-slate-300">{item.summary}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function formatValue(value: unknown) {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}
