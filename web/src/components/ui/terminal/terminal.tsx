'use client';

import {
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

import { cn } from '@/utils/cn';

import { Window } from '../window';

import {
  AnimationEntry,
  LoopContext,
  SessionContext,
} from './terminal-context';

type TerminalProps = {
  delay?: number;
  speed?: number;
  onComplete?: () => void;
  children?: ReactNode;
  className?: string;
};

export const Terminal: FC<TerminalProps> = ({
  delay = 0,
  speed = 1,
  onComplete,
  children,
  className,
}) => {
  const loop = useContext(LoopContext);
  const animations = useRef<AnimationEntry[]>([]);
  const sessionTimeout = useRef<ReturnType<typeof setTimeout>>();

  const registerAnimation = useCallback((entry: AnimationEntry) => {
    animations.current.push(entry);
    return () => {
      animations.current = animations.current.filter((a) => a !== entry);
      clearTimeout(entry._timeout);
    };
  }, []);

  // Capture loop.onComplete in a ref so it's always fresh
  const loopRef = useRef(loop?.onComplete);
  useEffect(() => {
    loopRef.current = loop?.onComplete;
  }, [loop?.onComplete]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    sessionTimeout.current = setTimeout(() => {
      const sorted = [...animations.current].sort((a, b) => a.delay - b.delay);

      sorted.forEach((anim, i) => {
        anim._timeout = setTimeout(() => {
          const isLast = i === sorted.length - 1;
          anim.play(
            speed,
            isLast
              ? () => {
                  onCompleteRef.current?.();
                  loopRef.current?.();
                }
              : () => {},
          );
        }, anim.delay);
      });
    }, delay);

    return () => {
      clearTimeout(sessionTimeout.current);
      animations.current.forEach((a) => clearTimeout(a._timeout));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionContext.Provider value={{ registerAnimation, speed }}>
      <Window className={cn('font-mono text-sm font-light', className)}>
        {children}
      </Window>
    </SessionContext.Provider>
  );
};
