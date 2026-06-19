'use client';

import { BarChart3, TrendingUp } from 'lucide-react';
import { useParams } from 'next/navigation';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { Page, PageContent, PageHeader } from '@/components/ui/page';
import { useMonitoringGap } from '@/features/monitoring/api/get-monitoring-gap';

const COLORS = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#6b7280',
];

function formatPercent(value: number | null | undefined) {
  return `${Math.round(value ?? 0)}%`;
}

export default function GapPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data, isPending, isError } = useMonitoringGap(businessId);

  if (isPending) return <LoadingFallback />;
  if (isError || !data) {
    return (
      <Page>
        <PageHeader
          title="Gap analysis"
          description="Gap analysis data could not be loaded."
        />
      </Page>
    );
  }

  const chartData = data.trend.map((row) => ({
    ...row,
    date: new Date(row.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }));

  // Find all key names except date
  const entityNames = data.trend.length
    ? Object.keys(data.trend[0]).filter((key) => key !== 'date')
    : [];

  return (
    <Page className="bg-white py-6">
      <PageHeader
        title="Visibility Gap Analysis"
        description="Compare your search visibility, citation share, and share of voice side-by-side with competitors."
      />
      <PageContent className="space-y-6">
        {/* SOV Trend Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Share of Voice (SOV) Trend
              </h2>
              <p className="text-xs text-slate-500">
                Comparing brand mentions over time vs. competitor set
              </p>
            </div>
            <TrendingUp className="size-4 text-slate-400" />
          </div>

          {chartData.length ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: -20, right: 12 }}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  {entityNames.map((name, index) => {
                    const isSelf = data.breakdown.find(
                      (item) => item.name === name,
                    )?.isSelf;
                    return (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={isSelf ? 2.5 : 1.5}
                        strokeDasharray={isSelf ? undefined : '4 4'}
                        dot={{ r: 3.5, strokeWidth: 1.5, fill: '#fff' }}
                        activeDot={{ r: 5 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center border-t border-slate-100 text-center">
              <div className="max-w-sm">
                <BarChart3 className="mx-auto size-5 text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-800">
                  Collecting historical trend
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Data will be visualized here as prompt runs populate the
                  metric database.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Breakdown table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Current Visibility Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Latest measured performance comparison
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    Brand / Competitor
                  </th>
                  <th className="px-6 py-4 font-semibold">Domain</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Visibility (Mentions)
                  </th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Citation Share
                  </th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Share of Voice
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.breakdown.map((item, index) => (
                  <tr
                    key={item.name}
                    className={`group transition-colors hover:bg-slate-50 ${
                      item.isSelf ? 'bg-indigo-50/20 hover:bg-indigo-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="font-semibold text-slate-800">
                          {item.name}
                        </span>
                        {item.isSelf && (
                          <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-indigo-700 uppercase">
                            Your Brand
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {item.domain}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold whitespace-nowrap text-slate-900">
                      {formatPercent(item.mentionRate)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold whitespace-nowrap text-slate-900">
                      {formatPercent(item.citationShare)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold whitespace-nowrap text-slate-900">
                      {formatPercent(item.sov)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageContent>
    </Page>
  );
}
