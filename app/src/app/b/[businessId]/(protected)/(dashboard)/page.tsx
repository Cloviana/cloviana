'use client';

import { Activity, CheckCircle2, Clock3, Database, Search } from 'lucide-react';
import { useParams } from 'next/navigation';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { Page, PageContent, PageHeader } from '@/components/ui/page';
import { DomainsOverviewWidget } from '@/features/dashboard/components/domains-overview-widget';
import { useMonitoringOverview } from '@/features/monitoring/api/get-monitoring-overview';

const engineLabel = {
  CHATGPT: 'ChatGPT',
  CLAUDE: 'Claude',
  PERPLEXITY: 'Perplexity',
  AI_OVERVIEWS: 'Google AI Overviews',
} as const;

function formatPercent(value: number | null | undefined) {
  return `${Math.round(value ?? 0)}%`;
}

export default function MonitoringDashboardPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data, isPending, isError } = useMonitoringOverview(businessId);

  if (isPending) return <LoadingFallback />;
  if (isError || !data) {
    return (
      <Page>
        <PageHeader
          title="AI visibility"
          description="Monitoring data could not be loaded."
        />
      </Page>
    );
  }

  const runActive = ['PENDING', 'RUNNING'].includes(
    data.latestRun?.status ?? '',
  );
  const chartData = data.trend.map((metric) => ({
    ...metric,
    date: new Date(metric.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <Page className="bg-white py-6">
      <PageHeader
        title="AI visibility"
        description={`Monitoring ${data.prompts.active} approved prompts for ${data.business.name}.`}
      />
      <PageContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            {runActive ? (
              <Clock3 className="size-4 text-blue-600" />
            ) : (
              <CheckCircle2 className="size-4 text-emerald-600" />
            )}
            <span>
              {runActive
                ? 'Initial monitoring run is in progress'
                : data.latestRun?.status === 'SUCCESS'
                  ? 'Monitoring is active'
                  : 'Waiting for the first monitoring run'}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <span className={`h-1.5 w-1.5 rounded-full ${runActive ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
            {data.prompts.monitored}/{data.prompts.active} prompts measured
          </span>
        </div>

        <section className="grid gap-3 md:grid-cols-3">
          {[
            [
              'Visibility',
              formatPercent(data.summary?.mentionRate),
              'Answers mentioning the brand',
            ],
            [
              'Citation share',
              formatPercent(data.summary?.citationShare),
              'Tracked citations pointing to the brand',
            ],
            [
              'Share of voice',
              formatPercent(data.summary?.sov),
              'Mentions versus the comparison set',
            ],
          ].map(([label, value, description]) => (
            <div
              key={label}
              className="rounded-md border border-slate-200 bg-white p-4"
            >
              <p className="text-xs font-semibold text-slate-700">{label}</p>
              <p className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                {value}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Visibility trend
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Aggregate daily monitoring results
                </p>
              </div>
              <Activity className="size-4 text-slate-400" />
            </div>
            {chartData.length ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: -20, right: 12 }}>
                    <defs>
                      <linearGradient id="colorVisibility" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSov" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="mentionRate"
                      name="Visibility"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorVisibility)"
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sov"
                      name="Share of voice"
                      stroke="#0f172a"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSov)"
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center border-t border-slate-100 text-center">
                <div className="max-w-sm">
                  <Search className="mx-auto size-5 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-800">
                    Collecting the baseline
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Results appear after the first approved prompts run across
                    the configured AI engines.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Engine coverage
              </h2>
              <p className="mt-1 text-xs text-slate-650">
                Latest visibility by answer engine
              </p>
            </div>
            <div className="grid grid-cols-[1fr_80px_80px] items-center gap-4 px-4 py-2 bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-600">
              <span>Engine</span>
              <span className="text-right">Visibility</span>
              <span className="text-right">SOV</span>
            </div>
            <div className="divide-y divide-slate-100">
              {data.engines.length ? (
                data.engines.map((engine) => (
                  <div
                    key={engine.engine}
                    className="grid grid-cols-[1fr_80px_80px] items-center gap-4 px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-slate-800">
                      {engineLabel[engine.engine]}
                    </span>
                    <span className="text-right font-medium text-slate-700">
                      {formatPercent(engine.mentionRate)}
                    </span>
                    <span className="text-right font-bold text-slate-950">
                      {formatPercent(engine.sov)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="p-4 text-xs leading-5 text-slate-500">
                  Engine metrics will appear after the first run.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-200 p-4">
              <Database className="size-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">
                Tracked topics
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-slate-700">{topic.name}</span>
                  <span className="text-xs text-slate-400">
                    {topic.promptCount} prompts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Comparison set
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Brands used for share-of-voice calculations
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {data.competitors.map((competitor) => (
                <div
                  key={competitor.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="font-medium text-slate-700">
                    {competitor.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {competitor.domain}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <DomainsOverviewWidget businessId={businessId} />
      </PageContent>
    </Page>
  );
}
