import { useState, useEffect, useRef } from 'react';

export const useCardWidth = (minWidth = 300, gap = 12, minCols = 2) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState<number>(minWidth);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;

        let cols = Math.floor((containerWidth + gap) / (minWidth + gap));
        cols = Math.max(cols, minCols);

        const newWidth = (containerWidth - (cols - 1) * gap) / cols;
        setCardWidth(newWidth);
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [minWidth, gap, minCols]);

  return { containerRef, cardWidth };
};
