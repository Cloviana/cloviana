'use client';

import { Info } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PaginationControl } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeading,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetPromptBrandPerception } from '@/features/prompts/api/get-prompt-brand-perception';
import type { ClaimSentiment } from '@/features/prompts/types';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 5;
type SentimentFilter = 'all' | ClaimSentiment;

type BrandPerceptionWidgetProps = {
  businessId: string;
  promptId: string;
  className?: string;
};

export function BrandPerceptionWidget({
  businessId,
  promptId,
  className,
}: BrandPerceptionWidgetProps) {
  const [page, setPage] = useState(1);
  const [sentiment, setSentiment] = useState<SentimentFilter>('all');
  const perceptionQuery = useGetPromptBrandPerception({
    businessId,
    promptId,
    page,
    limit: PAGE_SIZE,
    sentiment: sentiment === 'all' ? undefined : sentiment,
  });
  const items = perceptionQuery.data?.items ?? [];
  const pageInfo = perceptionQuery.data?.pageInfo;

  return (
    <Card className={cn('h-full overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Brand Perception
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="About brand perception"
                className="cursor-default"
              >
                <Info className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-64">
              Claims AI responses make about your main brand for this prompt.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardAction className="self-center">
          <ToggleGroup
            type="single"
            value={sentiment}
            onValueChange={(value) => {
              if (!value) return;

              setSentiment(value as SentimentFilter);
              setPage(1);
            }}
            size="sm"
            className="bg-muted rounded-lg p-0.5"
            aria-label="Filter claims by sentiment"
          >
            <ToggleGroupItem
              value="all"
              className="data-[state=on]:bg-surface data-[state=on]:text-foreground h-7 rounded-md px-2.5 text-[13px] font-normal data-[state=on]:shadow-sm"
            >
              All
            </ToggleGroupItem>
            <ToggleGroupItem
              value="POSITIVE"
              className="data-[state=on]:bg-surface data-[state=on]:text-foreground h-7 rounded-md px-2.5 text-[13px] font-normal data-[state=on]:shadow-sm"
            >
              Positive
            </ToggleGroupItem>
            <ToggleGroupItem
              value="NEGATIVE"
              className="data-[state=on]:bg-surface data-[state=on]:text-foreground h-7 rounded-md px-2.5 text-[13px] font-normal data-[state=on]:shadow-sm"
            >
              Negative
            </ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>

      {perceptionQuery.isError ? (
        <div className="text-muted-foreground flex min-h-52 flex-1 items-center justify-center border-t text-sm">
          Brand perception data is unavailable.
        </div>
      ) : !perceptionQuery.isPending && items.length === 0 ? (
        <div className="text-muted-foreground flex min-h-52 flex-1 items-center justify-center border-t text-sm">
          No {sentiment === 'all' ? '' : sentiment.toLowerCase()} brand
          perception claims yet.
        </div>
      ) : (
        <Table className="table-fixed text-[13px]">
          <TableHeader className="border-t">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-3/4">
                <TableColumnHeading
                  label="Claim"
                  tooltip="A statement an AI response made about your main brand."
                />
              </TableHead>
              <TableHead className="w-1/4">Sentiment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-b">
            {perceptionQuery.isPending
              ? Array.from({ length: PAGE_SIZE }, (_, index) => (
                  <TableRow key={index} className="h-10 hover:bg-transparent">
                    <TableCell>
                      <Skeleton
                        className="h-3"
                        style={{ width: `${88 - index * 6}%` }}
                      />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              : items.map((item) => (
                  <TableRow key={item.id} className="h-10">
                    <TableCell>
                      <span className="block truncate" title={item.label}>
                        {item.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        size="sm"
                        variant={
                          item.sentiment === 'POSITIVE'
                            ? 'success'
                            : 'destructive'
                        }
                      >
                        {item.sentiment === 'POSITIVE'
                          ? 'Positive'
                          : 'Negative'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      )}

      {(perceptionQuery.isPending || (pageInfo?.totalItems ?? 0) > 0) && (
        <CardFooter className="mt-auto border-t px-4 py-2 [.border-t]:pt-2">
          <PaginationControl
            page={pageInfo?.page ?? page}
            totalPages={pageInfo?.totalPages ?? 1}
            onPageChange={setPage}
            disabled={perceptionQuery.isFetching}
            itemLabel="brand perception claims"
          />
        </CardFooter>
      )}
    </Card>
  );
}
