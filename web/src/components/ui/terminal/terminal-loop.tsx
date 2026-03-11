'use client';

import { FC, Fragment, ReactNode, useCallback, useState } from 'react';

import { LoopContext } from './terminal-context';

type Props = {
  children: ReactNode;
  delay?: number;
};

export const TerminalLoop: FC<Props> = ({ children, delay = 500 }) => {
  const [loopIndex, setLoopIndex] = useState(0);

  const onComplete = useCallback(() => {
    setTimeout(() => setLoopIndex((i) => i + 1), delay);
  }, [delay]);

  return (
    <LoopContext.Provider value={{ onComplete }}>
      <Fragment key={loopIndex}>{children}</Fragment>
    </LoopContext.Provider>
  );
};
