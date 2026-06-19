'use client';

import {
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Award,
  AlertCircle,
  Building2,
  BookOpen,
  GraduationCap,
  FileText,
  Users,
  Link,
  Search,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { Badge } from '@/components/ui/badge';
import { Page, PageContent, PageHeader } from '@/components/ui/page';
import {
  useMonitoringDomains,
  DomainType,
} from '@/features/monitoring/api/get-monitoring-domains';

const TYPE_CONFIG: Record<
  DomainType | 'OTHER',
  { color: string; label: string; icon: any }
> = {
  CORPORATE: {
    color:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900',
    label: 'Corporate',
    icon: Building2,
  },
  REFERENCE: {
    color:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
    label: 'Reference',
    icon: BookOpen,
  },
  INSTITUTIONAL: {
    color:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    label: 'Institutional',
    icon: GraduationCap,
  },
  EDITORIAL: {
    color:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    label: 'Editorial',
    icon: FileText,
  },
  UGC: {
    color:
      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900',
    label: 'UGC',
    icon: Users,
  },
  OTHER: {
    color:
      'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800',
    label: 'Other',
    icon: Link,
  },
};

type MoverTab = 'trending' | 'new' | 'top' | 'losing';

export default function DomainsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data, isPending, isError } = useMonitoringDomains(businessId);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MoverTab>('trending');

  if (isPending) return <LoadingFallback />;
  if (isError || !data) {
    return (
      <Page>
        <PageHeader
          title="Domains"
          description="Domains data could not be loaded."
        />
      </Page>
    );
  }

  const filteredTopDomains = data.topDomains.filter((d) =>
    d.domain.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const moverTabConfig = {
    trending: {
      label: 'Trending',
      icon: TrendingUp,
      list: data.domainMovers.trending,
    },
    new: {
      label: 'New Sources',
      icon: PlusCircle,
      list: data.domainMovers.new,
    },
    top: { label: 'Top Performers', icon: Award, list: data.domainMovers.top },
    losing: {
      label: 'Losing Ground',
      icon: TrendingDown,
      list: data.domainMovers.losing,
    },
  };

  return (
    <Page className="bg-white py-6">
      <PageHeader
        title="Domains"
        description={`Analyzing sources referenced across ${data.totalPrompts} prompts and ${data.totalRetrievals} retrievals.`}
      />
      <PageContent className="space-y-6">
        {/* Top metrics summary */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-700">
              Total Unique Domains
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {data.topDomains.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-700">
              Total Citations/Retrievals
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {data.totalRetrievals}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-700">
              Avg. Citations / Prompt
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {data.totalPrompts > 0
                ? (data.totalRetrievals / data.totalPrompts).toFixed(1)
                : 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-700">
              Corporate Share
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {Math.round(
                data.domainTypes.find((t) => t.type === 'CORPORATE')
                  ?.percentage ?? 0,
              )}
              %
            </p>
          </div>
        </section>

        {/* Layout split: Left Side Top Domains, Right Side Types & Movers */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Top Domains list */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                All Top Domains
              </h2>
              <p className="text-xs text-slate-500">
                Complete listing of sources driving brand visibility
              </p>

              <div className="relative mt-3">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter domains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-4 pl-10 text-xs outline-none placeholder:text-slate-400 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              {filteredTopDomains.length > 0 ? (
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
                    {filteredTopDomains.map((d) => {
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
                                className="size-5 shrink-0 rounded-sm bg-slate-100"
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
                            <span
                              className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${conf.color}`}
                            >
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
                  <p className="text-sm font-medium text-slate-800">
                    No domains match filter
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right side widgets */}
          <div className="space-y-6">
            {/* Domain Types Distribution */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Domain Source Types
              </h2>
              <div className="space-y-4">
                {data.domainTypes.map((typeDist) => {
                  const conf =
                    TYPE_CONFIG[typeDist.type as DomainType] ||
                    TYPE_CONFIG.OTHER;
                  return (
                    <div key={typeDist.type}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <conf.icon className="size-3.5" />
                          {conf.label}
                        </div>
                        <span className="font-semibold text-slate-500">
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
              </div>
            </div>

            {/* Movers Panel */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  Domain Movers
                </h2>
                <p className="text-xs text-slate-500">
                  Trending and dynamic citation changes
                </p>

                {/* Tabs bar */}
                <div className="mt-3 flex gap-1 rounded-lg bg-slate-100 p-0.5">
                  {(Object.keys(moverTabConfig) as MoverTab[]).map((tab) => {
                    const tabConf = moverTabConfig[tab];
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[10px] font-medium transition-all ${
                          activeTab === tab
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <tabConf.icon className="size-3" />
                        <span>{tabConf.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  {moverTabConfig[activeTab].list.slice(0, 6).map((d) => (
                    <div
                      key={d.domain}
                      className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-none last:pb-0"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${d.domain}&sz=64`}
                          className="size-4 shrink-0 rounded-sm bg-slate-50"
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          {d.domain}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-slate-150 px-1.5 py-0 text-[9px] font-normal"
                        >
                          Rate: {d.citationRate.toFixed(1)}
                        </Badge>
                        <span className="text-xs font-bold text-slate-800">
                          {Math.round(d.retrieved)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {moverTabConfig[activeTab].list.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-400">
                      No data available for this category
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </Page>
  );
}
