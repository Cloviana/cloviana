'use client';

import { Bookmark } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { PageLoading } from '@/components/fallbacks/page-loading';
import {
  DashboardFrame,
  ENGINE_OPTIONS,
  FilterSelect,
  formatDecimal,
  Pagination,
  RangeToggle,
  ResetButton,
  SearchInput,
  SourceBadge,
} from '@/features/dashboard/components/monitoring-dashboard-ui';
import {
  type MonitoringSourceGap,
  type SourceGapKind,
  useMonitoringSourceGaps,
} from '@/features/monitoring/api/get-monitoring-gap';
import type {
  AiEngine,
  DomainType,
  MonitoringRange,
} from '@/features/monitoring/types';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 15;
const DOMAIN_TYPE_OPTIONS: Array<{ value: DomainType | 'ALL'; label: string }> =
  [
    { value: 'ALL', label: 'All Domain types' },
    { value: 'CORPORATE', label: 'Corporate' },
    { value: 'REFERENCE', label: 'Reference' },
    { value: 'INSTITUTIONAL', label: 'Institutional' },
    { value: 'EDITORIAL', label: 'Editorial' },
    { value: 'UGC', label: 'UGC' },
    { value: 'OTHER', label: 'Other' },
  ];
const URL_TYPE_OPTIONS = [
  { value: 'ALL', label: 'All URL types' },
  { value: 'Listicle', label: 'Listicle' },
  { value: 'Comparison', label: 'Comparison' },
  { value: 'How-To Guide', label: 'How-To Guide' },
  { value: 'Documentation', label: 'Documentation' },
  { value: 'Review', label: 'Review' },
  { value: 'Other', label: 'Other' },
];

const COPY: Record<SourceGapKind, { title: string; description: string }> = {
  domains: {
    title: 'Domain gaps',
    description:
      'Domains where competitors are mentioned but your brand is not.',
  },
  hosts: {
    title: 'Host gaps',
    description: 'Hosts where competitors are mentioned but your brand is not.',
  },
  urls: {
    title: 'URL gaps',
    description: 'URLs where competitors are mentioned but your brand is not.',
  },
};

export default function GapPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [kind, setKind] = useState<SourceGapKind>('domains');
  const [engine, setEngine] = useState<AiEngine | 'ALL'>('ALL');
  const [range, setRange] = useState<MonitoringRange>('M');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<DomainType | 'ALL'>('ALL');
  const [urlType, setUrlType] = useState<string | 'ALL'>('ALL');
  const [minCompetitors, setMinCompetitors] = useState('1');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      kind,
      engine,
      range,
      page,
      limit: PAGE_SIZE,
      search,
      type,
      urlType,
      minCompetitors: Number(minCompetitors),
    }),
    [kind, engine, range, page, search, type, urlType, minCompetitors],
  );
  const { data, isPending, isError } = useMonitoringSourceGaps(
    businessId,
    params,
  );

  useEffect(() => {
    setPage(1);
  }, [kind, engine, range, search, type, urlType, minCompetitors]);

  const reset = () => {
    setEngine('ALL');
    setRange('M');
    setSearch('');
    setType('ALL');
    setUrlType('ALL');
    setMinCompetitors('1');
    setPage(1);
  };

  if (isPending) return <PageLoading />;

  if (isError || !data) {
    return (
      <DashboardFrame
        breadcrumb={['Sources', 'Gap Analysis']}
        title="Gap Analysis"
        description="Gap analysis data could not be loaded."
      >
        <EmptyState kind={kind} />
      </DashboardFrame>
    );
  }

  return (
    <DashboardFrame
      breadcrumb={['Sources', 'Gap Analysis']}
      filters={
        <>
          <FilterSelect
            value={engine}
            onChange={setEngine}
            options={ENGINE_OPTIONS}
            label="Model"
          />
          <RangeToggle value={range} onChange={setRange} />
          <FilterSelect
            value={minCompetitors}
            onChange={setMinCompetitors}
            options={[
              { value: '1', label: 'Min 1 Competitor' },
              { value: '2', label: 'Min 2 Competitors' },
              { value: '0', label: 'All Gaps' },
            ]}
            label="Minimum competitors"
          />
          {kind === 'urls' ? (
            <FilterSelect
              value={urlType}
              onChange={setUrlType}
              options={URL_TYPE_OPTIONS}
              label="URL type"
            />
          ) : null}
          <FilterSelect
            value={type}
            onChange={setType}
            options={DOMAIN_TYPE_OPTIONS}
            label="Domain type"
          />
          <ResetButton onClick={reset} />
        </>
      }
    >
      <div className="peec-border-stroke-tertiary flex items-center gap-0 border-b">
        {(['domains', 'urls'] as SourceGapKind[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setKind(tab)}
            className={cn(
              'text-body-m relative inline-flex h-10 items-center px-3 capitalize transition-colors',
              kind === tab
                ? 'peec-text-primary font-semibold'
                : 'peec-text-tertiary hover:peec-text-primary',
            )}
          >
            {tab}
            {kind === tab ? (
              <span className="absolute right-0 bottom-0 left-0 h-[2px] rounded-t bg-blue-600" />
            ) : null}
          </button>
        ))}
      </div>

      <section>
        <h1 className="text-h3 peec-text-primary">{COPY[kind].title}</h1>
        <p className="text-body-m peec-text-tertiary mt-0.5">
          {COPY[kind].description}
        </p>
      </section>

      <section className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
        <div className="peec-border-stroke-tertiary flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={`Search ${kind}...`}
          />
          <span className="text-body-s peec-text-tertiary">
            {data.total} gaps
          </span>
        </div>
        {data.items.length ? (
          <div className="overflow-x-auto">
            <div
              role="table"
              className="grid min-w-[1000px]"
              style={{
                gridTemplateColumns:
                  kind === 'urls'
                    ? '44px minmax(340px,1fr) 140px 140px 120px 120px 130px 130px'
                    : '44px minmax(260px,1fr) 150px 140px 120px 120px 130px',
              }}
            >
              <HeaderRow kind={kind} />
              <div
                role="rowgroup"
                className="col-span-full grid grid-cols-subgrid"
              >
                {data.items.map((item) => (
                  <GapRow key={item.key} item={item} kind={kind} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState kind={kind} />
        )}
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={data.limit}
          label="gaps"
          onChange={setPage}
        />
      </section>
    </DashboardFrame>
  );
}

function HeaderRow({ kind }: { kind: SourceGapKind }) {
  const headers =
    kind === 'urls'
      ? [
          '',
          'URL',
          'URL type',
          'Domain type',
          'Mentions',
          'Retrievals',
          'Citation rate',
          'Gap score',
        ]
      : [
          '',
          'Domain',
          'Domain type',
          'Competitors',
          'Retrievals',
          'Citation rate',
          'Gap score',
        ];
  return (
    <div
      role="row"
      className="peec-bg-table-hover peec-border-stroke-tertiary col-span-full grid grid-cols-subgrid border-b"
    >
      {headers.map((header) => (
        <div
          key={header}
          role="columnheader"
          className="text-body-s peec-text-tertiary flex h-10 items-center px-4"
        >
          {header}
        </div>
      ))}
    </div>
  );
}

function GapRow({
  item,
  kind,
}: {
  item: MonitoringSourceGap;
  kind: SourceGapKind;
}) {
  return (
    <div
      role="row"
      className="peec-bg-white hover:peec-bg-table-hover peec-border-stroke-tertiary col-span-full grid min-h-[54px] grid-cols-subgrid border-b last:border-b-0"
    >
      <div role="cell" className="flex items-center justify-center">
        <Bookmark className="peec-text-quaternary size-3.5" />
      </div>
      <div role="cell" className="flex min-w-0 items-center gap-2 px-4 py-2">
        <img
          src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`}
          alt=""
          className="size-4 shrink-0 rounded-sm bg-slate-100"
        />
        <div className="min-w-0">
          <p className="text-body-m peec-text-primary truncate font-semibold">
            {kind === 'urls' ? item.title || item.source : item.source}
          </p>
          <p className="text-body-s peec-text-tertiary truncate">
            {kind === 'urls' ? item.url : item.domain}
          </p>
        </div>
      </div>
      {kind === 'urls' ? (
        <div role="cell" className="flex items-center px-4">
          <span className="peec-badge-blue text-body-m inline-flex min-h-5 items-center rounded-[6px] border border-solid px-1.5 text-[11px] font-medium">
            {item.urlType ?? 'Other'}
          </span>
        </div>
      ) : null}
      <div role="cell" className="flex items-center px-4">
        <SourceBadge domainType={item.domainType} />
      </div>
      <div role="cell" className="flex items-center px-4 tabular-nums">
        {kind === 'urls' ? item.mentions : item.competitors.length}
      </div>
      <div
        role="cell"
        className="flex items-center px-4 font-semibold tabular-nums"
      >
        {item.retrievals}
      </div>
      {kind === 'urls' ? (
        <div role="cell" className="flex items-center px-4 tabular-nums">
          {formatDecimal(item.citationRate)}
        </div>
      ) : null}
      {kind !== 'urls' ? (
        <div role="cell" className="flex items-center px-4 tabular-nums">
          {formatDecimal(item.citationRate)}
        </div>
      ) : null}
      <div
        role="cell"
        className="flex items-center px-4 font-semibold tabular-nums"
      >
        {item.gapScore}
      </div>
    </div>
  );
}

function EmptyState({ kind }: { kind: SourceGapKind }) {
  return (
    <div className="flex min-h-48 items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <p className="text-body-m-semibold peec-text-primary">
          No {kind} gaps found
        </p>
        <p className="text-body-s peec-text-tertiary mt-1">
          Try a different model, time range, or competitor threshold.
        </p>
      </div>
    </div>
  );
}
