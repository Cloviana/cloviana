'use client';

import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  useExternalStoreRuntime,
  type ThreadMessageLike,
} from '@assistant-ui/react';
import { ArrowDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/typography';

import { ChatActionsProvider } from '../../chat/components/chat-actions-context';
import { ConversationPicker } from '../../chat/components/conversation-picker';
import { AssistantMessage, UserMessage } from '../../chat/components/messages';
import { DetailsProvider } from '../../chat/components/transcript/details-context';
import type { Chip } from '../../chat/model/run-context';
import { SUGGESTIONS } from '../../chat/model/suggestions';
import type { useAgentThread } from '../../hooks/use-agent-thread';
import type { SourceFile } from '../../types';
import { Composer } from '../composer/composer';

const identity = (message: ThreadMessageLike) => message;

export function AgentChat({
  thread,
  chips,
  onDismissChip,
  files,
  onMention,
  rewindTargets,
  onRewind,
}: {
  thread: ReturnType<typeof useAgentThread>;
  chips: readonly Chip[];
  onDismissChip: (chip: Chip) => void;
  files: readonly SourceFile[];
  onMention: (path: string) => void;
  /** Per message the user sent: the revision to go back to. */
  rewindTargets: ReadonlyMap<string, string>;
  onRewind: (revisionId: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const runtime = useExternalStoreRuntime<ThreadMessageLike>({
    messages: thread.messages,
    isRunning: thread.isRunning,
    onNew: thread.onNew,
    onCancel: thread.onCancel,
    onReload: async () => thread.retry(),
    convertMessage: identity,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatActionsProvider
        value={{
          approvePlan: thread.approvePlan,
          rewindTargetOf: (id) => rewindTargets.get(id),
          rewind: (id) => {
            const target = rewindTargets.get(id);
            if (target) onRewind(target);
          },
        }}
      >
        <DetailsProvider value={showDetails}>
          <ThreadPrimitive.Root className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between gap-2 px-3 pt-2">
              <ConversationPicker
                conversations={thread.conversations}
                currentId={thread.conversationId}
                disabled={thread.isRunning}
                onSelect={thread.selectConversation}
                onNew={thread.newConversation}
              />
              <Button
                size="xs"
                variant="ghost"
                aria-pressed={showDetails}
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </Button>
            </div>
            <ThreadPrimitive.Viewport className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
              {!thread.isLoading && thread.messages.length === 0 && (
                <div className="m-auto flex max-w-72 flex-col items-center gap-3 text-center">
                  <div>
                    <Heading as="h2" variant="compact">
                      What should we change?
                    </Heading>
                    <p className="text-body text-text-subtle mt-1">
                      Describe the storefront you want, or try one of these.
                    </p>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {SUGGESTIONS[thread.mode].map((suggestion) => (
                      <li key={suggestion}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-auto py-1.5 text-left whitespace-normal"
                          onClick={() => void thread.submit(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ThreadPrimitive.Messages>
                {({ message }) =>
                  message.role === 'user' ? (
                    <UserMessage />
                  ) : (
                    <AssistantMessage />
                  )
                }
              </ThreadPrimitive.Messages>
            </ThreadPrimitive.Viewport>
            <div className="relative">
              <ThreadPrimitive.ScrollToBottom
                render={
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label="Scroll to the latest message"
                    className="shadow-overlay absolute -top-12 left-1/2 -translate-x-1/2 disabled:hidden"
                  />
                }
              >
                <ArrowDown />
              </ThreadPrimitive.ScrollToBottom>
            </div>

            {thread.error && (
              <p
                role="alert"
                className="text-body-small text-text-danger px-4 pb-2"
              >
                {thread.error}
              </p>
            )}

            <Composer
              thread={thread}
              chips={chips}
              onDismissChip={onDismissChip}
              files={files}
              onMention={onMention}
            />
          </ThreadPrimitive.Root>
        </DetailsProvider>
      </ChatActionsProvider>
    </AssistantRuntimeProvider>
  );
}
