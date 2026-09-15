'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import {
  StickyTableCell,
  StickyTableHead,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeading,
  TableEmptyValue,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/config/paths';
import { useGetPrompts } from '@/features/prompts/api/get-prompts';
import { DomainAvatarStack } from '@/features/prompts/components/avatar-stack';
import { ScoreBar } from '@/features/prompts/components/score-bar';
import { getPromptListQuery } from '@/features/prompts/list-queries';
import { getBrandingLabel, getStageLabel } from '@/features/prompts/options';
import type { Prompt } from '@/features/prompts/types';

import { PromptsSelectionBar } from './selection-bar';

// Single source of truth for the column layout: the header cells, the table's
// minimum width and the empty row's colSpan are all derived from this.
const COLUMNS: Array<{ label: string; width: number; tooltip?: string }> = [
  { label: 'Prompt', width: 420 },
  { label: 'Status', width: 110 },
  {
    label: 'Visibility',
    width: 120,
    tooltip:
      'The percentage of AI responses in the last 7 days that mention your brand.',
  },
  {
    label: 'Citation',
    width: 120,
    tooltip:
      'The percentage of AI responses in the last 7 days that cite your website.',
  },
  {
    label: 'Sentiment',
    width: 130,
    tooltip:
      'The percentage of claims about your brand in the last 7 days that were positive.',
  },
  {
    label: 'Position',
    width: 120,
    tooltip:
      'The average position of your brand in AI responses in the last 7 days.',
  },
  {
    label: 'Mentions',
    width: 150,
    tooltip: 'The brands mentioned in the latest AI responses.',
  },
  {
    label: 'SOV',
    width: 100,
    tooltip: 'Your share of all brand mentions in the last 7 days.',
  },
  {
    label: 'Web Search',
    width: 130,
    tooltip:
      'The percentage of AI responses in the last 7 days that used web search.',
  },
  {
    label: 'Branding',
    width: 140,
    tooltip: 'Whether the prompt names your brand or stays vendor-neutral.',
  },
  {
    label: 'Stage',
    width: 140,
    tooltip:
      'Where the prompt sits in the buyer journey, from awareness to decision.',
  },
  {
    label: 'Topics',
    width: 220,
  },
  {
    label: 'Tags',
    width: 260,
  },
  { label: 'Added', width: 160 },
];

const TABLE_MIN_WIDTH = COLUMNS.reduce((total, { width }) => total + width, 0);

const EMPTY_PROMPTS: Prompt[] = [];

const percentFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
});

function BadgeList({ items }: { items: Array<{ id: string; label: string }> }) {
  if (!items.length) return <TableEmptyValue />;

  return (
    <div className="no-scrollbar flex max-w-full items-center gap-1.5 overflow-x-auto">
      {items.map((item) => (
        <Badge
          key={item.id}
          variant="muted"
          size="default"
          className="shrink-0 text-[13px]"
        >
          {item.label}
        </Badge>
      ))}
    </div>
  );
}

function MetricValue({ value }: { value: number | null }) {
  if (value === null) return <TableEmptyValue />;

  return (
    <div className="flex items-center gap-2 tabular-nums">
      <span>{percentFormatter.format(value)}%</span>
      <span className="text-muted-foreground" aria-label="No trend available">
        -
      </span>
    </div>
  );
}

function PositionValue({ value }: { value: number | null }) {
  if (value === null) return <TableEmptyValue />;

  return <span className="tabular-nums">{percentFormatter.format(value)}</span>;
}

function SentimentValue({ value }: { value: number | null }) {
  if (value === null) return <TableEmptyValue />;

  return <ScoreBar value={value} label="Sentiment score" />;
}

function StatusValue({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        data-active={active}
        className="bg-muted-foreground/60 data-[active=true]:bg-success-accent size-2 rounded-full"
        aria-hidden="true"
      />
      <span>{active ? 'Active' : 'Inactive'}</span>
    </div>
  );
}

function PromptRow({
  prompt,
  selected,
  href,
  onOpen,
  onSelectedChange,
}: {
  prompt: Prompt;
  selected: boolean;
  href: string;
  onOpen: () => void;
  onSelectedChange: (selected: boolean) => void;
}) {
  return (
    <TableRow
      className="group h-14 cursor-pointer"
      onClick={(event) => {
        const target = event.target;

        if (
          target instanceof HTMLElement &&
          target.closest('a, button, input, select, textarea, [role="button"]')
        ) {
          return;
        }

        onOpen();
      }}
    >
      <StickyTableCell interactive className="whitespace-normal">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectedChange(checked === true)}
            aria-label={`Select prompt: ${prompt.text}`}
          />
          <Link
            href={href}
            className="line-clamp-2 min-w-0 leading-5 font-medium"
          >
            {prompt.text}
          </Link>
        </div>
      </StickyTableCell>
      <TableCell>
        <StatusValue active={prompt.active} />
      </TableCell>
      <TableCell>
        <MetricValue value={prompt.metrics.visibility} />
      </TableCell>
      <TableCell>
        <MetricValue value={prompt.metrics.citationShare} />
      </TableCell>
      <TableCell>
        <SentimentValue value={prompt.metrics.sentiment} />
      </TableCell>
      <TableCell>
        <PositionValue value={prompt.metrics.position} />
      </TableCell>
      <TableCell>
        <DomainAvatarStack items={prompt.mentions} />
      </TableCell>
      <TableCell>
        <MetricValue value={prompt.metrics.sov} />
      </TableCell>
      <TableCell>
        <MetricValue value={prompt.metrics.webSearch} />
      </TableCell>
      <TableCell>{getBrandingLabel(prompt.branding)}</TableCell>
      <TableCell>{getStageLabel(prompt.stage)}</TableCell>
      <TableCell className="max-w-[220px]">
        <BadgeList
          items={prompt.topics.map(({ id, name }) => ({ id, label: name }))}
        />
      </TableCell>
      <TableCell className="max-w-[260px]">
        <BadgeList
          items={prompt.tags.map(({ id, text }) => ({ id, label: text }))}
        />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true })}
      </TableCell>
    </TableRow>
  );
}

export function PromptsTable() {
  const { businessId } = useParams<{ businessId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const promptsQuery = useGetPrompts({
    businessId,
    ...getPromptListQuery(searchParams),
  });
  const prompts = promptsQuery.data?.items ?? EMPTY_PROMPTS;
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(
    () => new Set(),
  );

  // ponytail: page-scoped — ids selected on other pages are still mutated, they
  // just cannot contribute to the header checkbox or the status the bar shows.
  const selectedPagePrompts = prompts.filter((prompt) =>
    selectedPromptIds.has(prompt.id),
  );
  const headerCheckboxState =
    selectedPagePrompts.length === 0
      ? false
      : selectedPagePrompts.length === prompts.length
        ? true
        : 'indeterminate';

  const toggleSelection = (promptIds: string[], selected: boolean) => {
    setSelectedPromptIds((currentIds) => {
      const nextIds = new Set(currentIds);

      for (const promptId of promptIds) {
        if (selected) {
          nextIds.add(promptId);
        } else {
          nextIds.delete(promptId);
        }
      }

      return nextIds;
    });
  };

  if (promptsQuery.isLoading) {
    return (
      <div className="bg-surface flex min-h-0 flex-1 items-center justify-center">
        <Spinner variant="1" className="text-muted-foreground size-5" />
      </div>
    );
  }

  if (promptsQuery.isError && prompts.length === 0) {
    return (
      <div className="bg-surface text-destructive flex min-h-0 flex-1 items-center justify-center text-sm">
        Could not load prompts.
      </div>
    );
  }

  return (
    <div className="no-scrollbar bg-surface flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* ponytail: zero-height sticky wrapper pins the bar without shifting the table */}
      <div className="sticky top-0 z-30 h-0">
        <PromptsSelectionBar
          businessId={businessId}
          selectedPromptIds={[...selectedPromptIds]}
          selectedCount={selectedPagePrompts.length}
          activeCount={
            selectedPagePrompts.filter((prompt) => prompt.active).length
          }
          onClear={() => setSelectedPromptIds(new Set())}
        />
      </div>

      <Table
        className="table-fixed text-[13px]"
        style={{ minWidth: TABLE_MIN_WIDTH }}
      >
        <TableCaption className="sr-only">
          Prompts tracked for this business.
        </TableCaption>

        <TableHeader className="border-t">
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((column, index) =>
              index === 0 ? (
                <StickyTableHead
                  key={column.label}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={headerCheckboxState}
                      onCheckedChange={(checked) =>
                        toggleSelection(
                          prompts.map((prompt) => prompt.id),
                          checked === true,
                        )
                      }
                      aria-label="Select all prompts on this page"
                    />
                    <TableColumnHeading
                      label={column.label}
                      tooltip={column.tooltip}
                    />
                  </div>
                </StickyTableHead>
              ) : (
                <TableHead key={column.label} style={{ width: column.width }}>
                  <TableColumnHeading
                    label={column.label}
                    tooltip={column.tooltip}
                  />
                </TableHead>
              ),
            )}
          </TableRow>
        </TableHeader>

        <TableBody className="[&_tr:last-child]:border-b">
          {prompts.map((prompt) => {
            const href = paths.business.prompts.detail.getHref(
              businessId,
              prompt.id,
            );

            return (
              <PromptRow
                key={prompt.id}
                prompt={prompt}
                selected={selectedPromptIds.has(prompt.id)}
                href={href}
                onOpen={() => router.push(href)}
                onSelectedChange={(selected) =>
                  toggleSelection([prompt.id], selected)
                }
              />
            );
          })}
        </TableBody>
      </Table>

      {prompts.length === 0 && (
        <Empty className="bg-surface min-h-0 rounded-none">
          <EmptyHeader>
            <EmptyTitle>No prompts found</EmptyTitle>
            <EmptyDescription>
              There are no prompts in the current view.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
