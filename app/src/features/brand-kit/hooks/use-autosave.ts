'use client';

import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_AUTOSAVE_DELAY = 800;

export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<unknown>,
  delay = DEFAULT_AUTOSAVE_DELAY,
) {
  const saveRef = useRef(save);
  const valueRef = useRef(value);
  const previousValueRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingValueRef = useRef(false);
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  saveRef.current = save;
  valueRef.current = value;

  const flush = useCallback(() => {
    if (!hasPendingValueRef.current) return;

    hasPendingValueRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);

    const nextValue = valueRef.current;
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() => saveRef.current(nextValue))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (Object.is(previousValueRef.current, value)) return;

    previousValueRef.current = value;
    hasPendingValueRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [delay, flush, value]);

  return flush;
}
