'use client';

import {
  Claude,
  Gemini,
  OpenAI,
  Perplexity,
  type IconType,
} from '@lobehub/icons';
import { formatDistanceToNow } from 'date-fns';
import { Globe } from 'lucide-react';
import { useParams, usePathname, useSearchParams } from 'next/navigation';

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetPromptResponses } from '@/features/prompts/api/get-prompt-responses';
import { DomainAvatarStack } from '@/features/prompts/components/avatar-stack';
import { ScoreBar } from '@/features/prompts/components/score-bar';
import { getPromptResponseListQuery } from '@/features/prompts/list-queries';
import { getEngineOption } from '@/features/prompts/options';
import type { AiEngine, PromptResponse } from '@/features/prompts/types';

import { PromptResponseSheet } from '../prompt-response-sheet';

// Single source of truth for the column layout: the header cells, the table's
// minimum width and the empty row's colSpan are all derived from this.
const COLUMNS: Array<{ label: string; width: number; tooltip?: string }> = [
  {
    label: 'Chat',
    width: 560,
    tooltip:
      'The prompt that was asked and the start of the answer the AI engine gave.',
  },
  {
    label: 'Mentions',
    width: 160,
    tooltip: 'Brands named in this answer, ordered by first appearance.',
  },
  {
    label: 'Sources',
    width: 160,
    tooltip: 'Unique domains ordered by their first citation in this answer.',
  },
  {
    label: 'Features',
    width: 130,
    tooltip:
      'Engine capabilities used for this answer, such as live web search.',
  },
  {
    label: 'Sentiment',
    width: 130,
    tooltip:
      'The percentage of positive sentiment claims about your brand in this answer.',
  },
  {
    label: 'Position',
    width: 120,
    tooltip: 'Where your brand appears in the answer.',
  },
  { label: 'Created', width: 160 },
];

const TABLE_MIN_WIDTH = COLUMNS.reduce((total, { width }) => total + width, 0);

const EMPTY_RESPONSES: PromptResponse[] = [];

const numberFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
});

const ENGINE_ICONS: Record<AiEngine, IconType> = {
  CHATGPT: OpenAI,
  CLAUDE: Claude.Color,
  PERPLEXITY: Perplexity.Color,
  AI_OVERVIEWS: Gemini.Color,
};

function FeaturesValue({ webSearch }: { webSearch: boolean }) {
  if (!webSearch) return <TableEmptyValue />;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-muted-foreground inline-flex cursor-default">
          <Globe className="size-4" aria-label="Web search" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        Web search
      </TooltipContent>
    </Tooltip>
  );
}

function SentimentValue({ value }: { value: number | null }) {
  if (value === null) return <TableEmptyValue />;

  return <ScoreBar value={value} label="Sentiment score" />;
}

function PositionValue({ value }: { value: number | null }) {
  if (value === null) return <TableEmptyValue />;

  return <span className="tabular-nums">{numberFormatter.format(value)}</span>;
}

function ResponseRow({
  response,
  onOpen,
}: {
  response: PromptResponse;
  onOpen: () => void;
}) {
  const engine = getEngineOption(response.engine);
  const EngineIcon = ENGINE_ICONS[response.engine];

  return (
    <TableRow
      className="group h-14 cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (
          event.currentTarget === event.target &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          onOpen();
        }
      }}
      aria-label={`Open response for: ${response.promptText}`}
    >
      <StickyTableCell interactive className="whitespace-normal">
        <div className="flex items-start gap-3">
          <EngineIcon
            size={16}
            className="mt-1 shrink-0"
            aria-label={engine.label}
          />
          <div className="min-w-0">
            <p className="truncate leading-5 font-medium">
              {response.promptText}
            </p>
            <p className="text-muted-foreground truncate leading-5">
              {response.text ?? 'No answer text was returned.'}
            </p>
          </div>
        </div>
      </StickyTableCell>
      <TableCell>
        <DomainAvatarStack items={response.mentions} />
      </TableCell>
      <TableCell>
        <DomainAvatarStack items={response.sources} />
      </TableCell>
      <TableCell>
        <FeaturesValue webSearch={response.webSearch} />
      </TableCell>
      <TableCell>
        <SentimentValue value={response.metrics.sentiment} />
      </TableCell>
      <TableCell>
        <PositionValue value={response.metrics.position} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
      </TableCell>
    </TableRow>
  );
}

export function ResponsesTable() {
  const { businessId } = useParams<{ businessId: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const responseId = searchParams.get('responseId')?.trim() || null;
  const responsesQuery = useGetPromptResponses({
    businessId,
    ...getPromptResponseListQuery(searchParams),
  });
  const responses = responsesQuery.data?.items ?? EMPTY_RESPONSES;

  const setResponseId = (nextResponseId: string | null) => {
    const params = new URLSearchParams(window.location.search);

    if (nextResponseId) {
      params.set('responseId', nextResponseId);
    } else {
      params.delete('responseId');
    }

    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      query ? `${pathname}?${query}` : pathname,
    );
  };
  const responseSheet = (
    <PromptResponseSheet
      businessId={businessId}
      responseId={responseId}
      open={responseId !== null}
      onOpenChange={(open) => {
        if (!open) setResponseId(null);
      }}
    />
  );

  if (responsesQuery.isLoading) {
    return (
      <>
        <div className="bg-surface flex min-h-0 flex-1 items-center justify-center">
          <Spinner variant="1" className="text-muted-foreground size-5" />
        </div>
        {responseSheet}
      </>
    );
  }

  if (responsesQuery.isError && responses.length === 0) {
    return (
      <>
        <div className="bg-surface text-destructive flex min-h-0 flex-1 items-center justify-center text-sm">
          Could not load responses.
        </div>
        {responseSheet}
      </>
    );
  }

  return (
    <>
      <div className="no-scrollbar bg-surface flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Table
          className="table-fixed text-[13px]"
          style={{ minWidth: TABLE_MIN_WIDTH }}
        >
          <TableCaption className="sr-only">
            AI responses collected for this business.
          </TableCaption>

          <TableHeader className="border-t">
            <TableRow className="hover:bg-transparent">
              {COLUMNS.map((column, index) =>
                index === 0 ? (
                  <StickyTableHead
                    key={column.label}
                    style={{ width: column.width }}
                  >
                    <TableColumnHeading
                      label={column.label}
                      tooltip={column.tooltip}
                    />
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
            {responses.map((response) => (
              <ResponseRow
                key={response.id}
                response={response}
                onOpen={() => setResponseId(response.id)}
              />
            ))}
          </TableBody>
        </Table>

        {responses.length === 0 && (
          <Empty className="bg-surface min-h-0 rounded-none">
            <EmptyHeader>
              <EmptyTitle>No responses found</EmptyTitle>
              <EmptyDescription>
                There are no AI responses in the current view.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      {responseSheet}
    </>
  );
}
