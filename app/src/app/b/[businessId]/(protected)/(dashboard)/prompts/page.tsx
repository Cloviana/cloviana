'use client';

import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PageLoading } from '@/components/fallbacks/page-loading';
import {
  DashboardFrame,
  ENGINE_LABELS,
  ENGINE_OPTIONS,
  FilterSelect,
  formatDateTime,
  formatPercent,
  Pagination,
  ResetButton,
} from '@/features/dashboard/components/monitoring-dashboard-ui';
import { useMonitoringPrompts } from '@/features/monitoring/api/get-monitoring-prompts';
import { useUpdatePromptsStatus } from '@/features/monitoring/api/update-prompts-status';
import type {
  AiEngine,
  MonitoringPromptResponse,
} from '@/features/monitoring/types';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 10;
const ENGINE_ICON_MAP: Record<AiEngine, string> = {
  CHATGPT: '/logos/chatgpt-icon.svg',
  CLAUDE: '/logos/claude-color.svg',
  PERPLEXITY: '/logos/perplexity-color.svg',
  AI_OVERVIEWS: '/logos/google-aio-icon.svg',
};

type PromptRow = MonitoringPromptResponse['prompts'][number];
type PromptTab = 'active' | 'suggested' | 'archived';

export default function PromptsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data, isPending, isError } = useMonitoringPrompts(businessId);
  const updateStatusMutation = useUpdatePromptsStatus(businessId);
  const [search, setSearch] = useState('');
  const [engine, setEngine] = useState<AiEngine | 'ALL'>('ALL');
  const [topicId, setTopicId] = useState<string>('ALL');
  const [tab, setTab] = useState<PromptTab>('active');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleUpdateStatus = async (newStatus: 'ACTIVE' | 'INACTIVE') => {
    if (selectedIds.size === 0) return;
    try {
      await updateStatusMutation.mutateAsync({
        promptIds: Array.from(selectedIds),
        status: newStatus,
      });
      toast.success(
        newStatus === 'INACTIVE'
          ? `Archived ${selectedIds.size} prompt(s).`
          : `Restored ${selectedIds.size} prompt(s).`,
      );
      setSelectedIds(new Set());
    } catch {
      toast.error('Failed to update prompts status.');
    }
  };

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [search, engine, topicId, tab]);

  const topics = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    const promptsForTab = (data?.prompts ?? []).filter((prompt) => {
      if (tab === 'active') {
        return prompt.status === 'ACTIVE' && prompt.lastRunAt !== null;
      } else if (tab === 'suggested') {
        return prompt.status === 'ACTIVE' && prompt.lastRunAt === null;
      } else {
        return prompt.status === 'INACTIVE';
      }
    });

    for (const prompt of promptsForTab) {
      for (const topic of prompt.topics) {
        const existing = map.get(topic.id);
        map.set(topic.id, {
          id: topic.id,
          name: topic.name,
          count: (existing?.count ?? 0) + 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [data?.prompts, tab]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.prompts ?? []).filter((prompt) => {
      if (tab === 'active') {
        if (prompt.status !== 'ACTIVE' || prompt.lastRunAt === null)
          return false;
      } else if (tab === 'suggested') {
        if (prompt.status !== 'ACTIVE' || prompt.lastRunAt !== null)
          return false;
      } else if (tab === 'archived') {
        if (prompt.status !== 'INACTIVE') return false;
      }
      if (
        topicId !== 'ALL' &&
        !prompt.topics.some((topic) => topic.id === topicId)
      ) {
        return false;
      }
      if (
        engine !== 'ALL' &&
        !prompt.engines.some((response) => response.engine === engine)
      ) {
        return false;
      }
      if (!query) return true;
      return (
        prompt.text.toLowerCase().includes(query) ||
        prompt.topics.some((topic) => topic.name.toLowerCase().includes(query))
      );
    });
  }, [data?.prompts, engine, search, tab, topicId]);

  const tabTotal = useMemo(() => {
    return (data?.prompts ?? []).filter((prompt) => {
      if (tab === 'active') {
        return prompt.status === 'ACTIVE' && prompt.lastRunAt !== null;
      } else if (tab === 'suggested') {
        return prompt.status === 'ACTIVE' && prompt.lastRunAt === null;
      } else {
        return prompt.status === 'INACTIVE';
      }
    }).length;
  }, [data?.prompts, tab]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const metrics = calculatePromptMetrics(filtered, engine);

  const reset = () => {
    setSearch('');
    setEngine('ALL');
    setTopicId('ALL');
    setTab('active');
    setPage(1);
  };

  if (isPending) return <PageLoading />;

  if (isError || !data) {
    return (
      <DashboardFrame
        breadcrumb={['Monitoring', 'Prompts']}
        title="Prompts unavailable"
        description="Refresh once the API exposes prompt response details."
      >
        <EmptyState />
      </DashboardFrame>
    );
  }

  return (
    <DashboardFrame
      breadcrumb={['Monitoring', 'Prompts']}
      filters={
        <>
          <FilterSelect
            value={engine}
            onChange={setEngine}
            options={ENGINE_OPTIONS}
            label="Model"
          />
          <FilterSelect
            value={topicId}
            onChange={setTopicId}
            options={[
              { value: 'ALL', label: 'All Topics' },
              ...topics.map((topic) => ({
                value: topic.id,
                label: topic.name,
              })),
            ]}
            label="Topic"
          />
          <ResetButton onClick={reset} />
        </>
      }
    >
      <div className="flex min-h-[calc(100vh-150px)] divide-x divide-[var(--peec-border-stroke-tertiary)]">
        <aside className="hidden w-60 shrink-0 pr-4 md:block">
          <div className="flex items-center justify-between">
            <h2 className="text-body-m-semibold peec-text-primary">Topics</h2>
            <span className="text-body-s peec-text-tertiary">{tabTotal}</span>
          </div>
          <div className="mt-4 space-y-1">
            <TopicButton
              active={topicId === 'ALL'}
              label="All topics"
              count={tabTotal}
              onClick={() => setTopicId('ALL')}
            />
            {topics.map((topic) => (
              <TopicButton
                key={topic.id}
                active={topicId === topic.id}
                label={topic.name}
                count={topic.count}
                onClick={() => setTopicId(topic.id)}
              />
            ))}
          </div>
        </aside>

        <section className="min-w-0 flex-1 pl-0 md:pl-5">
          <div className="peec-border-stroke-tertiary flex items-center gap-0 border-b">
            {(['active', 'suggested', 'archived'] as PromptTab[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={cn(
                    'text-body-m relative inline-flex h-10 items-center px-3 capitalize transition-colors',
                    tab === item
                      ? 'peec-text-primary font-semibold'
                      : 'peec-text-tertiary hover:peec-text-primary',
                  )}
                >
                  {item}
                  {tab === item ? (
                    <span className="absolute right-0 bottom-0 left-0 h-[2px] rounded-t bg-blue-600" />
                  ) : null}
                </button>
              ),
            )}
          </div>

          <div className="flex flex-col gap-4 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex w-full items-center gap-3 sm:w-auto">
                <div className="relative w-[320px] max-w-full">
                  <Search className="peec-text-tertiary absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search prompts..."
                    className="peec-bg-input peec-border-stroke-quaternary text-body-m peec-text-primary placeholder:peec-text-tertiary h-8 w-full rounded-[10px] border px-3 pl-8 outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                  />
                </div>
                {selectedIds.size > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateStatus(
                        tab === 'archived' ? 'ACTIVE' : 'INACTIVE',
                      )
                    }
                    className="peec-bg-secondary peec-text-primary text-body-m flex h-8 items-center justify-center rounded-[10px] px-4 font-semibold transition-colors hover:bg-slate-200"
                  >
                    {tab === 'archived' ? 'Restore' : 'Archive'} (
                    {selectedIds.size})
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <MetricPill
                  label="Visibility"
                  value={formatPercent(metrics.visibility)}
                />
                <MetricPill label="Sentiment" value={`${metrics.sentiment}%`} />
                <MetricPill label="Position" value={metrics.position || '-'} />
                <MetricPill
                  label="Web Search"
                  value={formatPercent(metrics.webSearch)}
                />
              </div>
            </div>

            <section className="peec-bg-white peec-border-stroke-tertiary overflow-hidden rounded-[14px] border">
              {paginated.length ? (
                <div className="overflow-x-auto">
                  <div
                    role="table"
                    className="grid min-w-[1000px]"
                    style={{
                      gridTemplateColumns:
                        '44px minmax(320px,1fr) 100px 100px 100px 170px 130px 110px',
                    }}
                  >
                    <HeaderRow
                      allSelected={
                        paginated.length > 0 &&
                        paginated.every((prompt) => selectedIds.has(prompt.id))
                      }
                      onSelectAll={(checked) =>
                        setSelectedIds(
                          checked
                            ? new Set(paginated.map((prompt) => prompt.id))
                            : new Set(),
                        )
                      }
                    />
                    <div
                      role="rowgroup"
                      className="col-span-full grid grid-cols-subgrid"
                    >
                      {paginated.map((prompt) => (
                        <PromptRowView
                          key={prompt.id}
                          prompt={prompt}
                          engine={engine}
                          expanded={expandedId === prompt.id}
                          selected={selectedIds.has(prompt.id)}
                          onToggle={() =>
                            setExpandedId((current) =>
                              current === prompt.id ? null : prompt.id,
                            )
                          }
                          onSelect={(checked) =>
                            setSelectedIds((current) => {
                              const next = new Set(current);
                              if (checked) next.add(prompt.id);
                              else next.delete(prompt.id);
                              return next;
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState />
              )}
              <Pagination
                page={page}
                totalPages={totalPages}
                total={filtered.length}
                pageSize={PAGE_SIZE}
                label="prompts"
                onChange={setPage}
              />
            </section>
          </div>
        </section>
      </div>
    </DashboardFrame>
  );
}

function TopicButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-body-m flex w-full items-center justify-between rounded-[8px] px-2.5 py-1.5 text-left transition-colors',
        active
          ? 'peec-bg-secondary peec-text-primary font-semibold'
          : 'peec-text-tertiary hover:peec-bg-primary hover:peec-text-primary',
      )}
    >
      <span className="truncate">{label}</span>
      <span className="text-body-s peec-text-tertiary">{count}</span>
    </button>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="peec-bg-white peec-border-stroke-tertiary text-body-s flex items-center gap-2 rounded-[10px] border px-3 py-1">
      <span className="peec-text-tertiary">{label}</span>
      <span className="peec-text-primary font-semibold">{value}</span>
    </div>
  );
}

function HeaderRow({
  allSelected,
  onSelectAll,
}: {
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
}) {
  const headers = [
    '',
    'Prompt',
    'Visibility',
    'Sentiment',
    'Position',
    'Mentions',
    'Volume',
    'Branding',
  ];
  return (
    <div
      role="row"
      className="peec-bg-table-hover peec-border-stroke-tertiary col-span-full grid grid-cols-subgrid border-b"
    >
      {headers.map((header, index) => (
        <div
          key={header || 'checkbox'}
          role="columnheader"
          className="text-body-s peec-text-tertiary flex h-10 items-center px-4"
        >
          {index === 0 ? (
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => onSelectAll(event.target.checked)}
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
          ) : (
            header
          )}
        </div>
      ))}
    </div>
  );
}

function PromptRowView({
  prompt,
  engine,
  expanded,
  selected,
  onToggle,
  onSelect,
}: {
  prompt: PromptRow;
  engine: AiEngine | 'ALL';
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect: (checked: boolean) => void;
}) {
  const responses =
    engine === 'ALL'
      ? prompt.engines
      : prompt.engines.filter((response) => response.engine === engine);
  const ownPositions = responses
    .flatMap((response) => response.mentions)
    .filter((mention) => mention.isOwn)
    .map((mention) => mention.position);
  const position =
    ownPositions.length > 0
      ? (
          ownPositions.reduce((sum, item) => sum + item, 0) /
          ownPositions.length
        ).toFixed(1)
      : '-';
  const volume = Math.max(100, prompt.text.length * 8 + responses.length * 60);
  const isBranded = prompt.text
    .toLowerCase()
    .includes(prompt.topics[0]?.name.toLowerCase() ?? 'cloviana');

  return (
    <>
      <div
        role="row"
        className={cn(
          'peec-bg-white hover:peec-bg-table-hover peec-border-stroke-tertiary col-span-full grid min-h-[46px] grid-cols-subgrid border-b',
          expanded && 'peec-bg-table-hover',
        )}
      >
        <div role="cell" className="flex items-center px-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelect(event.target.checked)}
            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          />
        </div>
        <div role="cell" className="flex min-w-0 items-center px-4 py-2">
          <button
            type="button"
            onClick={onToggle}
            className="peec-text-tertiary hover:peec-text-primary mr-2 flex size-6 shrink-0 items-center justify-center rounded-md"
            aria-label={`Toggle ${prompt.text}`}
          >
            {expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="text-body-m-semibold peec-text-primary truncate text-left"
          >
            {prompt.text}
          </button>
        </div>
        <Cell>{formatPercent(prompt.metrics.mentionRate)}</Cell>
        <Cell>50%</Cell>
        <Cell>{position}</Cell>
        <div
          role="cell"
          className="flex flex-wrap items-center gap-1.5 px-4 py-2"
        >
          {responses.length ? (
            responses.map((response) => (
              <EngineCount key={response.engine} response={response} />
            ))
          ) : (
            <span className="text-body-s peec-text-tertiary">
              No model data
            </span>
          )}
        </div>
        <div role="cell" className="flex items-center gap-2 px-4">
          <span className="text-body-m min-w-10 font-medium tabular-nums">
            {volume}
          </span>
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${Math.min(100, (volume / 1000) * 100)}%` }}
            />
          </div>
        </div>
        <div role="cell" className="flex items-center px-4">
          <span
            className={cn(
              'rounded border border-solid px-1.5 py-0.5 text-[11px] font-medium',
              isBranded
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-700',
            )}
          >
            {isBranded ? 'Branded' : 'Generic'}
          </span>
        </div>
      </div>
      {expanded ? (
        <div className="peec-bg-table-hover peec-border-stroke-tertiary col-span-full border-b px-4 py-4">
          <div className="grid gap-3 lg:grid-cols-2">
            {responses.length ? (
              responses.map((response) => (
                <div
                  key={response.engine}
                  className="peec-bg-white peec-border-stroke-tertiary rounded-[14px] border"
                >
                  <div className="peec-border-stroke-tertiary flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Image
                        src={ENGINE_ICON_MAP[response.engine]}
                        alt={ENGINE_LABELS[response.engine]}
                        width={16}
                        height={16}
                        className="size-4"
                      />
                      <div>
                        <p className="text-body-m-semibold peec-text-primary">
                          {ENGINE_LABELS[response.engine]}
                        </p>
                        <p className="text-body-s peec-text-tertiary">
                          {response.status} /{' '}
                          {formatDateTime(response.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-body-s peec-text-tertiary text-right">
                      {formatPercent(response.mentionRate)} mention
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <pre className="peec-bg-input peec-border-stroke-quaternary text-body-s peec-text-primary max-h-56 overflow-auto rounded-[10px] border p-3 whitespace-pre-wrap">
                      {response.text ||
                        response.error ||
                        'No response text stored.'}
                    </pre>
                    <div className="grid gap-3 md:grid-cols-2">
                      <DetailList
                        title="Mentions"
                        empty="No mentions extracted."
                        items={response.mentions.slice(0, 8).map((mention) => (
                          <span key={mention.id}>
                            #{mention.position} {mention.name}
                          </span>
                        ))}
                      />
                      <DetailList
                        title="Citations"
                        empty="No citations extracted."
                        items={response.citations
                          .slice(0, 8)
                          .map((citation) => (
                            <a
                              key={citation.id}
                              href={citation.url}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate hover:underline"
                            >
                              #{citation.position}{' '}
                              {citation.title || citation.domain}
                            </a>
                          ))}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Cell({ children }: { children: ReactNode }) {
  return (
    <div
      role="cell"
      className="flex items-center px-4 font-medium tabular-nums"
    >
      {children}
    </div>
  );
}

function EngineCount({ response }: { response: PromptRow['engines'][number] }) {
  const ownMentions = response.mentions.filter(
    (mention) => mention.isOwn,
  ).length;
  return (
    <span
      className="peec-bg-secondary inline-flex items-center gap-1 rounded-[7px] px-1.5 py-0.5 text-[11px]"
      title={`${ENGINE_LABELS[response.engine]} mentions`}
    >
      <Image
        src={ENGINE_ICON_MAP[response.engine]}
        alt={ENGINE_LABELS[response.engine]}
        width={12}
        height={12}
        className="size-3"
      />
      {ownMentions}
    </span>
  );
}

function DetailList({
  title,
  items,
  empty,
}: {
  title: string;
  items: ReactNode[];
  empty: string;
}) {
  return (
    <div>
      <p className="text-body-s peec-text-tertiary mb-1 font-semibold">
        {title}
      </p>
      <div className="space-y-1">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={index}
              className="peec-bg-input text-body-s peec-text-primary truncate rounded-[8px] px-2 py-1.5"
            >
              {item}
            </div>
          ))
        ) : (
          <p className="text-body-s peec-text-tertiary">{empty}</p>
        )}
      </div>
    </div>
  );
}

function calculatePromptMetrics(
  prompts: PromptRow[],
  engine: AiEngine | 'ALL',
) {
  if (!prompts.length) {
    return { visibility: 0, sentiment: 50, position: '', webSearch: 0 };
  }
  const scoped = prompts.map((prompt) => ({
    ...prompt,
    engines:
      engine === 'ALL'
        ? prompt.engines
        : prompt.engines.filter((response) => response.engine === engine),
  }));
  const visibility =
    scoped.reduce((sum, prompt) => sum + prompt.metrics.mentionRate, 0) /
    scoped.length;
  const webSearch =
    scoped.reduce((sum, prompt) => sum + prompt.metrics.citationShare, 0) /
    scoped.length;
  const positions = scoped.flatMap((prompt) =>
    prompt.engines
      .flatMap((response) => response.mentions)
      .filter((mention) => mention.isOwn)
      .map((mention) => mention.position),
  );
  const position = positions.length
    ? (
        positions.reduce((sum, item) => sum + item, 0) / positions.length
      ).toFixed(1)
    : '';

  return { visibility, sentiment: 50, position, webSearch };
}

function EmptyState() {
  return (
    <div className="flex min-h-48 items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <p className="text-body-m-semibold peec-text-primary">
          No matching prompts
        </p>
        <p className="text-body-s peec-text-tertiary mt-1">
          Try another search, model, topic, or tab.
        </p>
      </div>
    </div>
  );
}
