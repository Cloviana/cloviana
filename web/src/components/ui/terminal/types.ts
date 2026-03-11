import { ReactNode } from 'react';

export type TerminalRootProps = {
  className?: string;
  delay?: number;
  speed?: number;
  onComplete?: () => void;
  children?: ReactNode;
};

export type TerminalLoopProps = {
  delay?: number;
  children?: ReactNode;
};

export type TerminalAnimationProps = {
  delay?: number;
  className?: string;
  children?: ReactNode;
};

export type TerminalLoadingProps = Omit<TerminalAnimationProps, 'children'> & {
  loadingMessage: ReactNode;
  completeMessage: ReactNode;
  duration?: number;
};
