'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useId, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Keyword } from '@/types/api';

function IntentBadge({ intents }: { intents: Keyword['intents'] }) {
  const colors: Record<'I' | 'C' | 'L' | 'N', string> = {
    I: 'bg-yellow-100 text-yellow-800',
    C: 'bg-sky-100 text-sky-800',
    L: 'bg-purple-100 text-purple-800',
    N: 'bg-orange-100 text-orange-800',
  };
  const labels: Record<'I' | 'C' | 'L' | 'N', string> = {
    I: 'Informational',
    C: 'Commercial',
    L: 'Transactional',
    N: 'Navigational',
  };
  return (
    <TooltipProvider>
      <div className="flex gap-1">
        {intents.map((intent, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span
                className={`cursor-default rounded px-2 py-0.5 text-xs font-medium ${colors[intent]}`}
              >
                {intent}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{labels[intent]}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

function HistoryChart({ data }: { data: Record<string, number> }) {
  const id = useId();
  const chartData = useMemo(
    () =>
      Object.entries(data)
        .map(([date, value]) => ({ date, value }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
    [data],
  );
  if (!chartData.length) return null;
  const improving = chartData[chartData.length - 1].value >= chartData[0].value;
  return (
    <div
      className={improving ? 'text-emerald-600' : 'text-rose-600'}
      style={{ width: 120, height: 32 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`hist-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.4} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="currentColor"
            fill={`url(#hist-${id})`}
            strokeWidth={2}
            isAnimationActive
            animationDuration={900}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DifficultyCell({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const label =
    v >= 70
      ? 'Very Hard'
      : v >= 50
        ? 'Hard'
        : v >= 30
          ? 'Medium'
          : v >= 15
            ? 'Easy'
            : 'Very Easy';
  const tone =
    v >= 70
      ? { bar: 'bg-red-500', chip: 'bg-red-100 text-red-900' }
      : v >= 50
        ? { bar: 'bg-orange-500', chip: 'bg-orange-100 text-orange-900' }
        : v >= 30
          ? { bar: 'bg-amber-500', chip: 'bg-amber-100 text-amber-900' }
          : { bar: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-900' };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-end gap-3">
            <div className="w-28">
              <div className="h-2 w-full rounded bg-muted/50">
                <div
                  className={`h-2 rounded ${tone.bar}`}
                  style={{ width: `${v}%` }}
                />
              </div>
            </div>
            <span
              className={`min-w-12 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${tone.chip}`}
            >
              {v}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const columns: ColumnDef<Keyword>[] = [
  {
    accessorKey: 'phrase',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3"
      >
        Phrase
      </Button>
    ),
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs font-medium text-foreground">
        {row.getValue('phrase') as string}
      </span>
    ),
  },

  {
    accessorKey: 'intents',
    header: 'Intent',
    cell: ({ row }) => (
      <IntentBadge intents={row.getValue('intents') as Keyword['intents']} />
    ),
  },
  {
    accessorKey: 'volume',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3"
      >
        Volume
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right text-xs tabular-nums">
        {row.getValue('volume') as number}
      </div>
    ),
    meta: { align: 'right' },
  },
  {
    accessorKey: 'difficulty',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3"
      >
        Difficulty
      </Button>
    ),
    cell: ({ row }) => (
      <DifficultyCell value={row.getValue('difficulty') as number} />
    ),
    meta: { align: 'right' },
  },
  {
    accessorKey: 'competition',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3"
      >
        Competition
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right text-xs tabular-nums">
        {row.getValue('competition') as number}
      </div>
    ),
    meta: { align: 'right' },
  },
  {
    id: 'historyTrend',
    header: 'History',
    cell: ({ row }) => (
      <HistoryChart data={(row.original as Keyword).historyTrend} />
    ),
    enableSorting: false,
  },
];
