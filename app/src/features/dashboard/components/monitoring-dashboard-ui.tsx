'use client';

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LineChart as LineChartIcon,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type {
  AiEngine,
  DomainType,
  MonitoringRange,
  MonitoringSourceSeries,
  MonitoringTrendPoint,
  SourceOwnerType,
} from '@/features/monitoring/types';
import { cn } from '@/utils/cn';

export const ENGINE_OPTIONS: Array<{ value: AiEngine | 'ALL'; label: string }> =
  [
    { value: 'ALL', label: 'All Models' },
    { value: 'CHATGPT', label: 'ChatGPT' },
    { value: 'PERPLEXITY', label: 'Perplexity' },
    { value: 'CLAUDE', label: 'Claude' },
    { value: 'AI_OVERVIEWS', label: 'AI Overview' },
  ];

export const ENGINE_LABELS: Record<AiEngine, string> = {
  CHATGPT: 'ChatGPT',
  PERPLEXITY: 'Perplexity',
  CLAUDE: 'Claude',
  AI_OVERVIEWS: 'AI Overview',
};

export const DOMAIN_TYPE_LABELS: Record<DomainType, string> = {
  CORPORATE: 'Corporate',
  REFERENCE: 'Reference',
  INSTITUTIONAL: 'Institutional',
  EDITORIAL: 'Editorial',
  UGC: 'UGC',
  OTHER: 'Other',
};

export const DOMAIN_TYPE_BADGES: Record<DomainType, string> = {
  CORPORATE: 'peec-badge-orange',
  REFERENCE: 'peec-badge-purple',
  INSTITUTIONAL: 'peec-badge-lime',
  EDITORIAL: 'peec-badge-blue',
  UGC: 'peec-badge-cyan',
  OTHER: 'peec-badge-slate',
};

export const OWNER_LABELS: Record<SourceOwnerType, string> = {
  OWN: 'You',
  COMPETITOR: 'Competitor',
  THIRD_PARTY: 'Third-party',
};

export const OWNER_BADGES: Record<SourceOwnerType, string> = {
  OWN: 'peec-badge-emerald',
  COMPETITOR: 'peec-badge-red',
  THIRD_PARTY: 'peec-badge-slate',
};

export function formatPercent(value: number | null | undefined) {
  return `${Math.round(value ?? 0)}%`;
}

export function formatDecimal(value: number | null | undefined, digits = 1) {
  return Number(value ?? 0).toFixed(digits);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not run yet';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DashboardFrame({
  breadcrumb,
  title,
  description,
  filters,
  children,
}: {
  breadcrumb: string[];
  title?: string;
  description?: string;
  filters?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-white">
      <div className="peec-border-stroke-tertiary flex items-center justify-between border-b px-5 py-3">
        <div className="text-body-m flex min-w-0 items-center gap-1.5">
          {breadcrumb.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className={cn(
                index === breadcrumb.length - 1
                  ? 'peec-text-primary font-semibold'
                  : 'peec-text-tertiary',
              )}
            >
              {item}
              {index < breadcrumb.length - 1 ? (
                <span className="peec-text-quaternary px-1.5">/</span>
              ) : null}
            </span>
          ))}
        </div>
        <span className="text-body-s peec-text-tertiary shrink-0">
          Trial ends in 14 days
        </span>
      </div>
      {filters ? (
        <div className="peec-border-stroke-tertiary flex flex-wrap items-center gap-2 border-b px-5 py-2.5">
          {filters}
        </div>
      ) : null}
      <main className="flex flex-col gap-6 px-5 pt-5 pb-8">
        {title || description ? (
          <section>
            {title ? (
              <h1 className="text-h3 peec-text-primary">{title}</h1>
            ) : null}
            {description ? (
              <p className="text-body-m peec-text-tertiary mt-0.5">
                {description}
              </p>
            ) : null}
          </section>
        ) : null}
        {children}
      </main>
    </div>
  );
}

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  label?: string;
}) {
  return (
    <label className="inline-flex items-center gap-1.5">
      {label ? <span className="sr-only">{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="text-body-m peec-bg-white peec-text-primary peec-shadow-button-primary h-7 rounded-[8px] border-0 px-2.5 outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-body-m peec-text-secondary hover:peec-text-primary h-7 rounded-[8px] px-2"
    >
      Reset
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn('relative w-[260px] max-w-full', className)}>
      <Search className="peec-text-quaternary pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="peec-border-stroke-quaternary peec-bg-input text-body-m peec-text-primary placeholder:peec-text-quaternary h-8 w-full rounded-[10px] border px-3 pl-8 outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
      />
    </div>
  );
}

export function RangeToggle({
  value,
  onChange,
}: {
  value: MonitoringRange;
  onChange: (value: MonitoringRange) => void;
}) {
  return (
    <div className="peec-border-stroke-tertiary flex items-center overflow-hidden rounded-[8px] border">
      {(['D', 'W', 'M'] as MonitoringRange[]).map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          className={cn(
            'text-body-s h-7 w-8 transition-colors',
            value === range
              ? 'peec-bg-secondary peec-text-primary font-semibold'
              : 'peec-text-tertiary hover:peec-bg-table-hover',
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

export function ChartModeToggle({
  value,
  onChange,
}: {
  value: 'bar' | 'line';
  onChange: (value: 'bar' | 'line') => void;
}) {
  return (
    <div className="peec-bg-secondary flex items-center rounded-[8px] p-1">
      {[
        { value: 'line' as const, icon: LineChartIcon, label: 'Line chart' },
        { value: 'bar' as const, icon: BarChart3, label: 'Bar chart' },
      ].map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            type="button"
            aria-label={item.label}
            onClick={() => onChange(item.value)}
            className={cn(
              'flex size-7 items-center justify-center rounded-[7px] transition-colors',
              value === item.value
                ? 'peec-bg-white peec-text-primary shadow-sm'
                : 'peec-text-tertiary hover:peec-text-primary',
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  label,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  label: string;
  onChange: (page: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="peec-border-stroke-tertiary flex items-center justify-between border-t px-4 py-3">
      <div className="text-body-s peec-text-secondary">
        <span className="peec-text-primary font-semibold">{start}</span> to{' '}
        <span className="peec-text-primary font-semibold">{end}</span> of{' '}
        <span className="peec-text-primary font-semibold">{total}</span> {label}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="peec-shadow-button-primary flex size-7 items-center justify-center rounded-[8px] disabled:pointer-events-none disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-body-s peec-text-secondary px-2">
          Page {page} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          className="peec-shadow-button-primary flex size-7 items-center justify-center rounded-[8px] disabled:pointer-events-none disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function SourceBadge({
  ownerType,
  domainType,
}: {
  ownerType?: SourceOwnerType;
  domainType?: DomainType;
}) {
  if (ownerType && ownerType !== 'THIRD_PARTY') {
    return (
      <span
        className={cn(
          'text-body-m inline-flex min-h-5 max-w-[200px] items-center rounded-[6px] border border-solid px-1.5 text-[11px] font-medium whitespace-nowrap',
          OWNER_BADGES[ownerType],
        )}
      >
        {OWNER_LABELS[ownerType]}
      </span>
    );
  }

  const type = domainType ?? 'OTHER';
  return (
    <span
      className={cn(
        'text-body-m inline-flex min-h-5 max-w-[200px] items-center rounded-[6px] border border-solid px-1.5 text-[11px] font-medium whitespace-nowrap',
        DOMAIN_TYPE_BADGES[type],
      )}
    >
      {DOMAIN_TYPE_LABELS[type]}
    </span>
  );
}

export function SourceSeriesPicker({
  series,
  selected,
  onChange,
  search,
  onSearchChange,
  onClose,
}: {
  series: MonitoringSourceSeries[];
  selected: string[];
  onChange: (selected: string[]) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (ref.current.contains(target)) return;
      if (target.closest('[data-sources-toggle="true"]')) return;
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const visible = series.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((item) => item !== key));
      return;
    }
    onChange([...selected, key]);
  };

  return (
    <div
      ref={ref}
      className="peec-bg-white peec-border-stroke-tertiary absolute right-0 z-30 mt-2 w-[300px] rounded-[14px] border p-3 shadow-xl"
    >
      <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1">
        <span className="text-body-m-semibold peec-text-primary">
          Filter Sources
        </span>
        <button
          type="button"
          onClick={onClose}
          className="peec-text-tertiary hover:peec-text-primary rounded-full p-1 hover:bg-slate-100"
          aria-label="Close picker"
        >
          <X className="size-4" />
        </button>
      </div>
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search sources..."
        className="w-full"
      />
      <p className="text-body-s peec-text-tertiary mt-3">
        {series.length} sources
      </p>
      <div className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1">
        {visible.map((item) => (
          <label
            key={item.key}
            className="hover:peec-bg-table-hover flex cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5"
          >
            <input
              type="checkbox"
              checked={selected.includes(item.key)}
              onChange={() => toggle(item.key)}
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-body-m peec-text-primary truncate">
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function SelectedSeriesChips({
  series,
  selected,
  onRemove,
}: {
  series: MonitoringSourceSeries[];
  selected: string[];
  onRemove: (key: string) => void;
}) {
  const selectedSeries = series.filter((item) => selected.includes(item.key));

  return (
    <div className="flex flex-wrap gap-1.5">
      {selectedSeries.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onRemove(item.key)}
          className="peec-bg-secondary text-body-s peec-text-primary inline-flex max-w-[220px] items-center gap-1.5 rounded-[8px] px-2 py-1"
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="truncate">{item.label}</span>
          <X className="peec-text-tertiary size-3" />
        </button>
      ))}
    </div>
  );
}

export function SourceTrendChart({
  trend,
  series,
  selected,
}: {
  trend: MonitoringTrendPoint[];
  series: MonitoringSourceSeries[];
  selected: string[];
}) {
  const visibleSeries = series.filter((item) => selected.includes(item.key));

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trend} margin={{ top: 10, right: 20, left: -10 }}>
          <CartesianGrid
            stroke="#e5e7eb"
            strokeDasharray="4 4"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              fontSize: 12,
            }}
          />
          {visibleSeries.map((item) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
