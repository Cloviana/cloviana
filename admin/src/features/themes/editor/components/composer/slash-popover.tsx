'use client';

import { ComposerPrimitive } from '@assistant-ui/react';
import { useMemo } from 'react';

import {
  filterCommands,
  SLASH_COMMANDS,
  type SlashCommand,
  type SlashCommandId,
} from '../../chat/model/slash-commands';

import { PopoverLists, POPOVER_CLASS } from './popover-parts';

const COMMANDS = { id: 'commands', label: 'Commands' } as const;

const toItem = (command: SlashCommand) => ({
  id: command.id,
  type: 'command',
  label: command.label,
  description: command.description,
});

/** `/` in the message box: run something without leaving it. */
export function SlashPopover({
  onCommand,
}: {
  onCommand: (id: SlashCommandId) => void;
}) {
  const adapter = useMemo(
    () => ({
      categories: () => [COMMANDS],
      categoryItems: () => SLASH_COMMANDS.map(toItem),
      search: (query: string) => filterCommands(query).map(toItem),
    }),
    [],
  );

  return (
    <ComposerPrimitive.TriggerPopover
      char="/"
      adapter={adapter}
      className={POPOVER_CLASS}
    >
      <ComposerPrimitive.TriggerPopover.Action
        onExecute={(item) => onCommand(item.id as SlashCommandId)}
        removeOnExecute
      />
      <PopoverLists />
    </ComposerPrimitive.TriggerPopover>
  );
}
