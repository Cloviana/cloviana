'use client';

import { ChevronDown, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { Conversation } from '../../types';

const titleOf = (conversation: Conversation) =>
  conversation.title || 'Untitled';

/** Switch between this theme's conversations, or start a new one. */
export function ConversationPicker({
  conversations,
  currentId,
  disabled,
  onSelect,
  onNew,
}: {
  conversations: readonly Conversation[];
  currentId: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const current = conversations.find((c) => c.id === currentId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="xs"
          variant="ghost"
          disabled={disabled}
          className="max-w-48 min-w-0 gap-1"
          aria-label="Conversations"
        >
          <span className="truncate">
            {current ? titleOf(current) : 'New conversation'}
          </span>
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-80 w-64 overflow-y-auto"
      >
        <DropdownMenuItem onSelect={onNew}>
          <Plus />
          New conversation
        </DropdownMenuItem>
        {conversations.length > 0 && <DropdownMenuSeparator />}
        {conversations.length > 0 && (
          <DropdownMenuLabel>Earlier</DropdownMenuLabel>
        )}
        {conversations.map((conversation) => (
          <DropdownMenuItem
            key={conversation.id}
            onSelect={() => onSelect(conversation.id)}
          >
            <span className="truncate">{titleOf(conversation)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
