'use client';
import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export type ChartItem = {
  name: string;
  domain: string;
  visibility: number;
  isSelf: boolean;
};

const colors = [
  '#046cdc', // Blue
  '#f38834', // Orange
  '#f5c60a', // Yellow
  '#88bf3f', // Green
  '#788186', // Gray
  '#047cc4', // Light Blue
  '#10b981', // Emerald
];

const CustomTick = (props: any) => {
  const { x, y, payload } = props;
  if (!payload || !payload.value) return null;
  const logoUrl =
    payload.value === 'cloviana.com'
      ? '/logo-icon.png'
      : `https://img.logo.dev/${payload.value}?format=png&token=pk_AVQ085F0QcOVwbX7HOMcUA`;
  return (
    <g transform={`translate(${x - 8}, ${y + 4})`}>
      <clipPath id={`clip-${payload.value}`}>
        <rect width="16" height="16" rx="4" ry="4" />
      </clipPath>
      <image
        href={logoUrl}
        width="16"
        height="16"
        clipPath={`url(#clip-${payload.value})`}
        // eslint-disable-next-line react/no-unknown-property
        onError={(e) => {
          // Fallback if image fails to load
          e.currentTarget.setAttribute(
            'href',
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23cbd5e1" rx="4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="8" fill="%23475569">G</text></svg>',
          );
        }}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="peec-border-stroke-primary peec-bg-white text-body-s rounded-lg border p-2 shadow-md">
        <p className="peec-text-primary font-semibold">{data.name}</p>
        <p className="peec-text-secondary">
          Visibility:{' '}
          <span className="peec-text-primary font-semibold">
            {data.visibility}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export function RechartsChart({
  data,
  type = 'bar',
}: {
  data: ChartItem[];
  type?: 'bar' | 'line';
}) {
  const chartData = data.map((item, index) => {
    let fill = colors[index % colors.length];
    if (item.isSelf) {
      fill = '#d946ef'; // Magenta for our brand
    }
    return {
      name: item.name,
      logo: item.domain || item.name.toLowerCase() + '.com',
      visibility: Math.round(item.visibility),
      fill,
    };
  });

  return (
    <div className="aspect-auto h-full min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={210}>
        {type === 'line' ? (
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--peec-stroke-secondary)"
              vertical={false}
            />
            <XAxis
              dataKey="logo"
              tick={<CustomTick />}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              domain={[0, 99]}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              ticks={[0, 25, 50, 99]}
              style={{ fontSize: '12px', fill: 'var(--peec-fg-tertiary)' }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'var(--peec-bg-secondary)', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="visibility"
              stroke="#046cdc"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        ) : (
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--peec-stroke-secondary)"
              vertical={false}
            />
            <XAxis
              dataKey="logo"
              tick={<CustomTick />}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              domain={[0, 99]}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              ticks={[0, 25, 50, 99]}
              style={{ fontSize: '12px', fill: 'var(--peec-fg-tertiary)' }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'var(--peec-bg-secondary)' }}
            />
            <Bar dataKey="visibility" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
