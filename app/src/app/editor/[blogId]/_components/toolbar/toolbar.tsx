'use client';

import { FC, ReactNode } from 'react';

import {
  BlockTypeDropdown,
  BoldButton,
  ItalicButton,
  RedoButton,
  UnderlineButton,
  UndoButton,
} from './components';

export const ToolbarSection: FC<{ children?: ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 px-1.5">{children}</div>
);

export const ToolbarRoot: FC<{ children?: ReactNode }> = ({ children }) => (
  <div className="sticky inset-x-0 top-0 z-10 flex h-11 items-stretch justify-between bg-white/30 py-1.5 backdrop-blur-xs">
    {children}
  </div>
);

export const Toolbar = () => {
  return (
    <ToolbarRoot>
      <ToolbarSection>
        <BoldButton />
        <ItalicButton />
        <UnderlineButton />
        <BlockTypeDropdown />
      </ToolbarSection>
      <ToolbarSection>
        <UndoButton />
        <RedoButton />
      </ToolbarSection>
    </ToolbarRoot>
  );
};
