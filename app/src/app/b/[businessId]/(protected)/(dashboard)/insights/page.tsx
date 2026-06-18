'use client';

import { Eye, GitCompareArrows, Smile, Target } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { PageLoading } from '@/components/fallbacks/page-loading';
import {
  DashboardFrame,
  ENGINE_LABELS,
  FilterSelect,
  formatPercent,
  RangeToggle,
} from '@/features/dashboard/components/monitoring-dashboard-ui';
import {
  useMonitoringGap,
  type GapBreakdown,
} from '@/features/monitoring/api/get-monitoring-gap';
import { useMonitoringOverview } from '@/features/monitoring/api/get-monitoring-overview';
import type {
  AiEngine,
  MonitoringOverview,
  MonitoringRange,
} from '@/features/monitoring/types';
import { cn } from '@/utils/cn';

type MatrixMetric = 'visibility' | 'citation' | 'sov' | 'sentiment';
type AxisMode = 'models-brands' | 'brands-models';

const METRICS: Array<{
  key: MatrixMetric;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: 'visibility', label: 'Visibility', icon: Eye },
  { key: 'sentiment', label: 'Sentiment', icon: Smile },
  { key: 'citation', label: 'Citation', icon: GitCompareArrows },
  { key: 'sov', label: 'SoV', icon: Target },
];

const ENGINE_ICON_MAP: Record<AiEngine, string> = {
  CHATGPT: '/logos/chatgpt-icon.svg',
  CLAUDE: '/logos/claude-color.svg',
  PERPLEXITY: '/logos/perplexity-color.svg',
  AI_OVERVIEWS: '/logos/google-aio-icon.svg',
};

export default function InsightsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [range, setRange] = useState<MonitoringRange>('M');
  const [metric, setMetric] = useState<MatrixMetric>('visibility');
  const [axisMode, setAxisMode] = useState<AxisMode>('models-brands');

  const overview = useMonitoringOverview(businessId);
  const gap = useMonitoringGap(businessId, { range });

  const matrix = useMemo(
    () => buildMatrix(overview.data, gap.data?.breakdown ?? [], metric),
    [gap.data?.breakdown, metric, overview.data],
  );
  const headline = useMemo(
    () => buildHeadline(gap.data?.breakdown ?? []),
    [gap.data?.breakdown],
  );
  const chartData = useMemo(
    () =>
      (overview.data?.trend ?? []).map((row) => ({
        date: new Date(row.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        visibility: row.mentionRate,
        citation: row.citationShare,
        sov: row.sov,
        sentiment: 50,
      })),
    [overview.data?.trend],
  );

  if (overview.isPending || gap.isPending) return <PageLoading />;

  if (overview.isError || gap.isError || !overview.data) {
    return (
      <DashboardFrame
        breadcrumb={['Brand', 'Insights']}
        title="Insights unavailable"
        description="Refresh once monitoring metrics have been generated."
      >
        <div />
      </DashboardFrame>
    );
  }

  const summary = overview.data.summary;
  const strongest = overview.data.engines.reduce<
    MonitoringOverview['engines'][number] | null
  >(
    (best, item) =>
      !best || item.mentionRate > best.mentionRate ? item : best,
    null,
  );
  const weakest = overview.data.engines.reduce<
    MonitoringOverview['engines'][number] | null
  >(
    (worst, item) =>
      !worst || item.mentionRate < worst.mentionRate ? item : worst,
    null,
  );

  return (
    <DashboardFrame
      breadcrumb={['Brand', 'Insights']}
      filters={<RangeToggle value={range} onChange={setRange} />}
    >
      <section>
        <h1 className="text-h3 peec-text-primary">{headline}</h1>
        <p className="text-body-m peec-text-tertiary mt-1">
          Compare visibility across models, competitors, and source dimensions.
        </p>
      </section>

      <section className="peec-bg-white peec-border-stroke-tertiary rounded-[14px] border">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard
            label="Visibility"
            value={formatPercent(summary?.mentionRate)}
          />
          <MetricCard label="Sentiment" value="50%" border />
          <MetricCard
            label="Position"
            value={matrix.selfRank ? `#${matrix.selfRank}` : '-'}
            border
          />
          <MetricCard label="SoV" value={formatPercent(summary?.sov)} border />
          <ModelCard
            label="Strongest model"
            engine={strongest?.engine}
            border
          />
          <ModelCard label="Weakest model" engine={weakest?.engine} border />
        </div>
      </section>

      <section className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
        <div className="peec-border-stroke-tertiary border-b px-5 py-4">
          <h2 className="text-body-m-semibold peec-text-primary">
            Your brand insights
          </h2>
          <p className="text-body-s peec-text-tertiary mt-0.5">
            How your brand metrics change over time
          </p>
        </div>
        <div className="peec-border-stroke-tertiary flex items-center justify-between border-b px-5 py-2">
          <MetricTabs metric={metric} onChange={setMetric} />
          <RangeToggle value={range} onChange={setRange} />
        </div>
        <div className="h-72 p-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: -14, right: 16 }}>
              <CartesianGrid stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)}%`, metric]}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="text-h3 peec-text-primary">Performance matrix</h2>
        <p className="text-body-m peec-text-tertiary mt-0.5">
          Compare metrics across different dimensions.
        </p>
      </section>

      <section className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
        <div className="peec-border-stroke-tertiary flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <MetricTabs metric={metric} onChange={setMetric} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setAxisMode((current) =>
                  current === 'models-brands'
                    ? 'brands-models'
                    : 'models-brands',
                )
              }
              className="peec-shadow-button-primary text-body-m inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3"
            >
              <GitCompareArrows className="size-4" />
              Switch axis
            </button>
            <FilterSelect
              value={axisMode}
              onChange={setAxisMode}
              options={[
                { value: 'models-brands', label: 'AI models vs Brands' },
                { value: 'brands-models', label: 'Brands vs AI models' },
              ]}
              label="Axis"
            />
          </div>
        </div>
        <PerformanceMatrix matrix={matrix} axisMode={axisMode} />
      </section>

      <section>
        <h2 className="text-h3 peec-text-primary">Top rankings</h2>
        <p className="text-body-m peec-text-tertiary mt-0.5">
          Leading brands by position
        </p>
      </section>

      <section className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
        <div className="peec-border-stroke-tertiary flex items-center justify-between border-b px-4 py-3">
          <MetricTabs metric={metric} onChange={setMetric} compact />
          <span className="peec-shadow-button-primary text-body-m rounded-[8px] px-3 py-1">
            By AI models
          </span>
        </div>
        <TopRankings matrix={matrix} />
      </section>
    </DashboardFrame>
  );
}

function MetricTabs({
  metric,
  onChange,
  compact = false,
}: {
  metric: MatrixMetric;
  onChange: (metric: MatrixMetric) => void;
  compact?: boolean;
}) {
  return (
    <div className="peec-bg-secondary flex items-center gap-1 rounded-[9px] p-1">
      {METRICS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'text-body-s flex h-7 items-center gap-1.5 rounded-[7px] px-2 transition-colors',
              metric === item.key
                ? 'peec-bg-white peec-text-primary font-semibold shadow-sm'
                : 'peec-text-tertiary hover:peec-text-primary',
            )}
          >
            <Icon className="size-3.5" />
            {metric === item.key || !compact ? <span>{item.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function PerformanceMatrix({
  matrix,
  axisMode,
}: {
  matrix: BuiltMatrix;
  axisMode: AxisMode;
}) {
  const rows = axisMode === 'models-brands' ? matrix.brands : matrix.engines;
  const columns = axisMode === 'models-brands' ? matrix.engines : matrix.brands;

  return (
    <div className="overflow-x-auto p-4">
      <div
        className="grid min-w-[780px] gap-px"
        style={{
          gridTemplateColumns: `160px repeat(${columns.length}, minmax(150px, 1fr))`,
        }}
      >
        <div className="text-body-s peec-text-primary px-2 py-2 font-semibold">
          {axisMode === 'models-brands' ? 'Brands' : 'AI models'}
        </div>
        {columns.map((column) => (
          <div
            key={column.key}
            className="text-body-s peec-text-secondary px-2 py-2 text-center font-medium"
          >
            {column.label}
          </div>
        ))}
        {rows.map((row) => (
          <div key={row.key} className="contents">
            <div className="text-body-m peec-text-primary flex items-center gap-1 px-2 py-2">
              {row.label}
              {row.isSelf ? (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  You
                </span>
              ) : null}
            </div>
            {columns.map((column) => {
              const value =
                axisMode === 'models-brands'
                  ? matrix.value(row.key, column.key)
                  : matrix.value(column.key, row.key);
              return (
                <div
                  key={`${row.key}-${column.key}`}
                  className="text-body-m flex h-10 items-center justify-center rounded-[10px] font-semibold tabular-nums"
                  style={{
                    backgroundColor: heat(value),
                    color: value >= 65 ? '#fff' : '#0f172a',
                  }}
                >
                  {formatPercent(value)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="text-body-s mt-4 flex flex-wrap items-center gap-3">
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((value) => (
          <span key={value} className="inline-flex items-center gap-1">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: heat(value) }}
            />
            {value === 0 ? '0%' : `${value + 1}-${value + 10}%`}
          </span>
        ))}
      </div>
    </div>
  );
}

function TopRankings({ matrix }: { matrix: BuiltMatrix }) {
  return (
    <div className="overflow-x-auto p-4">
      <div
        className="grid min-w-[900px] gap-px"
        style={{ gridTemplateColumns: '150px repeat(8, minmax(120px, 1fr))' }}
      >
        <div className="text-body-s peec-text-primary px-2 py-2 font-semibold">
          AI models
        </div>
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="text-body-s peec-text-tertiary px-2 py-2 text-center"
          >
            #{index + 1}
          </div>
        ))}
        {matrix.engines.map((engine) => {
          const ranked = [...matrix.brands].sort(
            (a, b) =>
              matrix.value(b.key, engine.key) - matrix.value(a.key, engine.key),
          );
          return (
            <div key={engine.key} className="contents">
              <div className="text-body-m peec-text-secondary flex items-center gap-2 px-2 py-2">
                <EngineIcon engine={engine.key as AiEngine} />
                {engine.label}
              </div>
              {Array.from({ length: 8 }, (_, index) => {
                const brand = ranked[index];
                return (
                  <div
                    key={`${engine.key}-${index}`}
                    className={cn(
                      'text-body-m flex h-10 items-center justify-center rounded-[10px] bg-orange-50 font-semibold',
                      brand?.isSelf
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-slate-950',
                    )}
                  >
                    {brand ? (
                      <span className="truncate">
                        {brand.label}
                        {brand.isSelf ? (
                          <span className="ml-1 rounded bg-orange-200 px-1 py-0.5 text-[11px]">
                            You
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      '-'
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="peec-border-stroke-tertiary text-body-s mt-4 flex gap-4 border-t pt-3">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-orange-50" />
          Other brands
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-orange-200" />
          Your brand
        </span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  border = false,
}: {
  label: string;
  value: string;
  border?: boolean;
}) {
  return (
    <div
      className={cn(
        'px-5 py-4',
        border && 'peec-border-stroke-tertiary border-l',
      )}
    >
      <p className="text-body-s peec-text-tertiary">{label}</p>
      <p className="peec-text-primary mt-1 text-[22px] font-semibold">
        {value}
      </p>
    </div>
  );
}

function ModelCard({
  label,
  engine,
  border = false,
}: {
  label: string;
  engine?: AiEngine;
  border?: boolean;
}) {
  return (
    <div
      className={cn(
        'px-5 py-4',
        border && 'peec-border-stroke-tertiary border-l',
      )}
    >
      <p className="text-body-s peec-text-tertiary">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {engine ? <EngineIcon engine={engine} /> : null}
        <span className="text-body-m-semibold peec-text-primary">
          {engine ? ENGINE_LABELS[engine] : '-'}
        </span>
      </div>
    </div>
  );
}

function EngineIcon({ engine }: { engine: AiEngine }) {
  return (
    <Image
      src={ENGINE_ICON_MAP[engine]}
      alt={ENGINE_LABELS[engine]}
      width={16}
      height={16}
      className="size-4"
    />
  );
}

type MatrixAxisItem = {
  key: string;
  label: string;
  isSelf?: boolean;
};

type BuiltMatrix = {
  brands: MatrixAxisItem[];
  engines: MatrixAxisItem[];
  selfRank: number | null;
  value: (brandKey: string, engineKey: string) => number;
};

function buildMatrix(
  overview: MonitoringOverview | undefined,
  breakdown: GapBreakdown[],
  metric: MatrixMetric,
): BuiltMatrix {
  const brands =
    overview?.matrix?.brands.map((brand) => ({
      key: brand.id ?? 'self',
      label: brand.name,
      isSelf: brand.isSelf,
    })) ??
    breakdown.map((brand) => ({
      key: brand.isSelf ? 'self' : brand.name,
      label: brand.name,
      isSelf: brand.isSelf,
    }));
  const engines =
    overview?.matrix?.engines.map((engine) => ({
      key: engine,
      label: ENGINE_LABELS[engine],
    })) ??
    overview?.engines.map((engine) => ({
      key: engine.engine,
      label: ENGINE_LABELS[engine.engine],
    })) ??
    [];
  const values = overview?.matrix?.values ?? [];
  const fallbackByBrand = new Map(
    breakdown.map((brand) => [brand.isSelf ? 'self' : brand.name, brand]),
  );
  const metricValue = (brandKey: string, engineKey: string): number => {
    const stored = values.find(
      (value) =>
        (value.competitorId ?? 'self') === brandKey &&
        value.engine === engineKey,
    );
    if (stored) {
      if (metric === 'citation') return stored.citationShare;
      if (metric === 'sov') return stored.sov;
      if (metric === 'sentiment') return 50;
      return stored.mentionRate;
    }
    const fallback = fallbackByBrand.get(brandKey);
    if (!fallback) return 0;
    if (metric === 'citation') return fallback.citationShare;
    if (metric === 'sov') return fallback.sov;
    if (metric === 'sentiment') return fallback.sov > 0 ? 50 : 0;
    return fallback.mentionRate;
  };
  const self = brands.find((brand) => brand.isSelf);
  const selfRank = self
    ? [...brands]
        .sort(
          (a, b) =>
            averageForBrand(b.key, engines, metricValue) -
            averageForBrand(a.key, engines, metricValue),
        )
        .findIndex((brand) => brand.key === self.key) + 1
    : null;

  return {
    brands,
    engines,
    selfRank,
    value: metricValue,
  };
}

function averageForBrand(
  brandKey: string,
  engines: MatrixAxisItem[],
  value: (brandKey: string, engineKey: string) => number,
) {
  if (!engines.length) return 0;
  return (
    engines.reduce((sum, engine) => sum + value(brandKey, engine.key), 0) /
    engines.length
  );
}

function buildHeadline(breakdown: GapBreakdown[]) {
  const sorted = [...breakdown].sort((a, b) => b.sov - a.sov);
  const selfIndex = sorted.findIndex((brand) => brand.isSelf);
  const rank = selfIndex >= 0 ? selfIndex + 1 : sorted.length;
  const leaders = sorted
    .filter((brand) => !brand.isSelf)
    .slice(0, Math.max(0, Math.min(3, rank - 1)))
    .map((brand) => brand.name);

  if (!leaders.length) return `You're #${rank || 1} in AI Visibility`;
  return `You're #${rank} in AI Visibility - ${leaders.join(', ')} lead`;
}

function heat(value: number) {
  if (value <= 0) return '#f1f8fa';
  if (value < 20) return '#dff3f7';
  if (value < 40) return '#a8ddea';
  if (value < 60) return '#66bfd1';
  if (value < 80) return '#31a6bd';
  return '#0795b0';
}
