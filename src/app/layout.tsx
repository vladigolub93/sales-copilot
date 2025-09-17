import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sales Copilot',
  description: 'CRM platform with AI enrichment and voice-driven workflows.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body className="min-h-full bg-slate-950 text-slate-50 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
