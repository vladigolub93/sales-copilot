'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '@components/ui/Button';
import { Card, CardContent } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import type { Lead } from '@types';
import type { Company } from '@types';
import { supabase } from '@lib/supabase';
import { startRetellCall } from '@lib/retell';

interface LeadDetailSheetProps {
  open: boolean;
  lead: Lead | null;
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

export function LeadDetailSheet({ open, lead, onClose, onRefresh }: LeadDetailSheetProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const [enrichLoading, setEnrichLoading] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const [linkCompanyId, setLinkCompanyId] = useState('');
  const [linkNotes, setLinkNotes] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [aiMessages, setAiMessages] = useState<OutreachMessages | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  const [newsItems, setNewsItems] = useState<NewsItem[] | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  const [callLoading, setCallLoading] = useState(false);
  const [callResult, setCallResult] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    setAiMessages(null);
    setNewsItems(null);
    setCallResult(null);
    setEnrichError(null);
    setMessageError(null);
    setNewsError(null);
    setCallError(null);
    setCompanyError(null);

    if (!lead) {
      setCompany(null);
      setLinkCompanyId('');
      setLinkNotes('');
      setAiMessages(null);
      setNewsItems(null);
      setCallResult(null);
      return;
    }

    setLinkCompanyId(lead.associatedCompanyId ?? '');
    setLinkNotes('');

    if (!lead.associatedCompanyId) {
      setCompany(null);
      return;
    }

    let cancelled = false;
    const loadCompany = async () => {
      setIsCompanyLoading(true);
      setCompanyError(null);
      try {
        const { data, error } = await supabase
          .from('companies')
          .select(
            'id, name, website, linkedin, description, sector, sub_sector, employees, funding_stage, investment_info, ai_insights, news_feed, created_at, associated_leads'
          )
          .eq('id', lead.associatedCompanyId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!cancelled) {
          setCompany(
            data
              ? {
                  id: String(data.id),
                  name: data.name ?? '',
                  website: data.website ?? undefined,
                  linkedIn: data.linkedin ?? undefined,
                  description: data.description ?? undefined,
                  sector: data.sector ?? undefined,
                  subSector: data.sub_sector ?? undefined,
                  employees: data.employees ?? undefined,
                  fundingStage: data.funding_stage ?? undefined,
                  investmentInfo: data.investment_info ?? undefined,
                  associatedLeads: (data.associated_leads as string[] | null) ?? undefined,
                  aiInsights: data.ai_insights ?? undefined,
                  newsFeed: data.news_feed ?? undefined,
                  createdAt: data.created_at ?? new Date().toISOString()
                }
              : null
          );
        }
      } catch (error) {
        if (!cancelled) {
          setCompanyError(error instanceof Error ? error.message : 'Unable to load company.');
          setCompany(null);
        }
      } finally {
        if (!cancelled) {
          setIsCompanyLoading(false);
        }
      }
    };

    loadCompany();

    return () => {
      cancelled = true;
    };
  }, [lead]);

  const infoRows = useMemo(() => {
    if (!lead) return [];
    return [
      { label: 'Full name', value: lead.fullName },
      { label: 'Title', value: lead.title ?? '—' },
      { label: 'Email', value: lead.email ?? '—' },
      { label: 'Phone', value: lead.phone ?? '—' },
      { label: 'Company', value: lead.companyName ?? '—' },
      { label: 'LinkedIn', value: lead.linkedIn ?? '—' },
      { label: 'Notes', value: lead.personalNotes ?? '—' },
      { label: 'AI insights', value: lead.aiInsights ?? 'Not generated yet' },
      { label: 'News feed', value: formatValue(lead.newsFeed) },
      { label: 'Messages', value: formatValue(lead.messages) },
      { label: 'Created', value: new Date(lead.createdAt).toLocaleString() }
    ];
  }, [lead]);

  const handleEnrich = async () => {
    if (!lead) return;
    setEnrichLoading(true);
    setEnrichError(null);
    try {
      const response = await fetch('/api/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to enrich lead.');
      }

      onRefresh();
    } catch (error) {
      setEnrichError(error instanceof Error ? error.message : 'Unable to enrich lead.');
    } finally {
      setEnrichLoading(false);
    }
  };

  const handleLinkCompany = async () => {
    if (!lead) return;
    setLinkLoading(true);
    setLinkError(null);
    try {
      const response = await fetch('/api/leads/link-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          companyId: linkCompanyId.trim() || null,
          notes: linkNotes.trim() || null
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to link company.');
      }

      onRefresh();
      if (linkCompanyId.trim()) {
        setCompanyError(null);
      }
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : 'Unable to link company.');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleAiMessage = async () => {
    if (!lead) return;
    setMessageLoading(true);
    setAiMessages(null);

    setMessageError(null);
    try {
      const response = await fetch('/api/ai-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to generate outreach messages.');
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
    if (!lead) return;
    setNewsLoading(true);
    setNewsError(null);
    if (!lead.associatedCompanyId && !(lead.companyName ?? company?.name)) {
      setNewsError('Link a company or add a company name before requesting news.');
      setNewsLoading(false);
      return;
    }
    try {
      const response = await fetch('/api/company-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: lead.associatedCompanyId,
          companyName: lead.companyName ?? company?.name
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to fetch company news.');
      }

      const payload = (await response.json()) as { items: NewsItem[] };
      setNewsItems(payload.items);
    } catch (error) {
      setNewsError(error instanceof Error ? error.message : 'Unable to retrieve news.');
    } finally {
      setNewsLoading(false);
    }
  };

  const handleWhatsApp = () => {
    setMessageError(null);
    if (!lead?.phone) {
      setMessageError('Lead is missing a phone number for WhatsApp.');
      return;
    }

    const cleaned = lead.phone.replace(/[^0-9+]/g, '');
    const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleaned)}`;
    window.open(url, '_blank');
  };

  const handleTelegram = () => {
    setMessageError(null);
    if (!lead?.phone && !lead?.linkedIn) {
      setMessageError('Provide a phone number or username to open Telegram.');
      return;
    }

    const handle = lead?.linkedIn?.split('/').pop();
    const target = handle ? `https://t.me/${handle}` : 'https://web.telegram.org';
    window.open(target, '_blank');
  };

  const handleAiCall = async () => {
    if (!lead) return;
    setCallLoading(true);
    setCallError(null);
    try {
      const { callId } = await startRetellCall(lead, company ?? undefined);
      setCallResult(`AI call initiated. Tracking ID: ${callId}`);
    } catch (error) {
      setCallError(error instanceof Error ? error.message : 'Failed to start AI call.');
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
                      {lead?.fullName ?? 'Lead details'}
                    </Dialog.Title>
                    <p className="text-sm text-slate-400">
                      Review and orchestrate AI workflows tailored to this prospect.
                    </p>
                  </div>
                  <Button variant="ghost" onClick={onClose}>
                    Close
                  </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardContent className="space-y-4 p-5">
                      <h3 className="text-lg font-semibold text-white">Lead information</h3>
                      <dl className="space-y-3 text-sm text-slate-300">
                        {infoRows.map((row) => (
                          <div key={row.label} className="grid grid-cols-[120px,1fr] gap-3">
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
                          {callLoading ? 'Calling…' : 'AI Call'}
                        </Button>
                      </div>
                      {enrichError ? <p className="text-sm text-red-400">{enrichError}</p> : null}
                      {messageError ? <p className="text-sm text-red-400">{messageError}</p> : null}
                      {newsError ? <p className="text-sm text-red-400">{newsError}</p> : null}
                      {callError ? <p className="text-sm text-red-400">{callError}</p> : null}
                      {callResult ? <p className="text-sm text-emerald-400">{callResult}</p> : null}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="space-y-4 p-5">
                    <h3 className="text-lg font-semibold text-white">Link to company</h3>
                    <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
                      <div className="space-y-3">
                        <Input
                          placeholder="Company ID"
                          value={linkCompanyId}
                          onChange={(event) => setLinkCompanyId(event.target.value)}
                        />
                        <Textarea
                          placeholder="Explain why linking is needed (optional)"
                          value={linkNotes}
                          onChange={(event) => setLinkNotes(event.target.value)}
                        />
                      </div>
                      <Button onClick={handleLinkCompany} disabled={linkLoading}>
                        {linkLoading ? 'Linking…' : 'Link to Company'}
                      </Button>
                    </div>
                    {linkError ? <p className="text-sm text-red-400">{linkError}</p> : null}
                    {companyError ? <p className="text-sm text-red-400">{companyError}</p> : null}
                    {isCompanyLoading ? <p className="text-sm text-slate-400">Loading company details…</p> : null}
                    {company ? (
                      <div className="space-y-2 text-sm text-slate-300">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Linked company snapshot
                        </p>
                        <p><span className="font-medium text-white">{company.name}</span></p>
                        <p>{company.description ?? 'No description yet.'}</p>
                        <p>
                          Sector: {company.sector ?? '—'} · Employees: {company.employees ?? '—'} · Funding:{' '}
                          {company.fundingStage ?? '—'}
                        </p>
                      </div>
                    ) : null}
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
                      <h3 className="text-lg font-semibold text-white">Latest company news</h3>
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
