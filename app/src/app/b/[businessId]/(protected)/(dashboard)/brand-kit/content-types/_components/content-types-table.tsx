'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/config/paths';
import type { ResearchJob } from '@/features/brand-kit/hooks/use-persisted-research-jobs';
import type {
  BrandKitContentType,
  BrandKitSample,
} from '@/features/brand-kit/types';

import { ContentTypeResearchRow } from './content-type-research-row';

type ContentTypesTableProps = {
  businessId: string;
  contentTypes: BrandKitContentType[];
  samples: BrandKitSample[];
  researchJobs: ResearchJob[];
  onResearchFinished: (workflowRunId: string) => void;
  onDelete: (contentType: BrandKitContentType) => void;
};

export function ContentTypesTable({
  businessId,
  contentTypes,
  samples,
  researchJobs,
  onResearchFinished,
  onDelete,
}: ContentTypesTableProps) {
  const router = useRouter();
  const isEmpty = contentTypes.length === 0 && researchJobs.length === 0;

  return (
    <TableFrame variant="bordered">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="w-32">Samples</TableHead>
            <TableHead className="w-14 px-2">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {researchJobs.map((job) => (
            <ContentTypeResearchRow
              key={job.workflowRunId}
              businessId={businessId}
              job={job}
              onFinished={onResearchFinished}
            />
          ))}

          {contentTypes.map((contentType) => {
            const sampleCount = samples.filter(
              (sample) => sample.contentTypeId === contentType.id,
            ).length;
            const detailHref =
              paths.business.brandKit.contentTypes.detail.getHref(
                businessId,
                contentType.id,
              );

            return (
              <TableRow
                key={contentType.id}
                role="link"
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => router.push(detailHref)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') router.push(detailHref);
                }}
              >
                <TableCell className="text-xs font-medium whitespace-normal">
                  {contentType.name}
                </TableCell>
                <TableCell>
                  <span className="text-xs">
                    {sampleCount > 0
                      ? `${sampleCount} sample${sampleCount === 1 ? '' : 's'}`
                      : '-'}
                  </span>
                </TableCell>
                <TableCell
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${contentType.name}`}
                    onClick={() => onDelete(contentType)}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {isEmpty && (
        <Empty className="bg-surface min-h-0 rounded-none">
          <EmptyHeader>
            <EmptyTitle className="text-xs">No content types yet</EmptyTitle>
            <EmptyDescription className="text-xs">
              Add your first content type.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </TableFrame>
  );
}
