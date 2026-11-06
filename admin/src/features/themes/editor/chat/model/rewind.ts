import type { AgentMessage, Revision } from '../../types';

/** The revision a saved assistant message's run produced, if it produced one. */
export function revisionOfMessage(content: unknown): string | undefined {
  const id = (content as { revisionId?: unknown } | null)?.revisionId;
  return typeof id === 'string' ? id : undefined;
}

/**
 * For each message the user sent, the revision the theme was at just before the run it started:
 * where "restore code to here" goes back to. A message whose run saved nothing has no entry.
 */
export function rewindTargets(
  messages: readonly AgentMessage[],
  revisions: readonly Revision[],
): ReadonlyMap<string, string> {
  const parentOf = new Map(
    revisions.map((revision) => [revision.id, revision.parentRevisionId]),
  );
  const targets = new Map<string, string>();
  let pendingUser: string | undefined;

  for (const message of messages) {
    if (message.role === 'USER') {
      pendingUser = message.id;
    } else if (message.role === 'ASSISTANT' && pendingUser) {
      const saved = revisionOfMessage(message.content);
      const before = saved ? parentOf.get(saved) : undefined;
      if (before) targets.set(pendingUser, before);
      pendingUser = undefined;
    }
  }
  return targets;
}
