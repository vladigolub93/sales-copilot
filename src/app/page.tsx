import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AppShell } from '@components/layout/AppShell';

export default function HomePage() {
  return (
    <AppShell>
      <section className="max-w-3xl space-y-8 p-10">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
            Sales Copilot
          </p>
          <h1 className="text-4xl font-bold tracking-tight">Pilot your revenue engine</h1>
          <p className="text-lg text-slate-300">
            Manage leads, orchestrate outreach, and enrich customer data with AI.
            Bring voice calls, CSV imports, and Supabase-backed workflows into a
            single shared workspace.
          </p>
        </header>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-400"
          >
            View leads
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/companies"
            className="inline-flex items-center gap-2 rounded-md border border-brand-400/40 px-4 py-2 text-sm font-semibold text-brand-200 transition hover:bg-brand-400/10"
          >
            Browse companies
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
