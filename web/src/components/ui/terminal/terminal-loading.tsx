'use client';

import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

import { useAnimation } from './terminal-context';

const FRAMES = ['◒', '◐', '◓', '◑'];

type Props = {
  delay?: number;
  loadingMessage: ReactNode;
  completeMessage: ReactNode;
  duration?: number;
  className?: string;
};

export const TerminalLoading: FC<Props> = ({
  delay = 0,
  loadingMessage,
  completeMessage,
  duration = 1000,
  className,
}) => {
  const [state, setState] = useState<'hidden' | 'loading' | 'complete'>(
    'hidden',
  );
  const [frameIndex, setFrameIndex] = useState(0);
  const speedRef = useRef(1);
  const onCompleteRef = useRef<(() => void) | undefined>(undefined);

  const play = useCallback((speed: number, onComplete: () => void) => {
    speedRef.current = speed;
    onCompleteRef.current = onComplete;
    setState('loading');
  }, []);

  useAnimation({ delay, play });

  useEffect(() => {
    if (state !== 'loading') return;

    const speed = speedRef.current;
    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % FRAMES.length);
    }, 75 / speed);

    const timeout = setTimeout(() => {
      setState('complete');
      onCompleteRef.current?.();
    }, duration / speed);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [state, duration]);

  if (state === 'hidden') return null;

  if (state === 'loading') {
    return (
      <span className={cn('block', className)}>
        <span className="text-cyan-400">{FRAMES[frameIndex]}</span>
        {loadingMessage}
      </span>
    );
  }

  return (
    <span className={cn('block', className)} data-completed>
      {completeMessage}
    </span>
  );
};
