'use client';

import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useExternalStoreRuntime,
  type ThreadMessageLike,
} from '@assistant-ui/react';
import { ArrowUp, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/typography';

import type { useAgentThread } from '../../hooks/use-agent-thread';

import { CodingStep } from './coding-step';
import { MarkdownText } from './markdown-text';

const identity = (message: ThreadMessageLike) => message;

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end">
      <div className="bg-background-neutral text-body text-text-default max-w-[85%] rounded-lg px-3 py-2 break-words whitespace-pre-wrap">
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex flex-col gap-2">
      <MessagePrimitive.Parts
        components={{ Text: MarkdownText, tools: { Override: CodingStep } }}
      />
    </MessagePrimitive.Root>
  );
}

export function AgentChat({
  thread,
}: {
  thread: ReturnType<typeof useAgentThread>;
}) {
  const runtime = useExternalStoreRuntime<ThreadMessageLike>({
    messages: thread.messages,
    isRunning: thread.isRunning,
    onNew: thread.onNew,
    onCancel: thread.onCancel,
    convertMessage: identity,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root className="flex h-full min-h-0 flex-col">
        <ThreadPrimitive.Viewport className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {!thread.isLoading && thread.messages.length === 0 && (
            <div className="m-auto max-w-64 text-center">
              <Heading as="h2" variant="compact">
                What should we change?
              </Heading>
              <p className="text-body text-text-subtle mt-1">
                Describe the storefront you want and the agent will edit this
                theme.
              </p>
            </div>
          )}
          <ThreadPrimitive.Messages>
            {({ message }) =>
              message.role === 'user' ? <UserMessage /> : <AssistantMessage />
            }
          </ThreadPrimitive.Messages>
        </ThreadPrimitive.Viewport>

        {thread.status && (
          <p className="text-body-small text-text-subtle px-4 pb-2">
            {thread.status}
          </p>
        )}

        {thread.error && (
          <p
            role="alert"
            className="text-body-small text-text-danger px-4 pb-2"
          >
            {thread.error}
          </p>
        )}

        <div className="p-3 pt-0">
          <ComposerPrimitive.Root className="border-line bg-surface focus-within:border-border-focused border-border-input rounded-lg">
            <ComposerPrimitive.Input
              rows={2}
              placeholder="Ask the agent to change your theme"
              className="text-body text-text-default placeholder:text-text-subtlest block max-h-40 w-full resize-none bg-transparent px-3 pt-2 outline-none"
            />
            <div className="flex justify-end p-2">
              {thread.isRunning ? (
                <ComposerPrimitive.Cancel
                  render={
                    <Button
                      size="icon-xs"
                      variant="secondary"
                      aria-label="Stop the agent"
                    />
                  }
                >
                  <Square />
                </ComposerPrimitive.Cancel>
              ) : (
                <ComposerPrimitive.Send
                  render={<Button size="icon-xs" aria-label="Send" />}
                >
                  <ArrowUp />
                </ComposerPrimitive.Send>
              )}
            </div>
          </ComposerPrimitive.Root>
        </div>
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
}
