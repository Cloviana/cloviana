'use client';

import { GIcon } from '@/components/deprecated/icons';

import { useUndoRedo } from '../hooks';

import CommandButton from './command-button';

export const UndoButton = () => {
  const { canUndo, undo } = useUndoRedo();
  return (
    <CommandButton onClick={undo} disabled={!canUndo}>
      <GIcon name="undo" />
    </CommandButton>
  );
};
