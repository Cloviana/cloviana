/**
 * What a run is allowed to do in a theme.
 * - CHAT answers questions about the theme and cannot change it.
 * - PLAN explores and proposes changes without making them.
 * - BUILD edits the theme.
 */
export const AGENT_MODES = ["CHAT", "PLAN", "BUILD"] as const;
export type AgentMode = (typeof AGENT_MODES)[number];

export const DEFAULT_AGENT_MODE: AgentMode = "BUILD";

/** Chat and plan runs must leave the theme exactly as they found it. */
export const isReadOnlyMode = (mode: AgentMode) => mode !== "BUILD";
