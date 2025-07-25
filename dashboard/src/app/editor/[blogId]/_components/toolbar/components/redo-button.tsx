'use client';

import { GIcon } from '@/components/icons';

import { useUndoRedo } from '../hooks';

import CommandButton from './command-button';

export const RedoButton = () => {
  const { canRedo, redo } = useUndoRedo();
  return (
    <CommandButton onClick={redo} disabled={!canRedo}>
      <GIcon name="redo" />
    </CommandButton>
  );
};
