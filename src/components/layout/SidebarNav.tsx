'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Home, Mic, Upload } from 'lucide-react';
import { cn } from '@lib/utils';

const links = [
  { href: '/', label: 'Overview', icon: Home },
  { href: '/leads', label: 'Leads', icon: Mic },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/leads/import', label: 'CSV Import', icon: Upload }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-900/80 p-6 lg:flex">
      <div className="mb-8 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">
          Sales Copilot
        </p>
        <h2 className="text-xl font-bold">Command Deck</h2>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-500 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <footer className="mt-auto text-xs text-slate-500">
        Configure Supabase, OpenAI, and Retell in `.env.local`.
      </footer>
    </aside>
  );
}
