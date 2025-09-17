import type { ReactNode } from 'react';
import { cn } from '@lib/utils';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'success' | 'warn' | 'info';
}

const toneMap: Record<NonNullable<BadgeProps['tone']>, string> = {
  default: 'bg-slate-800 text-slate-200',
  success: 'bg-emerald-500/20 text-emerald-300',
  warn: 'bg-amber-500/20 text-amber-300',
  info: 'bg-brand-500/20 text-brand-200'
};

export function Badge({ children, className, tone = 'default' }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', toneMap[tone], className)}>
      {children}
    </span>
  );
}
