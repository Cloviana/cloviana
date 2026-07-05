'use client';

import { useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useGetDrafts } from '@/features/blogs/api/get-drafts';
import { DraftViewer } from '@/features/blogs/components/draft-viewer';
import { useGetJobs } from '@/features/jobs/api/get-jobs';
import { useJobWatcher } from '@/features/jobs/hooks/use-job-watcher';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Job } from '@/types/api';

import { TaskRow } from './task-row';

// Stage keys from the agent pipeline, humanized for the progress line.
const STEP_LABELS: Record<string, string> = {
  internal_retrieval: 'Reading business knowledge',
  topic_research: 'Researching the topic',
  claim_research: 'Gathering evidence per claim',
  source_selection: 'Selecting sources',
  guidelines: 'Writing content guidelines',
  internal_links: 'Picking internal links',
  generation: 'Writing the draft',
  review: 'Reviewing the draft',
  output: 'Finishing up',
};

const TASK_TYPES = ['BLOG_GENERATION', 'CMS_SYNC'];

export function TaskBoard({ businessId }: { businessId: string }) {
  const isMobile = useIsMobile();
  const { data: jobs = [], isPending } = useGetJobs(businessId);
  const tasks = jobs.filter((job) => TASK_TYPES.includes(job.type));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = tasks.find((job) => job.id === selectedId) ?? tasks[0];

  const list = (
    <div className="flex flex-col gap-2">
      {isPending && (
        <p className="text-muted-foreground p-3 text-sm">Loading tasks…</p>
      )}
      {!isPending && tasks.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No tasks yet</CardTitle>
            <CardDescription>
              Ask the chat to write a blog post and it will run here in the
              background.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {tasks.map((job) => (
        <TaskRow
          key={job.id}
          job={job}
          active={job.id === selected?.id}
          onSelect={setSelectedId}
        />
      ))}
    </div>
  );
  const detail = selected && (
    <TaskDetail businessId={businessId} job={selected} />
  );

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4">
        {list}
        {detail}
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="min-h-[calc(100vh-8rem)]"
    >
      <ResizablePanel defaultSize="30%" minSize="280px">
        <div className="pr-4">{list}</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="70%" minSize="480px">
        <div className="pl-4">{detail}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function TaskDetail({ businessId, job }: { businessId: string; job: Job }) {
  const { data, isActive, isFailure } = useJobWatcher({
    businessId,
    jobId: job.id,
    initialStatus: job.status,
  });
  const runtime = data?.runtime ?? null;
  const status = data?.job?.status ?? job.status;

  const { data: drafts = [] } = useGetDrafts(businessId, {
    queryConfig: {
      enabled: job.type === 'BLOG_GENERATION' && status === 'SUCCESS',
    },
  });
  const draft = drafts.find((item) => item.jobId === job.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {runtime?.title || draft?.title || 'Task'}
        </CardTitle>
        <CardDescription>
          Started {new Date(job.createdAt).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActive && (
          <div className="space-y-2">
            <p className="text-sm">
              {(runtime?.step && STEP_LABELS[runtime.step]) ||
                runtime?.step ||
                'Queued…'}
            </p>
            <Progress value={runtime?.percent ?? 0} />
          </div>
        )}

        {isFailure && (
          <p className="text-destructive text-sm">
            {data?.job?.error ?? 'This task failed.'}
          </p>
        )}

        {status === 'SUCCESS' && job.type === 'BLOG_GENERATION' && draft && (
          <DraftViewer businessId={businessId} draftId={draft.id} />
        )}
        {status === 'SUCCESS' && job.type === 'CMS_SYNC' && (
          <p className="text-muted-foreground text-sm">
            CMS pages synced successfully.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
