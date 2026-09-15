'use client';

import { Info } from 'lucide-react';
import { useMemo } from 'react';
import type { TooltipContentProps } from 'recharts';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetPromptMentionRate } from '@/features/prompts/api/get-prompt-mention-rate';
import type { PromptMentionRate } from '@/features/prompts/types';
import { cn } from '@/utils/cn';
import { getFaviconUrl } from '@/utils/domain';
import { formatDateToMonthDate } from '@/utils/format';

import { useBrandHover } from '../_context/brand-hover-context';

const MAIN_BRAND_COLOR = '#789B00';
const COMPETITOR_COLORS = [
  '#7C6EE6',
  '#159F95',
  '#D9850B',
  '#4B7FE8',
  '#C85589',
  '#737780',
  '#B06D3C',
  '#5F8E59',
  '#8A62A9',
  '#2F8FAD',
  '#B26666',
  '#A88A2E',
] as const;

const CHART_HEIGHT = 260;

const percentFormatter = new Intl.NumberFormat('en', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

type MentionRateSeries = PromptMentionRate['series'][number] & {
  color: string;
  isMainBrand: boolean;
};

type ChartDatum = Record<string, string | number | null> & { date: string };

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

function getDateKeys(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);

  while (cursor <= end) {
    dates.push(toDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function getYAxis(maximumValue: number) {
  if (maximumValue <= 10) {
    return { maximum: 10, ticks: [0, 5, 10] };
  }

  if (maximumValue <= 40) {
    const maximum = Math.min(42, Math.ceil(maximumValue + 1));
    const ticks = Array.from(
      { length: Math.floor(maximum / 10) + 1 },
      (_, index) => index * 10,
    );

    return { maximum, ticks };
  }

  const maximum = Math.min(100, Math.ceil((maximumValue + 2) / 25) * 25);
  const ticks = Array.from(
    { length: Math.floor(maximum / 25) + 1 },
    (_, index) => index * 25,
  );

  return { maximum, ticks };
}

function MentionRatePopover({
  active,
  label,
  payload,
  series,
}: Partial<TooltipContentProps<number, string>> & {
  series: MentionRateSeries[];
}) {
  if (!active || !label || !payload?.length) return null;

  const values = new Map(
    payload.map((item) => [String(item.dataKey), Number(item.value)]),
  );

  return (
    <div
      className="bg-popover text-popover-foreground rounded-lg border p-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.16)]"
      style={{ width: 300, maxWidth: 'calc(100vw - 32px)' }}
    >
      <div className="mb-3 text-[13px] leading-none font-medium tabular-nums">
        {label}
      </div>
      <div className="space-y-2">
        {series.map((item) => {
          const value = values.get(item.brand.id);

          return (
            <div
              key={item.brand.id}
              className="grid grid-cols-[10px_20px_minmax(0,1fr)_auto] items-center gap-2"
            >
              <span
                className="size-2.5 rounded-[2px]"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <Avatar className="size-5 rounded-md">
                <AvatarImage
                  src={getFaviconUrl(item.brand.domain)}
                  alt={`${item.brand.name} favicon`}
                  className="object-contain"
                />
                <AvatarFallback className="rounded-md text-[9px] font-semibold">
                  {item.brand.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-[13px] leading-none font-medium">
                {item.brand.name}
              </span>
              <span className="text-[13px] leading-none font-medium tabular-nums">
                {value === undefined
                  ? '—'
                  : `${percentFormatter.format(value)}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type MentionRateWidgetProps = {
  businessId: string;
  promptId: string;
  className?: string;
};

export function MentionRateWidget({
  businessId,
  promptId,
  className,
}: MentionRateWidgetProps) {
  const { hoveredBrandId } = useBrandHover();
  const range = useMemo(() => getLastSevenDayRange(), []);
  const { data, isPending, isError } = useGetPromptMentionRate({
    businessId,
    promptId,
    ...range,
    granularity: 'day',
  });

  const series = useMemo<MentionRateSeries[]>(() => {
    let competitorIndex = 0;

    return (data?.series ?? []).map((item) => {
      const isMainBrand = item.brand.kind === 'BUSINESS';
      const color = isMainBrand
        ? MAIN_BRAND_COLOR
        : COMPETITOR_COLORS[competitorIndex++ % COMPETITOR_COLORS.length];

      return { ...item, color, isMainBrand };
    });
  }, [data]);

  const lineSeries = useMemo(
    () =>
      [...series].sort(
        (left, right) => Number(left.isMainBrand) - Number(right.isMainBrand),
      ),
    [series],
  );

  const chartData = useMemo<ChartDatum[]>(() => {
    const pointsByBrand = new Map(
      series.map((item) => [
        item.brand.id,
        new Map(item.points.map((point) => [point.date, point.mentionRate])),
      ]),
    );

    const rows = getDateKeys(range.from, range.to).map((date) => {
      const row: ChartDatum = { date };

      for (const item of series) {
        row[item.brand.id] =
          pointsByBrand.get(item.brand.id)?.get(date) ?? null;
      }

      return row;
    });

    const hasObservation = (row: ChartDatum) =>
      series.some((item) => row[item.brand.id] !== null);
    const firstObservedIndex = rows.findIndex(hasObservation);

    if (firstObservedIndex === -1) return [];

    let lastObservedIndex = rows.length - 1;

    while (!hasObservation(rows[lastObservedIndex])) {
      lastObservedIndex -= 1;
    }

    return rows.slice(firstObservedIndex, lastObservedIndex + 1);
  }, [range.from, range.to, series]);

  const chartConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        series.map((item) => [
          item.brand.id,
          { label: item.brand.name, color: item.color },
        ]),
      ),
    [series],
  );

  const yAxis = useMemo(() => {
    const maximumValue = Math.max(
      0,
      ...series.flatMap((item) => item.points.map((p) => p.mentionRate)),
    );

    return getYAxis(maximumValue);
  }, [series]);

  const xTicks = useMemo(
    () =>
      Array.from(
        new Set([chartData[0]?.date, chartData[chartData.length - 1]?.date]),
      ).filter((date): date is string => Boolean(date)),
    [chartData],
  );

  const highlightedBrandId = useMemo(
    () =>
      hoveredBrandId && series.some((item) => item.brand.id === hoveredBrandId)
        ? hoveredBrandId
        : null,
    [hoveredBrandId, series],
  );

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Mention Rate
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="About mention rate"
                className="cursor-default"
              >
                <Info className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="max-w-64">
              The percentage of AI responses that mention this brand.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 items-center">
        {isPending ? (
          <Skeleton
            className="w-full rounded-lg"
            style={{ height: CHART_HEIGHT }}
          />
        ) : isError ? (
          <div
            className="text-muted-foreground flex items-center justify-center text-sm"
            style={{ height: CHART_HEIGHT }}
          >
            Mention rate data is unavailable.
          </div>
        ) : series.length === 0 || chartData.length === 0 ? (
          <div
            className="text-muted-foreground flex items-center justify-center text-sm"
            style={{ height: CHART_HEIGHT }}
          >
            No mention rate data yet.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto w-full"
            style={{ height: CHART_HEIGHT }}
            initialDimension={{ width: 640, height: CHART_HEIGHT }}
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="6 7"
                stroke="var(--border)"
              />
              <ReferenceLine
                x={chartData[0]?.date}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.45}
                strokeDasharray="5 5"
              />
              <XAxis
                dataKey="date"
                ticks={xTicks}
                tickFormatter={formatDateToMonthDate}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                domain={[0, yAxis.maximum]}
                ticks={yAxis.ticks}
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={42}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                content={<MentionRatePopover series={series} />}
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ zIndex: 20 }}
              />
              {lineSeries.map((item) => (
                <Line
                  key={item.brand.id}
                  dataKey={item.brand.id}
                  name={item.brand.name}
                  type="monotone"
                  stroke={item.color}
                  strokeWidth={2}
                  opacity={
                    highlightedBrandId === null ||
                    highlightedBrandId === item.brand.id
                      ? 1
                      : 0.18
                  }
                  style={{ transition: 'opacity 150ms ease' }}
                  dot={{ r: 2.5, strokeWidth: 0, fill: item.color }}
                  activeDot={{ r: 4.5, strokeWidth: 0, fill: item.color }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
