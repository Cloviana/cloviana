'use client';

import { Info } from 'lucide-react';
import { useMemo } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  StickyTableCell,
  StickyTableHead,
  Table,
  TableBody,
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
import { useGetPromptRanking } from '@/features/prompts/api/get-prompt-ranking';
import { ScoreBar } from '@/features/prompts/components/score-bar';
import type { PromptRankingItem } from '@/features/prompts/types';
import { cn } from '@/utils/cn';
import { getFaviconUrl } from '@/utils/domain';

import { useBrandHover } from '../_context/brand-hover-context';

type RankingWidgetProps = {
  businessId: string;
  promptId: string;
  className?: string;
};

const percentFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
});

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getLastSevenDayRange() {
  const now = new Date();
  const toDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const fromDate = new Date(toDate);

  fromDate.setUTCDate(fromDate.getUTCDate() - 6);

  return { from: toDateKey(fromDate), to: toDateKey(toDate) };
}

function PercentValue({ value }: { value: number }) {
  return (
    <span className="tabular-nums">{percentFormatter.format(value)}%</span>
  );
}

function SentimentValue({ value }: { value: number | null }) {
  if (value === null) return <TableEmptyValue />;

  return <ScoreBar value={value} label="Sentiment score" />;
}

function PositionValue({ value }: { value: number | null }) {
  if (value === null) return <TableEmptyValue />;

  return (
    <span className="tabular-nums"># {percentFormatter.format(value)}</span>
  );
}

function RankingRow({ item }: { item: PromptRankingItem }) {
  const isMainBrand = item.brand.kind === 'BUSINESS';
  const { setHoveredBrandId } = useBrandHover();

  return (
    <TableRow
      className="group h-10"
      onMouseEnter={() => setHoveredBrandId(item.brand.id)}
      onMouseLeave={() => setHoveredBrandId(null)}
    >
      <StickyTableCell interactive shadow={false} className="tabular-nums">
        {item.rank}
      </StickyTableCell>
      <StickyTableCell offset={12} interactive>
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className={'bg-surface size-5 rounded-md'}>
            <AvatarImage
              src={getFaviconUrl(item.brand.domain)}
              alt={`${item.brand.name} favicon`}
            />
            <AvatarFallback className="rounded-md text-[9px] font-medium">
              {item.brand.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className={cn('truncate', isMainBrand && 'font-semibold')}>
            {item.brand.name}
          </span>
        </div>
      </StickyTableCell>
      <TableCell>
        <PercentValue value={item.mentionRate} />
      </TableCell>
      <TableCell>
        <PercentValue value={item.shareOfVoice} />
      </TableCell>
      <TableCell>
        <SentimentValue value={item.sentiment} />
      </TableCell>
      <TableCell>
        <PositionValue value={item.position} />
      </TableCell>
    </TableRow>
  );
}

function RankingSkeletonRow() {
  return (
    <TableRow className="h-10 hover:bg-transparent">
      <StickyTableCell shadow={false}>
        <Skeleton className="h-3 w-2.5" />
      </StickyTableCell>
      <StickyTableCell offset={12}>
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-md" />
          <Skeleton className="h-3 w-20" />
        </div>
      </StickyTableCell>
      <TableCell>
        <Skeleton className="h-3 w-12" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-12" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-2.5 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-10" />
      </TableCell>
    </TableRow>
  );
}

export function RankingWidget({
  businessId,
  promptId,
  className,
}: RankingWidgetProps) {
  const range = useMemo(() => getLastSevenDayRange(), []);
  const rankingQuery = useGetPromptRanking({
    businessId,
    promptId,
    ...range,
  });
  const items = rankingQuery.data?.items ?? [];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Top 7 Brands
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="About brand ranking"
                className="cursor-default"
              >
                <Info className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-64">
              Tracked brands ranked by mention rate over the last seven days.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>

      {rankingQuery.isError ? (
        <div className="text-muted-foreground flex h-72 items-center justify-center text-sm">
          Ranking data is unavailable.
        </div>
      ) : !rankingQuery.isPending && items.length === 0 ? (
        <div className="text-muted-foreground flex h-72 items-center justify-center text-sm">
          No ranking data yet.
        </div>
      ) : (
        <Table className="min-w-[640px] table-fixed text-[13px]">
          <TableHeader className="border-t">
            <TableRow>
              <StickyTableHead shadow={false} className="w-12">
                #
              </StickyTableHead>
              <StickyTableHead offset={12} className="w-[25%]">
                Brand
              </StickyTableHead>
              <TableHead className="w-[16%]">
                <TableColumnHeading
                  label="Visibility"
                  tooltip="The percentage of successful AI responses from the last seven days that mention this brand."
                />
              </TableHead>
              <TableHead className="w-[13%]">
                <TableColumnHeading
                  label="SOV"
                  tooltip="This brand's share of all tracked-brand mentions over the last seven days."
                />
              </TableHead>
              <TableHead className="w-[23%]">
                <TableColumnHeading
                  label="Sentiment"
                  tooltip="The percentage of this brand's claims from the last seven days that are positive."
                />
              </TableHead>
              <TableHead className="w-[15.5%]">
                <TableColumnHeading
                  label="Position"
                  tooltip="This brand's average mention position in AI responses over the last seven days."
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankingQuery.isPending
              ? Array.from({ length: 7 }, (_, index) => (
                  <RankingSkeletonRow key={index} />
                ))
              : items.map((item) => (
                  <RankingRow key={item.brand.id} item={item} />
                ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
