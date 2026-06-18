'use client';

import type { ReactNode } from 'react';

import type { AiEngine, SourceOwnerType } from '@/features/monitoring/types';
import { cn } from '@/utils/cn';

export const ENGINES: Array<{ value: AiEngine | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All engines' },
  { value: 'CHATGPT', label: 'ChatGPT' },
  { value: 'PERPLEXITY', label: 'Perplexity' },
  { value: 'CLAUDE', label: 'Claude' },
  { value: 'AI_OVERVIEWS', label: 'AI Overviews' },
];

export const ENGINE_LABELS: Record<AiEngine, string> = {
  CHATGPT: 'ChatGPT',
  PERPLEXITY: 'Perplexity',
  CLAUDE: 'Claude',
  AI_OVERVIEWS: 'AI Overviews',
};

export function formatPercent(value: number | null | undefined) {
  return `${Math.round(value ?? 0)}%`;
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat().format(value ?? 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return 'Not run yet';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DashboardPageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-white">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-slate-950">
              {title}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">
              {description}
            </p>
          </div>
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </div>
  );
}

export function CompactCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn('rounded-xl border border-slate-200 bg-white', className)}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <CompactCard className="p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
        {value}
      </p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </CompactCard>
  );
}

export function EngineFilter({
  value,
  onChange,
}: {
  value: AiEngine | 'ALL';
  onChange: (value: AiEngine | 'ALL') => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
      {ENGINES.map((engine) => (
        <button
          key={engine.value}
          type="button"
          onClick={() => onChange(engine.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors',
            value === engine.value
              ? 'bg-white text-slate-950 shadow-[0_0_0_1px_rgba(15,23,42,0.08)]'
              : 'hover:text-slate-950',
          )}
        >
          {engine.label}
        </button>
      ))}
    </div>
  );
}

export function SourcePill({ type }: { type: SourceOwnerType }) {
  const label =
    type === 'OWN'
      ? 'Your domain'
      : type === 'COMPETITOR'
        ? 'Competitor'
        : 'Third-party';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium',
        type === 'OWN' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        type === 'COMPETITOR' && 'border-amber-200 bg-amber-50 text-amber-700',
        type === 'THIRD_PARTY' && 'border-slate-200 bg-slate-50 text-slate-600',
      )}
    >
      {label}
    </span>
  );
}

export function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}
