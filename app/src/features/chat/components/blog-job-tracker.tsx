'use client';

import {
  BookOpenIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  FileSearchIcon,
  GlobeIcon,
  LinkIcon,
  ListFilterIcon,
  LoaderIcon,
  PenLineIcon,
  ScrollTextIcon,
  XCircleIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { toast } from 'sonner';

import { getDraft } from '@/features/blogs/api/get-draft';
import { useJobWatcher } from '@/features/jobs/hooks/use-job-watcher';
import { cn } from '@/utils/cn';

import type { BlogCanvasContent } from './blog-canvas';

type BlogStage = {
  index: number;
  key: string;
  status: string;
  detail: string;
  results?: { title: string; url?: string }[];
  at: string;
};

const STAGE_META: Record<string, { label: string; icon: typeof GlobeIcon }> = {
  internal_retrieval: { label: 'Searching knowledge base', icon: FileSearchIcon },
  topic_research: { label: 'Researching topic', icon: GlobeIcon },
  claim_research: { label: 'Researching claims', icon: ScrollTextIcon },
  source_selection: { label: 'Selecting sources', icon: ListFilterIcon },
  guidelines: { label: 'Extracting guidelines', icon: ClipboardCheckIcon },
  internal_links: { label: 'Finding internal links', icon: LinkIcon },
  generation: { label: 'Writing blog post', icon: PenLineIcon },
  review: { label: 'Reviewing draft', icon: BookOpenIcon },
  output: { label: 'Finalizing', icon: CheckCircle2Icon },
};

type BlogJobTrackerProps = {
  businessId: string;
  jobId: string;
  topic: string;
  onBlogReady?: (content: BlogCanvasContent) => void;
};

export const BlogJobTracker: FC<BlogJobTrackerProps> = ({
  businessId,
  jobId,
  topic,
  onBlogReady,
}) => {
  const [fetched, setFetched] = useState(false);

  const handleSuccess = useCallback(() => {
    setFetched(true);
  }, []);

  const handleFailure = useCallback(() => {
    toast.error('Blog generation failed', { description: topic });
  }, [topic]);

  const { data, isActive, isSuccess, isFailure } = useJobWatcher({
    businessId,
    jobId,
    enabled: true,
    pollMs: 3000,
    onSuccess: handleSuccess,
    onFailure: handleFailure,
  });

  // Fetch the full draft when the job completes
  useEffect(() => {
    if (!isSuccess || !fetched || !data?.job?.result) return;
    const draftId = (data.job.result as { draftId?: string }).draftId;
    if (!draftId || !onBlogReady) return;

    getDraft(businessId, draftId)
      .then((draft) => {
        onBlogReady({
          title: draft.title,
          body: draft.body,
          sources: draft.sources ?? [],
        });
      })
      .catch(() => {
        toast.error('Failed to load the draft');
      });
    // Only run once when fetched flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetched]);

  const stages: BlogStage[] = useMemo(() => {
    const raw = data?.runtime?.meta?.stages;
    if (!Array.isArray(raw)) return [];
    // Dedupe: keep only the latest event per stage index
    const byIndex = new Map<number, BlogStage>();
    for (const s of raw as BlogStage[]) {
      const existing = byIndex.get(s.index);
      if (!existing || s.status === 'done') byIndex.set(s.index, s);
    }
    return Array.from(byIndex.values()).sort((a, b) => a.index - b.index);
  }, [data?.runtime?.meta?.stages]);

  const currentStep = data?.runtime?.step;
  const percent = data?.runtime?.percent ?? 0;

  return (
    <div className="flex flex-col gap-2 py-2">
      {/* Progress bar */}
      {isActive && (
        <div className="flex items-center gap-2">
          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {percent}%
          </span>
        </div>
      )}

      {/* Stage cards */}
      {stages.map((stage) => {
        const meta = STAGE_META[stage.key] ?? {
          label: stage.key,
          icon: LoaderIcon,
        };
        const Icon = meta.icon;
        const isDone = stage.status === 'done';
        const isCurrent = !isDone && currentStep === stage.key;

        return (
          <div
            key={`${stage.index}-${stage.status}`}
            className={cn(
              'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm transition-all',
              isDone && 'border-green-200/60 bg-green-50/40 dark:border-green-900/30 dark:bg-green-950/20',
              isCurrent && 'border-primary/30 bg-primary/5',
              !isDone && !isCurrent && 'border-muted bg-muted/30',
            )}
          >
            <div className="mt-0.5 shrink-0">
              {isDone ? (
                <CheckCircle2Icon className="size-4 text-green-600 dark:text-green-400" />
              ) : isCurrent ? (
                <LoaderIcon className="size-4 text-primary animate-spin" />
              ) : (
                <Icon className="text-muted-foreground size-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium">{meta.label}</div>
              {stage.detail && (
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {stage.detail}
                </div>
              )}
              {stage.results && stage.results.length > 0 && isDone && (
                <ul className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                  {stage.results.slice(0, 5).map((r, i) => (
                    <li key={i} className="truncate">
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {r.title}
                        </a>
                      ) : (
                        r.title
                      )}
                    </li>
                  ))}
                  {stage.results.length > 5 && (
                    <li>and {stage.results.length - 5} more</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        );
      })}

      {/* Error state */}
      {isFailure && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
          <XCircleIcon className="size-4 shrink-0" />
          Blog generation failed. Try again.
        </div>
      )}
    </div>
  );
};
