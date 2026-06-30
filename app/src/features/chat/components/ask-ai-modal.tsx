'use client';

import { useParams, usePathname } from 'next/navigation';
import { useState } from 'react';

import { AssistantModal } from '@/components/assistant-ui/assistant-modal';
import { useGetChats } from '@/features/chat/api/get-chats';
import { AskAiModalHeader } from '@/features/chat/components/ask-ai-modal-header';
import { ChatThread } from '@/features/chat/components/chat-thread';

const CHAT_ROUTE_PATTERN = /^\/b\/[^/]+\/chat(\/|$)/;

export function AskAiModal() {
  const pathname = usePathname();
  const { businessId } = useParams<{ businessId: string }>();
  // The chat the user explicitly switched to via history. Left undefined
  // while a new conversation is in progress so ChatThread keeps reusing the
  // same live runtime instead of remounting into history-fetch mode the
  // moment the in-flight chat gets a server-assigned id.
  const [selectedChatId, setSelectedChatId] = useState<string>();
  const [newChatId, setNewChatId] = useState<string>();
  // Bumped on "New chat" so ChatThread remounts even when selectedChatId was
  // already undefined (i.e. starting over mid-conversation).
  const [newChatNonce, setNewChatNonce] = useState(0);
  const { data: chats = [] } = useGetChats(businessId);

  if (CHAT_ROUTE_PATTERN.test(pathname)) return null;

  const displayedChatId = selectedChatId ?? newChatId;
  const activeChatTitle = chats.find(
    (chat) => chat.id === displayedChatId,
  )?.title;

  const handleNewChat = () => {
    setSelectedChatId(undefined);
    setNewChatId(undefined);
    setNewChatNonce((nonce) => nonce + 1);
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setNewChatId(undefined);
  };

  return (
    <AssistantModal
      header={
        <AskAiModalHeader
          chats={chats}
          activeChatTitle={activeChatTitle}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
        />
      }
    >
      <ChatThread
        key={selectedChatId ?? `new-${newChatNonce}`}
        businessId={businessId}
        chatId={selectedChatId}
        navigateOnNewChat={false}
        onChatCreated={setNewChatId}
      />
    </AssistantModal>
  );
}
