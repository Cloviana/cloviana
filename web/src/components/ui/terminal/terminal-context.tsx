'use client';

import { createContext, useContext, useEffect, useRef } from 'react';

export type AnimationEntry = {
  delay: number;
  play: (speed: number, onComplete: () => void) => void;
  _timeout?: ReturnType<typeof setTimeout>;
};

export type SessionContextValue = {
  registerAnimation: (entry: AnimationEntry) => () => void;
  speed: number;
};

export type LoopContextValue = {
  onComplete: () => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
export const LoopContext = createContext<LoopContextValue | null>(null);

export function useAnimation({
  delay,
  play,
}: {
  delay: number;
  play: (speed: number, onComplete: () => void) => void;
}) {
  const ctx = useContext(SessionContext);
  const playRef = useRef(play);
  playRef.current = play;

  useEffect(() => {
    if (!ctx) return;
    const entry: AnimationEntry = {
      delay,
      play: (speed, onComplete) => playRef.current(speed, onComplete),
    };
    return ctx.registerAnimation(entry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, delay]);
}
