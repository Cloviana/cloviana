'use client';

import { TrendingUp } from 'lucide-react';
import { LabelList, PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BrandVisibility } from '@/features/audit/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type VisibilityChartProps = {
  brandVisibility: BrandVisibility;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const CHART_CONFIG = {
  value: { label: 'Visibility' },
  chatgpt: { label: 'ChatGPT', color: 'var(--chart-1)' },
  perplexity: { label: 'Perplexity', color: 'var(--chart-2)' },
  google_aio: { label: 'Google AIO', color: 'var(--chart-3)' },
} satisfies ChartConfig;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEngineLabel(v: unknown): string {
  return CHART_CONFIG[v as keyof typeof CHART_CONFIG]?.label ?? String(v);
}

function toChartData(bv: BrandVisibility) {
  return [
    { engine: 'chatgpt', value: bv.chatgpt, fill: 'var(--color-chatgpt)' },
    {
      engine: 'perplexity',
      value: bv.perplexity,
      fill: 'var(--color-perplexity)',
    },
    {
      engine: 'google_aio',
      value: bv.google_aio,
      fill: 'var(--color-google_aio)',
    },
  ];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const VisibilityChart = ({ brandVisibility }: VisibilityChartProps) => {
  const chartData = toChartData(brandVisibility);

  return (
    <div className="flex w-full max-w-[300px] flex-col items-center gap-4">
      {/* Chart */}
      <div className="aspect-square w-full">
        <ChartContainer config={CHART_CONFIG} className="h-full w-full">
          <RadialBarChart
            data={chartData}
            startAngle={-90}
            endAngle={270}
            innerRadius={40}
            outerRadius={130}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={(props: any) => (
                <ChartTooltipContent {...props} hideLabel nameKey="engine" />
              )}
            />
            {/* no animation: labels only mount once it finishes, which the PDF
                renderer would otherwise capture mid-flight */}
            <RadialBar
              dataKey="value"
              background={{ fill: 'hsl(0, 0%, 94%)' }}
              isAnimationActive={false}
            >
              <LabelList
                position="insideStart"
                dataKey="engine"
                className="fill-white capitalize mix-blend-luminosity"
                fontSize={11}
                formatter={formatEngineLabel}
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-1.5 text-center">
        <div className="flex items-center justify-center gap-2 text-sm leading-none font-medium">
          {brandVisibility.overall.toFixed(2)}% overall AI visibility
          <TrendingUp className="h-4 w-4" />
        </div>
        <p className="text-muted-foreground text-sm leading-none">
          Across ChatGPT, Perplexity and Google AIO
        </p>
      </div>
    </div>
  );
};
