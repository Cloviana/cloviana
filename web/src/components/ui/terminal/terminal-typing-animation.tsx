'use client';

import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

import { useAnimation } from './terminal-context';

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export const TerminalTypingAnimation: FC<Props> = ({
  children,
  delay = 0,
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const animRef = useRef<{ speed: number; onComplete?: () => void }>({
    speed: 1,
  });

  const play = useCallback((speed: number, onComplete: () => void) => {
    animRef.current = { speed, onComplete };
    setVisible(true);
  }, []);

  useAnimation({ delay, play });

  useEffect(() => {
    if (!visible || !spanRef.current) return;

    const node = spanRef.current;
    const text = node.textContent ?? '';
    const speed = animRef.current.speed * 2;
    const duration = text.length / (speed * 0.01);
    const start = performance.now();
    let frame: number;

    const update = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      node.textContent = text.slice(0, Math.trunc(text.length * t));

      if (t < 1) {
        frame = requestAnimationFrame(update);
      } else {
        node.textContent = text;
        animRef.current.onComplete?.();
      }
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  if (!visible) return null;

  return (
    <span ref={spanRef} className={cn('block', className)}>
      {children}
    </span>
  );
};
