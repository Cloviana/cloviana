'use client';

import { FileText, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { Job, JobStatus } from '@/types/api';
import { cn } from '@/utils/cn';

const TYPE_LABELS: Record<string, string> = {
  BLOG_GENERATION: 'Blog draft',
  CMS_SYNC: 'CMS sync',
};

const STATUS_VARIANTS: Record<
  JobStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PENDING: 'outline',
  RUNNING: 'default',
  SUCCESS: 'secondary',
  FAILED: 'destructive',
};

type TaskRowProps = {
  job: Job;
  active: boolean;
  onSelect: (jobId: string) => void;
};

export function TaskRow({ job, active, onSelect }: TaskRowProps) {
  const Icon = job.type === 'CMS_SYNC' ? RefreshCw : FileText;

  return (
    <button
      type="button"
      onClick={() => onSelect(job.id)}
      className={cn(
        'hover:bg-accent flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors',
        active && 'bg-accent border-primary/40',
      )}
    >
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {TYPE_LABELS[job.type] ?? job.type}
        </span>
        <span className="text-muted-foreground block text-xs">
          {new Date(job.createdAt).toLocaleString()}
        </span>
      </span>
      <Badge variant={STATUS_VARIANTS[job.status]}>
        {job.status.toLowerCase()}
      </Badge>
    </button>
  );
}
