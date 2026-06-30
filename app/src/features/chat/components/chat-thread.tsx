'use client';

import {
  AssistantRuntimeProvider,
  type AttachmentAdapter,
  type ChatModelAdapter,
  type ChatModelRunResult,
  type CompleteAttachment,
  CompositeAttachmentAdapter,
  type PendingAttachment,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  useLocalRuntime,
} from '@assistant-ui/react';
import { useMemo } from 'react';

import { Thread } from '@/components/assistant-ui/thread';

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

class SimpleDocumentAttachmentAdapter implements AttachmentAdapter {
  accept =
    'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  async add(state: { file: File }) {
    return {
      id: state.file.name,
      type: 'document' as const,
      name: state.file.name,
      contentType: state.file.type,
      file: state.file,
      status: {
        type: 'requires-action' as const,
        reason: 'composer-send' as const,
      },
    };
  }

  async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
    const file = attachment.file as File;
    const data = await readFileAsDataURL(file);

    return {
      ...attachment,
      status: { type: 'complete' as const },
      content: [
        {
          type: 'file' as const,
          data,
          mimeType: file.type,
          filename: file.name,
        },
      ],
    };
  }

  async remove() {}
}

const attachmentAdapter = new CompositeAttachmentAdapter([
  new SimpleImageAttachmentAdapter(),
  new SimpleTextAttachmentAdapter(),
  new SimpleDocumentAttachmentAdapter(),
]);

type ChatThreadProps = {
  chatId?: string;
};

export function ChatThread({ chatId }: ChatThreadProps) {
  const adapter = useMemo<ChatModelAdapter>(
    () => ({
      async run({ messages, abortSignal }) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chatId, messages }),
          signal: abortSignal,
        });

        if (!response.ok) {
          throw new Error('Unable to get mock chat response.');
        }

        return (await response.json()) as ChatModelRunResult;
      },
    }),
    [chatId],
  );
  const runtime = useLocalRuntime(adapter, {
    adapters: { attachments: attachmentAdapter },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
}
