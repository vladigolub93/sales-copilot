'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '@components/ui/Button';
import { Card, CardContent } from '@components/ui/Card';
import { ResourceTable, type ColumnConfig } from '@components/data/ResourceTable';
import { CSVUploader } from '@components/forms/CSVUploader';
import { LeadDetailSheet } from '@components/data/LeadDetailSheet';
import type { Lead } from '@types/lead';

export function LeadsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads', { cache: 'no-store' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to load leads');
      }
      const payload = (await response.json()) as { leads: Lead[] };
      const nextLeads = payload.leads ?? [];
      setLeads(nextLeads);
      setSelectedLead((current) =>
        current ? nextLeads.find((candidate) => candidate.id === current.id) ?? current : null
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load leads');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  const columns = useMemo<ColumnConfig<Lead>[]>(() => {
    return [
      {
        header: 'Lead',
        accessor: 'fullName',
        cell: (lead) => (
          <div>
            <p className="font-semibold text-white">{lead.fullName}</p>
            {lead.email ? <p className="text-xs text-slate-400">{lead.email}</p> : null}
          </div>
        )
      },
      {
        header: 'Title',
        accessor: 'title',
        cell: (lead) => lead.title ?? <span className="text-slate-500">—</span>
      },
      {
        header: 'Company',
        accessor: 'companyName',
        cell: (lead) => lead.companyName ?? '—'
      },
      {
        header: 'AI insights',
        accessor: 'aiInsights',
        cell: (lead) =>
          lead.aiInsights ? (
            <p className="text-xs text-slate-300 line-clamp-3">{lead.aiInsights}</p>
          ) : (
            <span className="text-slate-500">Not generated</span>
          )
      },
      {
        header: 'Actions',
        accessor: 'id',
        cell: (lead) => (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedLead(lead);
              setIsDetailOpen(true);
            }}
          >
            View
          </Button>
        )
      }
    ];
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Lead pipeline</h2>
        <Button onClick={() => setIsUploadOpen(true)}>Upload CSV</Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-400">Loading leads…</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-400">{error}</CardContent>
        </Card>
      ) : (
        <ResourceTable<Lead>
          title="Pipeline overview"
          description="Data synced from Supabase in real time."
          rows={leads}
          columns={columns}
          emptyState={<span className="text-sm text-slate-400">No leads yet. Upload a CSV to get started.</span>}
        />
      )}

      <Transition show={isUploadOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsUploadOpen(false)}>
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
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                <CSVUploader
                  entity="lead"
                  allowEntitySwitch={false}
                  onComplete={() => {
                    setIsUploadOpen(false);
                    void fetchLeads();
                  }}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      <LeadDetailSheet
        open={isDetailOpen}
        lead={selectedLead}
        onClose={() => setIsDetailOpen(false)}
        onRefresh={() => void fetchLeads()}
      />
    </div>
  );
}
