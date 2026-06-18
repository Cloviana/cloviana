'use client';

import { ChevronRight, Minus } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { PageLoading } from '@/components/fallbacks/page-loading';
import {
  ChartModeToggle,
  DashboardFrame,
  ENGINE_LABELS,
  ENGINE_OPTIONS,
  FilterSelect,
  formatDateTime,
  formatPercent,
  Pagination,
  RangeToggle,
  ResetButton,
  SourceBadge,
} from '@/features/dashboard/components/monitoring-dashboard-ui';
import { useMonitoringChats } from '@/features/monitoring/api/get-monitoring-chats';
import { useMonitoringDomains } from '@/features/monitoring/api/get-monitoring-domains';
import { useMonitoringGap } from '@/features/monitoring/api/get-monitoring-gap';
import { useMonitoringOverview } from '@/features/monitoring/api/get-monitoring-overview';
import type { AiEngine, MonitoringRange } from '@/features/monitoring/types';
import { cn } from '@/utils/cn';

const CHAT_PAGE_SIZE = 10;
const BAR_COLORS = [
  '#1473e6',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#6b7280',
  '#d946ef',
  '#06b6d4',
];
const ENGINE_ICON_MAP: Record<AiEngine, string> = {
  CHATGPT: '/logos/chatgpt-icon.svg',
  CLAUDE: '/logos/claude-color.svg',
  PERPLEXITY: '/logos/perplexity-color.svg',
  AI_OVERVIEWS: '/logos/google-aio-icon.svg',
};

export default function DashboardPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [engine, setEngine] = useState<AiEngine | 'ALL'>('ALL');
  const [range, setRange] = useState<MonitoringRange>('M');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [chatPage, setChatPage] = useState(1);
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);

  const overview = useMonitoringOverview(businessId);
  const gap = useMonitoringGap(businessId, { range });
  const domains = useMonitoringDomains(businessId, {
    engine,
    range,
    limit: 8,
  });
  const chats = useMonitoringChats(businessId, {
    engine,
    page: chatPage,
    limit: CHAT_PAGE_SIZE,
  });

  const isPending =
    overview.isPending || gap.isPending || domains.isPending || chats.isPending;

  const barRows = useMemo(() => {
    const trend = gap.data?.trend ?? [];
    const breakdown = gap.data?.breakdown ?? [];
    if (trend.length > 0) {
      return breakdown
        .map((item) => {
          const values = trend
            .map((row) => Number(row[item.name] ?? 0))
            .filter(Number.isFinite);
          const average =
            values.length > 0
              ? values.reduce((sum, value) => sum + value, 0) / values.length
              : item.mentionRate;
          return { ...item, visibility: average };
        })
        .sort((a, b) => b.visibility - a.visibility);
    }
    return breakdown
      .map((item) => ({ ...item, visibility: item.mentionRate }))
      .sort((a, b) => b.visibility - a.visibility);
  }, [gap.data?.breakdown, gap.data?.trend]);

  const lineRows = useMemo(
    () =>
      (gap.data?.trend ?? []).map((row) => ({
        ...row,
        label: formatShortDate(row.date),
      })),
    [gap.data?.trend],
  );

  const lineKeys = useMemo(
    () => (gap.data?.breakdown ?? []).map((item) => item.name),
    [gap.data?.breakdown],
  );

  if (isPending) return <PageLoading />;

  if (overview.isError || !overview.data) {
    return (
      <DashboardFrame
        breadcrumb={['Monitoring', 'Overview']}
        title="Overview unavailable"
        description="Refresh once the API is online and the monitoring job has finished."
      >
        <EmptyState />
      </DashboardFrame>
    );
  }

  const overviewData = overview.data;
  const summary = overviewData.summary;

  const reset = () => {
    setEngine('ALL');
    setRange('M');
    setChartType('bar');
    setChatPage(1);
  };

  return (
    <DashboardFrame
      breadcrumb={['Monitoring', 'Overview']}
      filters={
        <>
          <FilterSelect
            value={engine}
            onChange={(value) => {
              setEngine(value);
              setChatPage(1);
            }}
            options={ENGINE_OPTIONS}
            label="Model"
          />
          <ResetButton onClick={reset} />
        </>
      }
      title="Overview"
      description="How often each brand appears in AI generated discussions"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Mention Rate"
          value={formatPercent(summary?.mentionRate)}
          helper="Prompts where your brand appears"
        />
        <MetricCard
          label="Citation Share"
          value={formatPercent(summary?.citationShare)}
          helper="Responses citing your website"
        />
        <MetricCard
          label="Share of Voice"
          value={formatPercent(summary?.sov)}
          helper="Your visibility vs competitors"
        />
      </div>

      <section className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
        <div className="peec-border-stroke-tertiary flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-body-m-semibold peec-text-primary">
              Visibility
            </h2>
            <p className="text-body-s peec-text-tertiary">
              Showing data for {rangeLabel(range)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RangeToggle value={range} onChange={setRange} />
            <ChartModeToggle value={chartType} onChange={setChartType} />
          </div>
        </div>
        <div className="h-[300px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={barRows} margin={{ left: -10, right: 12 }}>
                <CartesianGrid
                  stroke="#e5e7eb"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(1)}%`,
                    'Visibility',
                  ]}
                />
                <Bar dataKey="visibility" radius={[5, 5, 0, 0]} maxBarSize={52}>
                  {barRows.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={
                        item.isSelf
                          ? '#d946ef'
                          : BAR_COLORS[index % BAR_COLORS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={lineRows} margin={{ left: -10, right: 12 }}>
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
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(1)}%`,
                    'Visibility',
                  ]}
                />
                {lineKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={BAR_COLORS[index % BAR_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
          <div className="peec-border-stroke-tertiary border-b px-4 py-3">
            <h2 className="text-body-m-semibold peec-text-primary">
              Top domains
            </h2>
            <p className="text-body-s peec-text-tertiary">
              Sources most often cited by AI answers
            </p>
          </div>
          <div>
            {(domains.data?.items ?? []).slice(0, 8).map((domain, index) => (
              <div
                key={domain.key}
                className="peec-border-stroke-tertiary hover:peec-bg-table-hover flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
              >
                <span className="text-body-s peec-text-tertiary w-5 tabular-nums">
                  {index + 1}
                </span>
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain.domain}&sz=64`}
                  alt=""
                  className="size-4 rounded-sm bg-slate-100"
                />
                <span className="text-body-m peec-text-primary min-w-0 flex-1 truncate font-semibold">
                  {domain.domain}
                </span>
                <SourceBadge
                  ownerType={domain.ownerType}
                  domainType={domain.type}
                />
                <span className="text-body-s peec-text-secondary tabular-nums">
                  {domain.retrievals}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
          <div className="peec-border-stroke-tertiary border-b px-4 py-3">
            <h2 className="text-body-m-semibold peec-text-primary">
              Latest run
            </h2>
            <p className="text-body-s peec-text-tertiary">
              {overviewData.latestRun
                ? formatDateTime(
                    overviewData.latestRun.finishedAt ??
                      overviewData.latestRun.createdAt,
                  )
                : 'No monitoring run yet'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-0">
            <RunStat
              label="Active prompts"
              value={overviewData.prompts.active}
            />
            <RunStat
              label="Monitored prompts"
              value={overviewData.prompts.monitored}
            />
            <RunStat
              label="Competitors"
              value={overviewData.competitors.length}
            />
            <RunStat label="Topics" value={overviewData.topics.length} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-h3 peec-text-primary">All Chats</h2>
        <p className="text-body-m peec-text-tertiary mt-0.5">
          Latest AI responses for monitored prompts
        </p>
      </section>

      <section className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
        {chats.data?.items?.length ? (
          <div className="overflow-x-auto">
            <div
              role="table"
              className="grid min-w-[900px]"
              style={{
                gridTemplateColumns:
                  'minmax(420px,1fr) 110px 110px 110px 150px',
              }}
            >
              <ChatHeader />
              <div
                role="rowgroup"
                className="col-span-full grid grid-cols-subgrid"
              >
                {chats.data?.items?.map((chat) => (
                  <div
                    key={chat.id}
                    className="col-span-full grid grid-cols-subgrid"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedChatId((current) =>
                          current === chat.id ? null : chat.id,
                        )
                      }
                      role="row"
                      className={cn(
                        'peec-bg-white hover:peec-bg-table-hover peec-border-stroke-tertiary col-span-full grid min-h-[54px] grid-cols-subgrid border-b text-left',
                        expandedChatId === chat.id && 'peec-bg-table-hover',
                      )}
                    >
                      <div
                        role="cell"
                        className="flex min-w-0 items-center gap-2 px-4 py-2"
                      >
                        <ChevronRight
                          className={cn(
                            'peec-text-tertiary size-3.5 shrink-0 transition-transform',
                            expandedChatId === chat.id && 'rotate-90',
                          )}
                        />
                        <Image
                          src={ENGINE_ICON_MAP[chat.engine]}
                          alt={ENGINE_LABELS[chat.engine]}
                          width={16}
                          height={16}
                          className="size-4"
                        />
                        <div className="min-w-0">
                          <p className="text-body-m peec-text-primary truncate font-semibold">
                            {chat.promptText}
                          </p>
                          <p className="text-body-s peec-text-tertiary truncate">
                            {chat.text}
                          </p>
                        </div>
                      </div>
                      <ChatCell>{chat.mentionsCount}</ChatCell>
                      <ChatCell>{chat.citationsCount}</ChatCell>
                      <ChatCell>
                        <Minus className="size-4 text-slate-300" />
                      </ChatCell>
                      <ChatCell>{formatDateTime(chat.createdAt)}</ChatCell>
                    </button>
                    {expandedChatId === chat.id ? (
                      <div className="peec-bg-table-hover peec-border-stroke-tertiary col-span-full border-b px-6 py-4">
                        <p className="text-body-s peec-text-tertiary mb-1.5 font-semibold">
                          Full response
                        </p>
                        <p className="text-body-m peec-text-primary whitespace-pre-wrap">
                          {chat.text || 'No response text available.'}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
        <Pagination
          page={chats.data?.page ?? chatPage}
          totalPages={chats.data?.totalPages ?? 1}
          total={chats.data?.total ?? 0}
          pageSize={chats.data?.limit ?? CHAT_PAGE_SIZE}
          label="chats"
          onChange={setChatPage}
        />
      </section>
    </DashboardFrame>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="peec-bg-white peec-border-stroke-tertiary rounded-[14px] border p-4">
      <p className="text-body-s peec-text-tertiary">{label}</p>
      <p className="peec-text-primary mt-1 text-[26px] font-semibold tracking-[-0.03em]">
        {value}
      </p>
      <p className="text-body-s peec-text-tertiary mt-1">{helper}</p>
    </div>
  );
}

function RunStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="peec-border-stroke-tertiary border-r border-b p-4">
      <p className="text-body-s peec-text-tertiary">{label}</p>
      <p className="text-h3 peec-text-primary mt-1">{value}</p>
    </div>
  );
}

function ChatHeader() {
  return (
    <div className="peec-bg-table-hover peec-border-stroke-tertiary col-span-full grid h-10 grid-cols-subgrid border-b">
      {['Chat', 'Mentions', 'Sources', 'Features', 'Created'].map((header) => (
        <div
          key={header}
          role="columnheader"
          className="text-body-s peec-text-tertiary flex items-center px-4"
        >
          {header}
        </div>
      ))}
    </div>
  );
}

function ChatCell({ children }: { children: ReactNode }) {
  return (
    <div
      role="cell"
      className="flex items-center px-4 font-medium tabular-nums"
    >
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-48 items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <p className="text-body-m-semibold peec-text-primary">No data found</p>
        <p className="text-body-s peec-text-tertiary mt-1">
          Try a different model or wait for the next monitoring run.
        </p>
      </div>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function rangeLabel(range: MonitoringRange) {
  if (range === 'D') return '7 days';
  if (range === 'W') return '8 weeks';
  return '6 months';
}
