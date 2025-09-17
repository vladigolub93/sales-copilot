'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '@components/ui/Button';
import { Card, CardContent } from '@components/ui/Card';
import { ResourceTable, type ColumnConfig } from '@components/data/ResourceTable';
import { CSVUploader } from '@components/forms/CSVUploader';
import { CompanyDetailSheet } from '@components/data/CompanyDetailSheet';
import type { Company } from '@types/company';

export function CompaniesDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/companies', { cache: 'no-store' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to load companies');
      }
      const payload = (await response.json()) as { companies: Company[] };
      const nextCompanies = payload.companies ?? [];
      setCompanies(nextCompanies);
      setSelectedCompany((current) =>
        current ? nextCompanies.find((candidate) => candidate.id === current.id) ?? current : null
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load companies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCompanies();
  }, [fetchCompanies]);

  const columns = useMemo<ColumnConfig<Company>[]>(() => {
    return [
      {
        header: 'Company',
        accessor: 'name',
        cell: (company) => (
          <div>
            <p className="font-semibold text-white">{company.name}</p>
            {company.website ? (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-200 underline"
              >
                {company.website}
              </a>
            ) : null}
          </div>
        )
      },
      {
        header: 'Sector',
        accessor: 'sector',
        cell: (company) => (
          <div className="text-sm text-slate-200">
            {company.sector ?? '—'}
            {company.subSector ? <span className="text-xs text-slate-500"> · {company.subSector}</span> : null}
          </div>
        )
      },
      {
        header: 'Employees',
        accessor: 'employees',
        cell: (company) => company.employees ?? '—'
      },
      {
        header: 'Funding',
        accessor: 'fundingStage',
        cell: (company) => company.fundingStage ?? '—'
      },
      {
        header: 'Actions',
        accessor: 'id',
        cell: (company) => (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedCompany(company);
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
        <h2 className="text-lg font-semibold text-white">Account overview</h2>
        <Button onClick={() => setIsUploadOpen(true)}>Upload CSV</Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-400">Loading companies…</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-400">{error}</CardContent>
        </Card>
      ) : (
        <ResourceTable<Company>
          title="Accounts"
          description="Supabase-synced company records."
          rows={companies}
          columns={columns}
          emptyState={<span className="text-sm text-slate-400">No companies yet. Upload a CSV to get started.</span>}
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
                  entity="company"
                  allowEntitySwitch={false}
                  onComplete={() => {
                    setIsUploadOpen(false);
                    void fetchCompanies();
                  }}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      <CompanyDetailSheet
        open={isDetailOpen}
        company={selectedCompany}
        onClose={() => setIsDetailOpen(false)}
        onRefresh={() => void fetchCompanies()}
      />
    </div>
  );
}
