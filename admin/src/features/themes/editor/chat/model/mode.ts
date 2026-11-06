import type { AgentMode } from '../../types';

export const DEFAULT_MODE: AgentMode = 'BUILD';

/** The three things the agent can be asked to do, in the order they are offered. */
export const MODES: ReadonlyArray<{
  value: AgentMode;
  label: string;
  hint: string;
}> = [
  {
    value: 'CHAT',
    label: 'Chat',
    hint: 'Ask about your theme. Nothing changes.',
  },
  {
    value: 'PLAN',
    label: 'Plan',
    hint: 'Explore and propose a plan. Nothing changes.',
  },
  { value: 'BUILD', label: 'Build', hint: 'Make the changes.' },
];

/** What "Build this plan" asks for. The plan itself is already in the conversation. */
export const APPROVE_PLAN_PROMPT =
  'Implement the plan above. Follow it, and tell me if you need to deviate.';

export const isAgentMode = (value: unknown): value is AgentMode =>
  MODES.some((mode) => mode.value === value);

/** The mode a saved assistant message was produced in, if it recorded one. */
export function modeOfMessage(content: unknown): AgentMode | undefined {
  const mode = (content as { mode?: unknown } | null)?.mode;
  return isAgentMode(mode) ? mode : undefined;
}
