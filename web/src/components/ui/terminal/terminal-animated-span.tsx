'use client';

import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

import { useAnimation } from './terminal-context';

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export const TerminalAnimatedSpan: FC<Props> = ({
  children,
  delay = 0,
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState({
    opacity: 0,
    transform: 'translateY(-5px)',
  });
  const speedRef = useRef(1);
  const onCompleteRef = useRef<(() => void) | undefined>();

  const play = useCallback((speed: number, onComplete: () => void) => {
    speedRef.current = speed;
    onCompleteRef.current = onComplete;
    setVisible(true);
  }, []);

  useAnimation({ delay, play });

  useEffect(() => {
    if (!visible) return;

    const duration = 300 / speedRef.current;
    const start = performance.now();
    let frame: number;

    const update = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      setStyle({ opacity: t, transform: `translateY(${-5 * (1 - t)}px)` });

      if (t < 1) {
        frame = requestAnimationFrame(update);
      } else {
        onCompleteRef.current?.();
      }
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  if (!visible) return null;

  return (
    <span className={cn('block', className)} style={style}>
      {children}
    </span>
  );
};
