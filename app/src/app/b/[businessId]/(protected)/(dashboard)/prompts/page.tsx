'use client';

import { Search, MessageSquare, AlertCircle, Calendar } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { Page, PageContent, PageHeader } from '@/components/ui/page';
import { useMonitoringOverview } from '@/features/monitoring/api/get-monitoring-overview';

const STAGE_CONFIG = {
  AWARENESS: {
    label: 'Awareness',
    dotColor: 'bg-sky-500',
  },
  EXPLORE: {
    label: 'Explore',
    dotColor: 'bg-blue-500',
  },
  CONSIDERATION: {
    label: 'Consideration',
    dotColor: 'bg-orange-500',
  },
  EVALUATE: {
    label: 'Evaluate',
    dotColor: 'bg-amber-500',
  },
  DECIDE: {
    label: 'Decide',
    dotColor: 'bg-violet-500',
  },
} as const;

export default function PromptsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data, isPending, isError } = useMonitoringOverview(businessId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');

  if (isPending) return <LoadingFallback />;
  if (isError || !data) {
    return (
      <Page>
        <PageHeader
          title="Prompts"
          description="Prompts data could not be loaded."
        />
      </Page>
    );
  }

  const filteredPrompts = data.prompts.list.filter((prompt) => {
    const matchesSearch =
      prompt.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.topics.some((topic) =>
        topic.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    const matchesStage =
      selectedStage === 'ALL' || prompt.awarenessStage === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <Page className="bg-white py-6">
      <PageHeader
        title="Prompts"
        description={`Manage and track ${data.prompts.active} prompts configured for visibility monitoring.`}
      />
      <PageContent className="space-y-6">
        {/* Filters bar */}
        <div className="flex flex-col gap-4 border-y border-slate-200 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search prompts or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-4 pl-10 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              'ALL',
              'AWARENESS',
              'CONSIDERATION',
              'EXPLORE',
              'EVALUATE',
              'DECIDE',
            ].map((stage) => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedStage === stage
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {stage === 'ALL'
                  ? 'All Stages'
                  : STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompts table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {filteredPrompts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Prompt Text</th>
                    <th className="px-6 py-4 font-semibold">Stage</th>
                    <th className="px-6 py-4 font-semibold">Topics</th>
                    <th className="px-6 py-4 font-semibold">Last Run</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrompts.map((prompt) => {
                    const stageConf =
                      STAGE_CONFIG[prompt.awarenessStage] ||
                      STAGE_CONFIG.AWARENESS;
                    return (
                      <tr
                        key={prompt.id}
                        className="group transition-colors hover:bg-slate-50"
                      >
                        <td className="max-w-lg px-6 py-4">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="mt-0.5 size-4 shrink-0 text-slate-400" />
                            <span className="leading-snug font-medium text-slate-800">
                              {prompt.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-700 uppercase">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${stageConf.dotColor}`}
                            />
                            {stageConf.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {prompt.topics.map((topic) => (
                              <span
                                key={topic}
                                className="text-slate-650 inline-flex items-center rounded-full border border-slate-200/50 bg-slate-50 px-2 py-0.5 text-[10px] font-medium"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs whitespace-nowrap text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-slate-400" />
                            <span>
                              {prompt.lastRunAt
                                ? new Date(prompt.lastRunAt).toLocaleDateString(
                                    undefined,
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    },
                                  )
                                : 'Not run yet'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <AlertCircle className="mb-3 size-8 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-800">
                No prompts found
              </h3>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Try adjusting your search query or stage filters to find
                matching prompts.
              </p>
            </div>
          )}
        </div>
      </PageContent>
    </Page>
  );
}
