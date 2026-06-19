import {
  Globe,
  TrendingUp,
  AlertCircle,
  Building2,
  BookOpen,
  GraduationCap,
  FileText,
  Users,
  Link,
} from 'lucide-react';

import {
  useMonitoringDomains,
  DomainType,
} from '@/features/monitoring/api/get-monitoring-domains';

const TYPE_CONFIG: Record<
  DomainType | 'OTHER',
  { dotColor: string; label: string; icon: any }
> = {
  CORPORATE: {
    dotColor: 'bg-indigo-500',
    label: 'Corporate',
    icon: Building2,
  },
  REFERENCE: {
    dotColor: 'bg-blue-500',
    label: 'Reference',
    icon: BookOpen,
  },
  INSTITUTIONAL: {
    dotColor: 'bg-emerald-500',
    label: 'Institutional',
    icon: GraduationCap,
  },
  EDITORIAL: {
    dotColor: 'bg-amber-500',
    label: 'Editorial',
    icon: FileText,
  },
  UGC: {
    dotColor: 'bg-violet-500',
    label: 'UGC',
    icon: Users,
  },
  OTHER: {
    dotColor: 'bg-slate-400',
    label: 'Other',
    icon: Link,
  },
};

export function DomainsOverviewWidget({ businessId }: { businessId: string }) {
  const { data, isPending } = useMonitoringDomains(businessId);

  if (isPending)
    return (
      <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/50" />
    );
  if (!data) return null;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* Top Domains Panel */}
      <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <Globe className="size-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Top Domains
              </h2>
              <p className="text-xs text-slate-500">
                Most frequently retrieved across your prompt universe
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {data.topDomains.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Domain</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Retrieved
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Citation Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.topDomains.slice(0, 8).map((d) => {
                  const conf = TYPE_CONFIG[d.type] || TYPE_CONFIG.OTHER;
                  return (
                    <tr
                      key={d.domain}
                      className="group transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${d.domain}&sz=64`}
                            className="size-5 rounded-sm bg-slate-100"
                            alt=""
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="font-medium text-slate-700">
                            {d.domain}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                          <span className={`h-1.5 w-1.5 rounded-full ${conf.dotColor}`} />
                          {conf.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-900">
                        {Math.round(d.retrieved)}%
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500">
                        {d.citationRate.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <AlertCircle className="mb-2 size-5 text-slate-400" />
              <p className="text-sm font-medium text-slate-900">
                No domain data yet
              </p>
              <p className="text-xs text-slate-500">
                Wait for your first monitoring run to complete.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Panel */}
      <div className="flex flex-col gap-5">
        {/* Domain Types Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Domain Source Types
          </h2>
          <div className="space-y-4">
            {data.domainTypes.map((typeDist) => {
              const conf =
                TYPE_CONFIG[typeDist.type as DomainType] || TYPE_CONFIG.OTHER;
              return (
                <div key={typeDist.type}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <conf.icon className="size-3.5" />
                      {conf.label}
                    </div>
                    <span className="text-slate-500 font-semibold">
                      {Math.round(typeDist.percentage)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{ width: `${typeDist.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.domainTypes.length === 0 && (
              <p className="text-sm text-slate-500">
                Not enough data to calculate distribution.
              </p>
            )}
          </div>
        </div>

        {/* Trending Movers Mini-Panel */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50/50 to-white p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-indigo-950">
            <TrendingUp className="size-4 text-indigo-700" />
            Trending Sources
          </div>
          <div className="flex flex-wrap gap-2">
            {data.domainMovers.trending.slice(0, 5).map((d) => (
              <div
                key={d.domain}
                className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-900 shadow-xs"
              >
                {d.domain}
              </div>
            ))}
            {data.domainMovers.trending.length === 0 && (
              <span className="text-xs text-indigo-400">
                No trending data yet.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
