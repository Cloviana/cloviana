'use client';

import { History, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ChatSummary } from '@/features/chat/api/get-chats';

type AskAiModalHeaderProps = {
  chats: ChatSummary[];
  activeChatTitle?: string;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
};

export function AskAiModalHeader({
  chats,
  activeChatTitle,
  onNewChat,
  onSelectChat,
}: AskAiModalHeaderProps) {
  return (
    <div className="bg-popover flex h-11 shrink-0 items-center justify-between px-3">
      <span className="truncate text-sm font-medium">
        {activeChatTitle ?? ''}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={onNewChat}>
          <Plus />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <History />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {chats.length === 0 && (
              <DropdownMenuItem disabled>No past chats</DropdownMenuItem>
            )}
            {chats.map((chat) => (
              <DropdownMenuItem
                key={chat.id}
                onSelect={() => onSelectChat(chat.id)}
              >
                {chat.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
