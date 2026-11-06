/** Messages typed while the agent was still working, to be sent in order once it is free. */
export interface QueuedMessage {
  id: string;
  text: string;
}

export function enqueue(
  queue: readonly QueuedMessage[],
  text: string,
  id: string,
): readonly QueuedMessage[] {
  const trimmed = text.trim();
  return trimmed ? [...queue, { id, text: trimmed }] : queue;
}

export function removeQueued(
  queue: readonly QueuedMessage[],
  id: string,
): readonly QueuedMessage[] {
  return queue.filter((message) => message.id !== id);
}

/** The next message to send and what is left. */
export function dequeue(queue: readonly QueuedMessage[]): {
  next: QueuedMessage | undefined;
  rest: readonly QueuedMessage[];
} {
  return { next: queue[0], rest: queue.slice(1) };
}

/** Takes every queued message back into one draft, one per line, so it can be edited. */
export function takeBack(queue: readonly QueuedMessage[]): string {
  return queue.map((message) => message.text).join('\n');
}
