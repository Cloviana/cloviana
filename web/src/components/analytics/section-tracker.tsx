'use client';

import { useEffect, useRef } from 'react';

import { gaEvent } from '@/lib/ga/client';

interface SectionTrackerProps {
  section: string;
}

export function SectionTracker({ section }: SectionTrackerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          gaEvent('section_viewed', { section });
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [section]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    />
  );
}
