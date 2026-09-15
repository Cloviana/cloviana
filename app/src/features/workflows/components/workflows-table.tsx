'use client';

import { format, isSameDay, subDays } from 'date-fns';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import type { FilterValue } from '@/components/ui/filter-sidebar';
import { PaginationControl } from '@/components/ui/pagination';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmptyValue,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/config/paths';
import type { WorkflowSummary } from '@/features/workflows/model';
import { useUrlPagination } from '@/hooks/use-url-pagination';

const PAGE_SIZE = 25;
const TIMESTAMP_FORMAT = 'MMM d, yyyy h:mm a';
const WORKFLOW_COLUMN_MIN_WIDTH = 360;
const COLUMN_WIDTHS = {
  selection: 48,
  enabled: 80,
  lastRun: 220,
  lastModified: 220,
} as const;
const TABLE_MIN_WIDTH =
  WORKFLOW_COLUMN_MIN_WIDTH +
  Object.values(COLUMN_WIDTHS).reduce((total, width) => total + width, 0);

function formatTimestamp(value: string) {
  return format(new Date(value), TIMESTAMP_FORMAT);
}

function matchesDatePreset(value: string | undefined, preset: string) {
  if (preset === 'never') return !value;
  if (!value) return false;

  const date = new Date(value);
  const now = new Date();

  if (preset === 'today') return isSameDay(date, now);
  if (preset === '7d') return date >= subDays(now, 7);
  if (preset === '30d') return date >= subDays(now, 30);

  return true;
}

function matchesWorkflowFilter(
  workflow: WorkflowSummary,
  filter: FilterValue<string>,
) {
  if (filter.values.length === 0) return true;

  let matches = true;

  if (filter.field === 'status') {
    matches = filter.values.includes(workflow.status);
  } else if (filter.field === 'runStatus') {
    matches = Boolean(
      workflow.lastRun && filter.values.includes(workflow.lastRun.status),
    );
  } else if (filter.field === 'lastRun') {
    const lastRunAt =
      workflow.lastRun?.completedAt ?? workflow.lastRun?.startedAt;
    matches = matchesDatePreset(lastRunAt, filter.values[0]);
  } else if (filter.field === 'modified') {
    matches = matchesDatePreset(workflow.updatedAt, filter.values[0]);
  }

  return matches;
}

type WorkflowsTableProps = {
  workflows?: WorkflowSummary[];
  filters?: FilterValue<string>[];
};

export function WorkflowsTable({
  workflows = [],
  filters = [],
}: WorkflowsTableProps) {
  const { businessId } = useParams<{ businessId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { page, setPage } = useUrlPagination();
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState<Set<string>>(
    () => new Set(),
  );
  const searchQuery = (searchParams.get('q') ?? '').trim().toLowerCase();
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesFilters = filters.every((filter) =>
      matchesWorkflowFilter(workflow, filter),
    );
    const searchableText = `${workflow.name} ${workflow.description ?? ''}`;
    const matchesSearch =
      !searchQuery || searchableText.toLowerCase().includes(searchQuery);

    return matchesFilters && matchesSearch;
  });
  const hasFilters = filters.length > 0 || Boolean(searchQuery);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredWorkflows.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageWorkflows = filteredWorkflows.slice(
    pageStart,
    pageStart + PAGE_SIZE,
  );
  const pageWorkflowIds = pageWorkflows.map((workflow) => workflow.id);
  const selectedPageCount = pageWorkflowIds.filter((workflowId) => {
    return selectedWorkflowIds.has(workflowId);
  }).length;
  const headerCheckboxState =
    selectedPageCount === 0
      ? false
      : selectedPageCount === pageWorkflows.length
        ? true
        : 'indeterminate';

  const toggleSelection = (workflowIds: string[], selected: boolean) => {
    setSelectedWorkflowIds((currentIds) => {
      const nextIds = new Set(currentIds);

      workflowIds.forEach((workflowId) => {
        if (selected) {
          nextIds.add(workflowId);
        } else {
          nextIds.delete(workflowId);
        }
      });

      return nextIds;
    });
  };

  return (
    <div className="bg-surface flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Table
          className="table-fixed text-[13px]"
          style={{ minWidth: TABLE_MIN_WIDTH }}
        >
          <TableCaption className="sr-only">
            Workflows for this business.
          </TableCaption>
          <colgroup>
            <col style={{ width: COLUMN_WIDTHS.selection }} />
            <col style={{ width: COLUMN_WIDTHS.enabled }} />
            <col />
            <col style={{ width: COLUMN_WIDTHS.lastRun }} />
            <col style={{ width: COLUMN_WIDTHS.lastModified }} />
          </colgroup>

          <TableHeader className="border-t">
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <Checkbox
                  checked={headerCheckboxState}
                  disabled={pageWorkflows.length === 0}
                  onCheckedChange={(checked) =>
                    toggleSelection(pageWorkflowIds, checked === true)
                  }
                  aria-label="Select all workflows on this page"
                />
              </TableHead>
              <TableHead>On / off</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Last run</TableHead>
              <TableHead>Last modified</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="[&_tr:last-child]:border-b">
            {pageWorkflows.map((workflow) => {
              const lastRunAt =
                workflow.lastRun?.completedAt ?? workflow.lastRun?.startedAt;
              const workflowHref = paths.business.workflows.detail.getHref(
                businessId,
                workflow.id,
              );

              return (
                <TableRow
                  key={workflow.id}
                  className="h-14 cursor-pointer"
                  onClick={(event) => {
                    const target = event.target;

                    if (
                      target instanceof HTMLElement &&
                      target.closest(
                        'a, button, input, select, textarea, [role="button"]',
                      )
                    ) {
                      return;
                    }

                    router.push(workflowHref);
                  }}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedWorkflowIds.has(workflow.id)}
                      onCheckedChange={(checked) =>
                        toggleSelection([workflow.id], checked === true)
                      }
                      aria-label={`Select workflow: ${workflow.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      defaultChecked={workflow.status === 'active'}
                      aria-label={`Turn ${workflow.name} on or off`}
                    />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <Link href={workflowHref} className="block min-w-0">
                      <div className="truncate font-medium">
                        {workflow.name}
                      </div>
                      {workflow.description && (
                        <div className="text-muted-foreground truncate text-xs">
                          {workflow.description}
                        </div>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {lastRunAt ? (
                      formatTimestamp(lastRunAt)
                    ) : (
                      <TableEmptyValue />
                    )}
                  </TableCell>
                  <TableCell>{formatTimestamp(workflow.updatedAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredWorkflows.length === 0 && (
          <Empty className="bg-surface min-h-0 rounded-none">
            <EmptyHeader>
              <EmptyTitle>
                {hasFilters ? 'No workflows found' : 'No workflows yet'}
              </EmptyTitle>
              <EmptyDescription>
                {hasFilters
                  ? 'No workflows match the current filters.'
                  : 'Create a workflow or start from a template.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      <div className="shrink-0 border-t px-3 py-2">
        <PaginationControl
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          itemLabel="workflows"
        />
      </div>
    </div>
  );
}
