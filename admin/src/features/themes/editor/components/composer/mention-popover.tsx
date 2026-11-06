'use client';

import { ComposerPrimitive } from '@assistant-ui/react';
import { useMemo } from 'react';

import { searchFiles } from '../../chat/model/file-search';
import type { SourceFile } from '../../types';

import { PopoverLists, POPOVER_CLASS } from './popover-parts';

const FILES = { id: 'files', label: 'Files' } as const;

/** `@` in the message box: pick a file to point the agent at. */
export function MentionPopover({
  files,
  onMention,
}: {
  files: readonly SourceFile[];
  onMention: (path: string) => void;
}) {
  const adapter = useMemo(() => {
    const toItem = (file: SourceFile) => ({
      id: file.path,
      type: 'file',
      label: file.path,
    });
    return {
      categories: () => [FILES],
      categoryItems: () => searchFiles(files, '').map(toItem),
      search: (query: string) => searchFiles(files, query).map(toItem),
    };
  }, [files]);

  return (
    <ComposerPrimitive.TriggerPopover
      char="@"
      adapter={adapter}
      className={POPOVER_CLASS}
    >
      <ComposerPrimitive.TriggerPopover.Action
        onExecute={(item) => onMention(item.id)}
        removeOnExecute
      />
      <PopoverLists />
    </ComposerPrimitive.TriggerPopover>
  );
}
