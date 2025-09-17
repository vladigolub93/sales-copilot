'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Plus } from 'lucide-react';
import { Button } from '@components/ui/Button';

export function TopNav() {
  const pathname = usePathname();
  const title = deriveTitle(pathname);

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 py-4 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <p className="text-sm text-slate-400">
          High level summary of CRM activity and AI co-pilot automation.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="notifications">
          <Bell className="h-5 w-5" />
        </Button>
        <Button asChild>
          <Link href="/leads/new">
            <Plus className="mr-2 h-4 w-4" /> Add lead
          </Link>
        </Button>
      </div>
    </header>
  );
}

function deriveTitle(pathname: string | null) {
  switch (pathname) {
    case '/leads':
      return 'Leads';
    case '/companies':
      return 'Companies';
    case '/leads/import':
      return 'Lead Import';
    default:
      return 'Overview';
  }
}
