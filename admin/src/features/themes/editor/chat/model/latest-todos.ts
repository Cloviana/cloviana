import type { Part, TodosPart } from './part';

/** The agent's checklist as it stands, for showing beside the message box while it works. */
export function latestTodos(parts: readonly Part[]): TodosPart | undefined {
  return parts.findLast((part): part is TodosPart => part.type === 'todos');
}
