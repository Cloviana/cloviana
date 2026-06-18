'use client';

import {
  Bookmark,
  Check,
  Copy,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { PageLoading } from '@/components/fallbacks/page-loading';
import {
  DashboardFrame,
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
import type {
  SourceOverviewParams,
  TopDomain,
} from '@/features/monitoring/api/get-monitoring-domains';
import { useMonitoringUrls } from '@/features/monitoring/api/get-monitoring-urls';
import type {
  AiEngine,
  DomainType,
  MonitoringRange,
  SourceOwnerType,
} from '@/features/monitoring/types';

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
const OWNER_OPTIONS: Array<{ value: SourceOwnerType | 'ALL'; label: string }> =
  [
    { value: 'ALL', label: 'All Brands' },
    { value: 'OWN', label: 'You' },
    { value: 'COMPETITOR', label: 'Competitors' },
    { value: 'THIRD_PARTY', label: 'Third-party' },
  ];

export default function UrlsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [engine, setEngine] = useState<AiEngine | 'ALL'>('ALL');
  const [range, setRange] = useState<MonitoringRange>('M');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<DomainType | 'ALL'>('ALL');
  const [owner, setOwner] = useState<SourceOwnerType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [seriesSearch, setSeriesSearch] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const params = useMemo<SourceOverviewParams>(
    () => ({ engine, range, page, limit: PAGE_SIZE, search, type, owner }),
    [engine, range, page, search, type, owner],
  );
  const { data, isPending, isError } = useMonitoringUrls(businessId, params);

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

  const reset = () => {
    setEngine('ALL');
    setRange('M');
    setSearch('');
    setType('ALL');
    setOwner('ALL');
    setPage(1);
  };

  const copyUrl = async (url: string | null) => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    window.setTimeout(() => setCopiedUrl(null), 1600);
  };

  if (isPending) return <PageLoading />;

  if (isError || !data) {
    return (
      <DashboardFrame
        breadcrumb={['Sources', 'URLs']}
        title="URLs unavailable"
        description="Refresh once monitoring responses have been parsed."
      >
        <EmptyState />
      </DashboardFrame>
    );
  }

  return (
    <DashboardFrame
      breadcrumb={['Sources', 'URLs']}
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
      title="Overview"
      description="How often each URL appears in AI answers"
    >
      <section className="peec-bg-white peec-border-stroke-tertiary overflow-visible rounded-[14px] border">
        <div className="peec-border-stroke-tertiary flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-body-m-semibold peec-text-primary">
              Source retrievals over time
            </h2>
            <p className="text-body-s peec-text-tertiary">
              Select URLs to compare retrieval patterns.
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
              URLs
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
        <h2 className="text-h3 peec-text-primary">URLs</h2>
        <p className="text-body-m peec-text-tertiary mt-0.5">
          Detailed list of pages cited in AI answers.
        </p>
      </section>

      <section className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
        <div className="peec-border-stroke-tertiary flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search URLs..."
          />
          <span className="text-body-s peec-text-tertiary">
            {data.total} URLs
          </span>
        </div>
        {data.items.length ? (
          <div className="overflow-x-auto">
            <div
              role="table"
              className="grid min-w-[1100px]"
              style={{
                gridTemplateColumns:
                  '44px minmax(340px,1fr) 140px 140px 120px 120px 120px',
              }}
            >
              <HeaderRow />
              <div
                role="rowgroup"
                className="col-span-full grid grid-cols-subgrid"
              >
                {data.items.map((item) => (
                  <UrlRow
                    key={item.key}
                    item={item}
                    copiedUrl={copiedUrl}
                    onCopy={copyUrl}
                  />
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
          label="URLs"
          onChange={setPage}
        />
      </section>
    </DashboardFrame>
  );
}

function HeaderRow() {
  const headers = [
    '',
    'URL',
    'URL type',
    'Domain type',
    'Retrievals',
    'Retrieved',
    'Citation rate',
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

function UrlRow({
  item,
  copiedUrl,
  onCopy,
}: {
  item: TopDomain;
  copiedUrl: string | null;
  onCopy: (url: string | null) => void;
}) {
  return (
    <div
      role="row"
      className="peec-bg-white hover:peec-bg-table-hover peec-border-stroke-tertiary col-span-full grid min-h-[58px] grid-cols-subgrid border-b last:border-b-0"
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
        <div className="min-w-0 flex-1">
          <p className="text-body-m peec-text-primary truncate font-semibold">
            {item.title || item.source}
          </p>
          <p className="text-body-s peec-text-tertiary truncate">
            {item.url ?? item.source}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCopy(item.url)}
          className="peec-text-tertiary hover:peec-text-primary flex size-5 items-center justify-center"
          aria-label="Copy URL"
        >
          {copiedUrl === item.url ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="peec-text-tertiary hover:peec-text-primary flex size-5 items-center justify-center"
            aria-label="Open URL"
          >
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </div>
      <div role="cell" className="flex items-center px-4">
        <span className="peec-badge-blue text-body-m inline-flex min-h-5 items-center rounded-[6px] border border-solid px-1.5 text-[11px] font-medium">
          {item.urlType ?? 'Other'}
        </span>
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
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-48 items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <p className="text-body-m-semibold peec-text-primary">No URLs found</p>
        <p className="text-body-s peec-text-tertiary mt-1">
          Try a different search term, model, or source type.
        </p>
      </div>
    </div>
  );
}
