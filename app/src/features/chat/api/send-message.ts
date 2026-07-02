import { env } from '@/config/env';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export type ChatMessagePart = {
  type?: string;
  text?: string;
};

export type ChatMessage = {
  role?: string;
  content?: readonly ChatMessagePart[];
};

export type SendMessageRequest = {
  chatId?: string;
  messages: readonly ChatMessage[];
};

export type SendMessageResponse = {
  chatId: string;
  title: string;
  content: { type: 'text'; text: string }[];
  actions?: string[];
};

export type ChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'action'; label: string }
  | { type: 'done'; response: SendMessageResponse };

function parseSseBlock(block: string): { event: string; data: unknown } | null {
  let event = 'message';
  const dataLines: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event: ')) event = line.slice(7).trim();
    else if (line.startsWith('data: ')) dataLines.push(line.slice(6));
  }
  if (dataLines.length === 0) return null;
  try {
    return { event, data: JSON.parse(dataLines.join('\n')) };
  } catch {
    return null;
  }
}

export async function* sendMessageStream(
  businessId: string,
  body: SendMessageRequest,
  signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  const response = await fetch(
    `${env.API_URL}/businesses/${businessId}/chat/stream`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal,
    },
  );
  if (!response.ok || !response.body) {
    throw new Error(`Chat request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let separator: number;
    while ((separator = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, separator);
      buffer = buffer.slice(separator + 2);
      const parsed = parseSseBlock(block);
      if (!parsed) continue;
      if (parsed.event === 'delta') {
        yield { type: 'delta', text: (parsed.data as ChatMessagePart).text ?? '' };
      } else if (parsed.event === 'action') {
        const { label } = parsed.data as { label?: string };
        yield { type: 'action', label: label ?? '' };
      } else if (parsed.event === 'done') {
        yield { type: 'done', response: parsed.data as SendMessageResponse };
        return;
      } else if (parsed.event === 'error') {
        const { detail } = parsed.data as { detail?: string };
        throw new Error(detail ?? 'Chat request failed');
      }
    }
  }
  throw new Error('Chat stream ended unexpectedly');
}
