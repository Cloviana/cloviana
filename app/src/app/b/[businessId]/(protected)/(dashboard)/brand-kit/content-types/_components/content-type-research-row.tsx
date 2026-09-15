'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { Spinner } from '@/components/ui/spinner';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getBrandKitError } from '@/features/brand-kit/api/brand-kit-error';
import { useCreateBrandKitContentType } from '@/features/brand-kit/api/content-types';
import { useGetContentTypeResearch } from '@/features/brand-kit/api/get-content-type-research';
import { useCreateBrandKitSample } from '@/features/brand-kit/api/samples';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import type { ResearchJob } from '@/features/brand-kit/hooks/use-persisted-research-jobs';

const POLL_INTERVAL_MS = 2_000;

type ContentTypeResearchRowProps = {
  businessId: string;
  job: ResearchJob;
  onFinished: (workflowRunId: string) => void;
};

export function ContentTypeResearchRow({
  businessId,
  job,
  onFinished,
}: ContentTypeResearchRowProps) {
  const { setDraft } = useBrandKitDraft();
  const createContentType = useCreateBrandKitContentType();
  const createSample = useCreateBrandKitSample();
  const handled = useRef(false);
  const research = useGetContentTypeResearch(businessId, job.workflowRunId, {
    queryConfig: {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === 'SUCCESS' || status === 'FAILED'
          ? false
          : POLL_INTERVAL_MS;
      },
    },
  });

  useEffect(() => {
    if (handled.current || !research.data) return;

    if (research.data.status === 'SUCCESS') {
      handled.current = true;
      if (!research.data.result) {
        toast.error('Cloviana could not analyze this example');
        onFinished(job.workflowRunId);
        return;
      }

      const result = research.data.result;
      void (async () => {
        try {
          const savedContentType = (
            await createContentType.mutateAsync({
              businessId,
              ...result.contentType,
            })
          ).item;
          setDraft((previous) => ({
            ...previous,
            contentTypes: previous.contentTypes.some(
              (contentType) => contentType.id === savedContentType.id,
            )
              ? previous.contentTypes
              : [...previous.contentTypes, savedContentType],
          }));

          const savedSample = (
            await createSample.mutateAsync({
              businessId,
              id: crypto.randomUUID(),
              contentTypeId: savedContentType.id,
              audienceIds: [],
              regionIds: [],
              kind: result.sample.kind,
              value: result.sample.value,
              content: result.sample.content,
            })
          ).item;
          setDraft((previous) => ({
            ...previous,
            samples: previous.samples.some(
              (sample) => sample.id === savedSample.id,
            )
              ? previous.samples
              : [...previous.samples, savedSample],
          }));
        } catch (error) {
          toast.error(
            getBrandKitError(error, 'Could not save the analyzed content type'),
          );
        } finally {
          onFinished(job.workflowRunId);
        }
      })();
    } else if (research.data.status === 'FAILED') {
      handled.current = true;
      toast.error(
        research.data.error || 'Cloviana could not analyze this content type',
      );
      onFinished(job.workflowRunId);
    }
  }, [
    businessId,
    createContentType,
    createSample,
    job.workflowRunId,
    onFinished,
    research.data,
    setDraft,
  ]);

  return (
    <TableRow>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex w-fit items-center gap-2 text-xs leading-none font-medium"
              tabIndex={0}
            >
              <Spinner
                variant="1"
                className="text-muted-foreground size-3.5 shrink-0"
              />
              <span>{job.name}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6} className="max-w-72">
            Cloviana is extracting the example content and its primary call to
            action.
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell />
      <TableCell />
    </TableRow>
  );
}
