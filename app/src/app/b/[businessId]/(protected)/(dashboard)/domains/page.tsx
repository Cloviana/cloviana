'use client';

import { Bookmark, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { PageLoading } from '@/components/fallbacks/page-loading';
import {
  DashboardFrame,
  DOMAIN_TYPE_LABELS,
  ENGINE_OPTIONS,
  FilterSelect,
  formatDecimal,
  formatPercent,
  Pagination,
  RangeToggle,
  ResetButton,
  SearchInput,
  SelectedSeriesChips,
  SourceBadge,
  SourceSeriesPicker,
  SourceTrendChart,
} from '@/features/dashboard/components/monitoring-dashboard-ui';
import {
  type SourceOverviewParams,
  type TopDomain,
  useMonitoringDomains,
} from '@/features/monitoring/api/get-monitoring-domains';
import type {
  AiEngine,
  DomainType,
  MonitoringRange,
  SourceOwnerType,
} from '@/features/monitoring/types';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 15;
const MOVER_TABS = ['top', 'new', 'trending', 'losing'] as const;
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
const OWNER_OPTIONS: Array<{ value: SourceOwnerType | 'ALL'; label: string }> =
  [
    { value: 'ALL', label: 'All Brands' },
    { value: 'OWN', label: 'You' },
    { value: 'COMPETITOR', label: 'Competitors' },
    { value: 'THIRD_PARTY', label: 'Third-party' },
  ];

export default function DomainsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [engine, setEngine] = useState<AiEngine | 'ALL'>('ALL');
  const [range, setRange] = useState<MonitoringRange>('M');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<DomainType | 'ALL'>('ALL');
  const [owner, setOwner] = useState<SourceOwnerType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [moverTab, setMoverTab] = useState<(typeof MOVER_TABS)[number]>('top');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [seriesSearch, setSeriesSearch] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);

  const params = useMemo<SourceOverviewParams>(
    () => ({ engine, range, page, limit: PAGE_SIZE, search, type, owner }),
    [engine, range, page, search, type, owner],
  );
  const domainsQuery = useMonitoringDomains(businessId, params);
  const query = domainsQuery;
  const data = query.data;

  useEffect(() => {
    setPage(1);
  }, [engine, range, search, type, owner]);

  useEffect(() => {
    if (!data?.series.length) {
      setSelectedSeries([]);
      return;
    }
    setSelectedSeries((current) => {
      const valid = current.filter((key) =>
        data.series.some((item) => item.key === key),
      );
      return valid.length
        ? valid
        : data.series.slice(0, 5).map((item) => item.key);
    });
  }, [data?.series]);

  if (query.isPending) return <PageLoading />;

  if (query.isError || !data) {
    return (
      <DashboardFrame
        breadcrumb={['Sources', 'Domains']}
        title="Sources unavailable"
        description="Refresh once monitoring responses have been parsed."
      >
        <EmptyState />
      </DashboardFrame>
    );
  }

  const title = 'Domains';
  const tableLabel = 'domains';
  const movers = data.domainMovers[moverTab] ?? [];

  const reset = () => {
    setEngine('ALL');
    setRange('M');
    setSearch('');
    setType('ALL');
    setOwner('ALL');
    setPage(1);
  };

  return (
    <DashboardFrame
      breadcrumb={['Sources', title]}
      filters={
        <>
          <FilterSelect
            value={engine}
            onChange={setEngine}
            options={ENGINE_OPTIONS}
            label="Model"
          />
          <FilterSelect
            value={owner}
            onChange={setOwner}
            options={OWNER_OPTIONS}
            label="Owner"
          />
          <FilterSelect
            value={type}
            onChange={setType}
            options={DOMAIN_TYPE_OPTIONS}
            label="Domain type"
          />
          <ResetButton onClick={reset} />
        </>
      }
      title={title}
      description={`How often each domain appears in AI answers`}
    >
      <section className="peec-bg-white peec-border-stroke-tertiary overflow-visible rounded-[14px] border">
        <div className="peec-border-stroke-tertiary flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-body-m-semibold peec-text-primary">
              Source retrievals over time
            </h2>
            <p className="text-body-s peec-text-tertiary">
              Selected {tableLabel} update the lines below.
            </p>
          </div>
          <div className="relative flex items-center gap-2">
            <RangeToggle value={range} onChange={setRange} />
            <button
              type="button"
              data-sources-toggle="true"
              onClick={() => setPickerOpen((open) => !open)}
              className="peec-shadow-button-primary text-body-m flex h-7 items-center gap-1.5 rounded-[8px] px-2"
            >
              <SlidersHorizontal className="size-3.5" />
              Sources
            </button>
            {pickerOpen ? (
              <SourceSeriesPicker
                series={data.series}
                selected={selectedSeries}
                onChange={setSelectedSeries}
                search={seriesSearch}
                onSearchChange={setSeriesSearch}
                onClose={() => setPickerOpen(false)}
              />
            ) : null}
          </div>
        </div>
        <div className="space-y-3 p-4">
          <SourceTrendChart
            trend={data.trend}
            series={data.series}
            selected={selectedSeries}
          />
          <SelectedSeriesChips
            series={data.series}
            selected={selectedSeries}
            onRemove={(key) =>
              setSelectedSeries((current) =>
                current.filter((item) => item !== key),
              )
            }
          />
        </div>
      </section>

      <section>
        <h2 className="text-h3 peec-text-primary">{title} movers</h2>
        <p className="text-body-m peec-text-tertiary mt-0.5">
          How often each domain and type is retrieved.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
          <div className="peec-border-stroke-tertiary flex items-center border-b px-4">
            {MOVER_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMoverTab(tab)}
                className={cn(
                  'text-body-m relative inline-flex h-10 items-center px-3 capitalize transition-colors',
                  moverTab === tab
                    ? 'peec-text-primary font-semibold'
                    : 'peec-text-tertiary hover:peec-text-primary',
                )}
              >
                {tab}
                {moverTab === tab ? (
                  <span className="absolute right-0 bottom-0 left-0 h-[2px] rounded-t bg-blue-600" />
                ) : null}
              </button>
            ))}
          </div>
          <div>
            {movers.length ? (
              movers
                .slice(0, 8)
                .map((item) => <MoverRow key={item.key} item={item} />)
            ) : (
              <p className="text-body-s peec-text-tertiary p-4">
                No movers for this filter.
              </p>
            )}
          </div>
        </section>

        <section className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
          <div className="peec-border-stroke-tertiary border-b px-4 py-3">
            <h2 className="text-body-m-semibold peec-text-primary">
              Domain types
            </h2>
            <p className="text-body-s peec-text-tertiary">
              Total retrievals: {data.totalRetrievals}
            </p>
          </div>
          <div className="space-y-2 p-4">
            {data.domainTypes.map((item) => (
              <div key={item.type} className="flex items-center gap-3">
                <div className="peec-bg-secondary relative h-8 flex-1 overflow-hidden rounded-[8px]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-[8px] bg-blue-100"
                    style={{ width: `${Math.max(3, item.percentage)}%` }}
                  />
                  <span className="text-body-m peec-text-primary absolute inset-y-0 left-3 flex items-center font-medium">
                    {DOMAIN_TYPE_LABELS[item.type]}
                  </span>
                </div>
                <span className="text-body-m peec-text-secondary w-12 text-right tabular-nums">
                  {formatPercent(item.percentage)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
        <div className="peec-border-stroke-tertiary flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={`Search ${tableLabel}...`}
          />
          <span className="text-body-s peec-text-tertiary">
            {data.total} {tableLabel}
          </span>
        </div>
        {data.items.length ? (
          <div className="overflow-x-auto">
            <div
              role="table"
              className="grid min-w-[900px]"
              style={{
                gridTemplateColumns:
                  '44px minmax(260px,1fr) 150px 120px 120px 120px 160px',
              }}
            >
              <HeaderRow />
              <div
                role="rowgroup"
                className="col-span-full grid grid-cols-subgrid"
              >
                {data.items.map((item) => (
                  <SourceRow key={item.key} item={item} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={data.limit}
          label={tableLabel}
          onChange={setPage}
        />
      </section>
    </DashboardFrame>
  );
}

function HeaderRow() {
  const headers = [
    '',
    'Source',
    'Domain type',
    'Retrievals',
    'Retrieved',
    'Citation rate',
    'Prompts',
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

function SourceRow({ item }: { item: TopDomain }) {
  return (
    <div
      role="row"
      className="peec-bg-white hover:peec-bg-table-hover peec-border-stroke-tertiary col-span-full grid min-h-[48px] grid-cols-subgrid border-b last:border-b-0"
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
            {item.source}
          </p>
          <p className="text-body-s peec-text-tertiary truncate">
            {item.competitorName ?? item.domain}
          </p>
        </div>
      </div>
      <div role="cell" className="flex items-center px-4">
        <SourceBadge ownerType={item.ownerType} domainType={item.type} />
      </div>
      <div
        role="cell"
        className="flex items-center px-4 font-semibold tabular-nums"
      >
        {item.retrievals}
      </div>
      <div role="cell" className="flex items-center px-4 tabular-nums">
        {formatPercent(item.retrieved)}
      </div>
      <div role="cell" className="flex items-center px-4 tabular-nums">
        {formatDecimal(item.citationRate)}
      </div>
      <div role="cell" className="flex items-center px-4">
        <span className="text-body-s peec-text-tertiary">
          {item.prompts.length} prompts
        </span>
      </div>
    </div>
  );
}

function MoverRow({ item }: { item: TopDomain }) {
  return (
    <div className="peec-border-stroke-tertiary hover:peec-bg-table-hover flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0">
      <img
        src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`}
        alt=""
        className="size-4 shrink-0 rounded-sm bg-slate-100"
      />
      <div className="min-w-0 flex-1">
        <p className="text-body-m peec-text-primary truncate font-medium">
          {item.source}
        </p>
        <p className="text-body-s peec-text-tertiary truncate">
          {item.retrievals} retrievals
        </p>
      </div>
      <ChevronRight className="peec-text-quaternary size-4" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-48 items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <p className="text-body-m-semibold peec-text-primary">
          No sources found
        </p>
        <p className="text-body-s peec-text-tertiary mt-1">
          Try a different search term, model, or source type.
        </p>
      </div>
    </div>
  );
}
