'use client';

import {
  Claude,
  Gemini,
  OpenAI,
  Perplexity,
  type IconType,
} from '@lobehub/icons';
import { formatDistanceToNow } from 'date-fns';
import { Globe, Info } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginationControl } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
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
import { PromptResponseSheet } from '@/features/prompts/components/prompt-response-sheet';
import { getEngineOption } from '@/features/prompts/options';
import type { AiEngine, PromptResponse } from '@/features/prompts/types';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 5;

const COLUMNS: Array<{ label: string; width: number; tooltip?: string }> = [
  {
    label: 'Chat',
    width: 560,
    tooltip: 'The start of the answer the AI engine gave.',
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
    label: 'Position',
    width: 120,
    tooltip: 'Where your brand appears in the answer.',
  },
  { label: 'Created', width: 160 },
];

const TABLE_MIN_WIDTH = COLUMNS.reduce((total, { width }) => total + width, 0);

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
      aria-label={`Open ${engine.label} response`}
    >
      <StickyTableCell interactive className="whitespace-normal">
        <div className="flex items-center gap-3">
          <EngineIcon
            size={16}
            className="shrink-0"
            aria-label={engine.label}
          />
          <p className="min-w-0 truncate leading-5">
            {response.text ?? 'No answer text was returned.'}
          </p>
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
        <PositionValue value={response.metrics.position} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
      </TableCell>
    </TableRow>
  );
}

function ResponseSkeletonRow() {
  return (
    <TableRow className="h-14 hover:bg-transparent">
      <StickyTableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-3 w-96" />
        </div>
      </StickyTableCell>
      <TableCell>
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="size-4" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-8" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-20" />
      </TableCell>
    </TableRow>
  );
}

type ResponsesWidgetProps = {
  businessId: string;
  promptId: string;
  className?: string;
};

export function ResponsesWidget({
  businessId,
  promptId,
  className,
}: ResponsesWidgetProps) {
  const [page, setPage] = useState(1);
  const [responseId, setResponseId] = useState<string | null>(null);
  const responsesQuery = useGetPromptResponses({
    businessId,
    promptIds: [promptId],
    page,
    limit: PAGE_SIZE,
  });
  const responses = responsesQuery.data?.items ?? [];
  const pageInfo = responsesQuery.data?.pageInfo;

  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Responses
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="About responses"
                  className="cursor-default"
                >
                  <Info className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                AI responses collected for this prompt.
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>

        {responsesQuery.isError ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center border-t text-sm">
            Response data is unavailable.
          </div>
        ) : !responsesQuery.isPending && responses.length === 0 ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center border-t text-sm">
            No responses yet.
          </div>
        ) : (
          <Table
            className="table-fixed text-[13px]"
            style={{ minWidth: TABLE_MIN_WIDTH }}
          >
            <TableCaption className="sr-only">
              AI responses collected for this prompt.
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
                    <TableHead
                      key={column.label}
                      style={{ width: column.width }}
                    >
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
              {responsesQuery.isPending
                ? Array.from({ length: PAGE_SIZE }, (_, index) => (
                    <ResponseSkeletonRow key={index} />
                  ))
                : responses.map((response) => (
                    <ResponseRow
                      key={response.id}
                      response={response}
                      onOpen={() => setResponseId(response.id)}
                    />
                  ))}
            </TableBody>
          </Table>
        )}

        {(responsesQuery.isPending || (pageInfo?.totalItems ?? 0) > 0) && (
          <CardFooter className="border-t px-4 py-2 [.border-t]:pt-2">
            <PaginationControl
              page={pageInfo?.page ?? page}
              totalPages={pageInfo?.totalPages ?? 1}
              onPageChange={setPage}
              disabled={responsesQuery.isFetching}
              itemLabel="responses"
            />
          </CardFooter>
        )}
      </Card>

      <PromptResponseSheet
        businessId={businessId}
        responseId={responseId}
        open={responseId !== null}
        onOpenChange={(open) => {
          if (!open) setResponseId(null);
        }}
      />
    </>
  );
}
