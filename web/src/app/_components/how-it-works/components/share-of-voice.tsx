'use client';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

const DATA = [
  { week: 'Wk 1', you: 13, compA: 43, compB: 31 },
  { week: 'Wk 2', you: 19, compA: 42, compB: 29 },
  { week: 'Wk 3', you: 26, compA: 41, compB: 28 },
  { week: 'Wk 4', you: 33, compA: 40, compB: 27 },
  { week: 'Wk 5', you: 40, compA: 39, compB: 26 },
  { week: 'Wk 6', you: 47, compA: 38, compB: 26 },
  { week: 'Wk 7', you: 54, compA: 37, compB: 25 },
  { week: 'Wk 8', you: 60, compA: 36, compB: 24 },
];

const YOU_COLOR = '#1c1917';
const COMP_A_COLOR = '#b8a89a';
const COMP_B_COLOR = '#cec4bc';

type DotProps = {
  cx?: number;
  cy?: number;
  index?: number;
};

const makeEndLabel = (label: string, color: string) => {
  const EndLabel = ({ cx, cy, index }: DotProps) => {
    if (index !== DATA.length - 1 || cx === undefined || cy === undefined) {
      return <g />;
    }
    const isYou = label === 'You';
    return (
      <g>
        <circle cx={cx} cy={cy} r={isYou ? 4 : 3} fill={color} />
        <text
          x={cx + 10}
          y={cy}
          dy="0.35em"
          fill={color}
          fontSize={isYou ? 11 : 10}
          fontWeight={isYou ? 700 : 500}
          fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
          letterSpacing="0.01em"
        >
          {label}
        </text>
      </g>
    );
  };
  EndLabel.displayName = `EndLabel_${label}`;
  return EndLabel;
};

export const ShareOfVoice = () => (
  <div className="absolute inset-0 flex flex-col px-5 py-5 sm:px-7 sm:py-6">
    {/* Header */}
    <div className="mb-1 flex items-center justify-between">
      <span className="text-foreground-lighter text-[10px] font-semibold tracking-[0.1em] uppercase">
        AI Share of Mentions
      </span>
      <span className="text-foreground-lighter text-[10px]">
        8-week snapshot
      </span>
    </div>

    {/* Chart */}
    <div className="min-h-0 flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={DATA}
          margin={{ top: 12, right: 68, left: -28, bottom: 0 }}
        >
          <defs>
            <linearGradient id="sovYouFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={YOU_COLOR} stopOpacity={0.1} />
              <stop offset="100%" stopColor={YOU_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="rgba(0,0,0,0.06)"
            strokeDasharray="0"
          />

          <XAxis
            dataKey="week"
            tick={{
              fontSize: 10,
              fill: '#b8a89a',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />

          <YAxis hide domain={[0, 72]} />

          {/* Competitor B — render first (bottom layer) */}
          <Line
            type="monotone"
            dataKey="compB"
            stroke={COMP_B_COLOR}
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={makeEndLabel('Comp. B', COMP_B_COLOR)}
            activeDot={false}
            animationBegin={400}
            animationDuration={1400}
          />

          {/* Competitor A */}
          <Line
            type="monotone"
            dataKey="compA"
            stroke={COMP_A_COLOR}
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={makeEndLabel('Comp. A', COMP_A_COLOR)}
            activeDot={false}
            animationBegin={250}
            animationDuration={1400}
          />

          {/* You — area fill */}
          <Area
            type="monotone"
            dataKey="you"
            stroke="transparent"
            fill="url(#sovYouFill)"
            dot={false}
            activeDot={false}
            animationBegin={100}
            animationDuration={1800}
          />

          {/* You — line + end label (on top) */}
          <Line
            type="monotone"
            dataKey="you"
            stroke={YOU_COLOR}
            strokeWidth={2.5}
            dot={makeEndLabel('You', YOU_COLOR)}
            activeDot={false}
            animationBegin={100}
            animationDuration={1800}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>

    {/* Footer callout */}
    <div className="mt-2 flex items-center gap-1.5">
      <span className="bg-foreground/8 text-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold">
        ↑ +47 pts
      </span>
      <span className="text-foreground-lighter text-[10px]">
        average lift in AI recommendations after 8 weeks
      </span>
    </div>
  </div>
);
