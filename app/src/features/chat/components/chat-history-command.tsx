'use client';

import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { CheckIcon, History } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { paths } from '@/config/paths';
import { getChatMessagesQueryOptions } from '@/features/chat/api/get-chat-messages';
import { useGetChats } from '@/features/chat/api/get-chats';

const HOVER_PREFETCH_DELAY_MS = 150;

type ChatHistoryCommandProps = {
  businessId: string;
};

export function ChatHistoryCommand({ businessId }: ChatHistoryCommandProps) {
  const [open, setOpen] = useState(false);
  const { chatId: activeChatId } = useParams<{ chatId?: string }>();
  const { data: chats = [] } = useGetChats(businessId);
  const queryClient = useQueryClient();

  const prefetchChat = useMemo(
    () =>
      debounce(
        (chatId: string) =>
          queryClient.prefetchQuery(
            getChatMessagesQueryOptions(businessId, chatId),
          ),
        HOVER_PREFETCH_DELAY_MS,
      ),
    [businessId, queryClient],
  );

  useEffect(() => prefetchChat.cancel, [prefetchChat]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Meta+K Control+K"
      >
        <History className="size-4" />
        Chat history
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Chat history"
        description="Search and switch between past chats"
      >
        <CommandInput placeholder="Search chats..." />
        <CommandList>
          <CommandEmpty>No chats found.</CommandEmpty>
          <CommandGroup>
            {chats.map((chat) => (
              <CommandItem
                key={chat.id}
                value={chat.id}
                keywords={[chat.title]}
                onSelect={() => setOpen(false)}
                asChild
              >
                <Link
                  href={paths.business.chat.detail.getHref(businessId, chat.id)}
                  onMouseEnter={() => prefetchChat(chat.id)}
                  onMouseLeave={prefetchChat.cancel}
                  onFocus={() => prefetchChat(chat.id)}
                  onBlur={prefetchChat.cancel}
                >
                  <span className="truncate">{chat.title}</span>
                  {chat.id === activeChatId && (
                    <CheckIcon className="ml-auto size-4 shrink-0" />
                  )}
                </Link>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
