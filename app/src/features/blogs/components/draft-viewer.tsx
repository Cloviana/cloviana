'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { useGetDraft } from '../api/get-draft';

type DraftViewerProps = {
  businessId: string;
  draftId: string;
};

export function DraftViewer({ businessId, draftId }: DraftViewerProps) {
  const { data: draft, isPending } = useGetDraft(businessId, draftId);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }
  if (!draft) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={draft.status === 'FLAGGED' ? 'destructive' : 'secondary'}>
          {draft.status === 'FLAGGED' ? 'Flagged by reviewer' : 'Ready'}
        </Badge>
      </div>

      {draft.status === 'FLAGGED' && (draft.violations?.length ?? 0) > 0 && (
        <Alert variant="destructive">
          <AlertTitle>The reviewer flagged this draft</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {draft.violations!.map((violation) => (
                <li key={violation}>{violation}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.body}</ReactMarkdown>
      </article>

      {(draft.sources?.length ?? 0) > 0 && (
        <div className="border-t pt-3">
          <p className="text-muted-foreground mb-1 text-xs font-medium">
            Sources
          </p>
          <ul className="space-y-1 text-sm">
            {draft.sources!.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {source.title || source.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
