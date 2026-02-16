import * as React from 'react';

import { cn } from '@/utils/cn';

interface Marker {
  lat: number;
  lng: number;
  size?: number;
}

export interface DottedMapProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  mapSamples?: number;
  markers?: Marker[];
  dotColor?: string;
  markerColor?: string;
  dotRadius?: number;
  stagger?: boolean;
}

export function DottedMap({
  width = 150,
  height = 75,
  mapSamples = 5000,
  markers = [],
  markerColor = '#FF6900',
  dotRadius = 0.2,
  stagger = true,
  className,
  style,
}: DottedMapProps) {
  const columns = Math.max(
    12,
    Math.round(Math.sqrt((mapSamples * width) / height)),
  );
  const rows = Math.max(6, Math.round(columns * (height / width)));

  const xStep = width / (columns + 1);
  const yStep = height / (rows + 1);

  const points = React.useMemo(() => {
    const generated: Array<{ x: number; y: number }> = [];
    for (let row = 1; row <= rows; row += 1) {
      for (let col = 1; col <= columns; col += 1) {
        generated.push({ x: col * xStep, y: row * yStep });
      }
    }
    return generated;
  }, [columns, rows, xStep, yStep]);

  const processedMarkers = React.useMemo(() => {
    return markers.map((marker) => {
      const x = ((marker.lng + 180) / 360) * width;
      const y = ((90 - marker.lat) / 180) * height;
      return { x, y, size: marker.size };
    });
  }, [markers, width, height]);

  // Compute stagger helpers in a single, simple pass
  const { staggerStep, yToRowIndex } = React.useMemo(() => {
    const sorted = [...points].sort((a, b) => a.y - b.y || a.x - b.x);
    const rowMap = new Map<number, number>();
    let step = 0;
    let prevY = Number.NaN;
    let prevXInRow = Number.NaN;

    for (const p of sorted) {
      if (p.y !== prevY) {
        // new row
        prevY = p.y;
        prevXInRow = Number.NaN;
        if (!rowMap.has(p.y)) rowMap.set(p.y, rowMap.size);
      }
      if (!Number.isNaN(prevXInRow)) {
        const delta = p.x - prevXInRow;
        if (delta > 0) step = step === 0 ? delta : Math.min(step, delta);
      }
      prevXInRow = p.x;
    }

    return { staggerStep: step || 1, yToRowIndex: rowMap };
  }, [points]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('text-gray-500 dark:text-gray-500', className)}
      style={{ width: '100%', height: '100%', ...style }}
    >
      {points.map((point, index) => {
        const rowIndex = yToRowIndex.get(point.y) ?? 0;
        const offsetX = stagger && rowIndex % 2 === 1 ? staggerStep / 2 : 0;
        return (
          <circle
            cx={point.x + offsetX}
            cy={point.y}
            r={dotRadius}
            fill="currentColor"
            key={`${point.x}-${point.y}-${index}`}
          />
        );
      })}
      {processedMarkers.map((marker, index) => {
        const rowIndex = yToRowIndex.get(marker.y) ?? 0;
        const offsetX = stagger && rowIndex % 2 === 1 ? staggerStep / 2 : 0;
        return (
          <circle
            cx={marker.x + offsetX}
            cy={marker.y}
            r={marker.size ?? dotRadius}
            fill={markerColor}
            key={`${marker.x}-${marker.y}-${index}`}
          />
        );
      })}
    </svg>
  );
}
