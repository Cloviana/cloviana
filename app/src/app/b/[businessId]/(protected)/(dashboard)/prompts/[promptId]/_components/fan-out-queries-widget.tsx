'use client';

import {
  Claude,
  Gemini,
  OpenAI,
  Perplexity,
  type IconType,
} from '@lobehub/icons';
import { Info } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginationControl } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetPromptFanOutQueries } from '@/features/prompts/api/get-prompt-fan-out-queries';
import { getEngineOption } from '@/features/prompts/options';
import type { AiEngine } from '@/features/prompts/types';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 5;

const ENGINE_ICONS: Record<AiEngine, IconType> = {
  CHATGPT: OpenAI,
  CLAUDE: Claude.Color,
  PERPLEXITY: Perplexity.Color,
  AI_OVERVIEWS: Gemini.Color,
};

type FanOutQueriesWidgetProps = {
  businessId: string;
  promptId: string;
  className?: string;
};

export function FanOutQueriesWidget({
  businessId,
  promptId,
  className,
}: FanOutQueriesWidgetProps) {
  const [page, setPage] = useState(1);
  const fanOutQuery = useGetPromptFanOutQueries({
    businessId,
    promptId,
    page,
    limit: PAGE_SIZE,
  });
  const items = fanOutQuery.data?.items ?? [];
  const pageInfo = fanOutQuery.data?.pageInfo;

  return (
    <Card className={cn('h-full overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Fan-out Queries
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="About fan-out queries"
                className="cursor-default"
              >
                <Info className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-64">
              Additional searches AI engines used to research this prompt.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>

      {fanOutQuery.isError ? (
        <div className="text-muted-foreground flex min-h-52 flex-1 items-center justify-center border-t text-sm">
          Fan-out query data is unavailable.
        </div>
      ) : !fanOutQuery.isPending && items.length === 0 ? (
        <div className="text-muted-foreground flex min-h-52 flex-1 items-center justify-center border-t text-sm">
          No fan-out queries yet.
        </div>
      ) : (
        <Table className="table-fixed text-[13px]">
          <TableHeader className="border-t">
            <TableRow className="hover:bg-transparent">
              <TableHead>Query</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-b">
            {fanOutQuery.isPending
              ? Array.from({ length: PAGE_SIZE }, (_, index) => (
                  <TableRow key={index} className="h-10 hover:bg-transparent">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="size-4 shrink-0 rounded-sm" />
                        <Skeleton
                          className="h-3"
                          style={{ width: `${82 - index * 7}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              : items.map((item) => {
                  const engine = getEngineOption(item.engine);
                  const EngineIcon = ENGINE_ICONS[item.engine];

                  return (
                    <TableRow key={item.id} className="h-10">
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <EngineIcon
                            size={15}
                            className="shrink-0"
                            aria-label={engine.label}
                          />
                          <span
                            className="block min-w-0 truncate"
                            title={item.query}
                          >
                            {item.query}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      )}

      {(fanOutQuery.isPending || (pageInfo?.totalItems ?? 0) > 0) && (
        <CardFooter className="mt-auto border-t px-4 py-2 [.border-t]:pt-2">
          <PaginationControl
            page={pageInfo?.page ?? page}
            totalPages={pageInfo?.totalPages ?? 1}
            onPageChange={setPage}
            disabled={fanOutQuery.isFetching}
            itemLabel="fan-out queries"
          />
        </CardFooter>
      )}
    </Card>
  );
}
