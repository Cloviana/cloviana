/** The words a user typed, from a saved user message. */
export function userTextOf(content: unknown): string {
  const text = (content as { text?: unknown } | null)?.text;
  return typeof text === 'string' ? text : '';
}
