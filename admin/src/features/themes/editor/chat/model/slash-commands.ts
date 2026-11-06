export type SlashCommandId = 'undo' | 'redo' | 'new' | 'history';

export interface SlashCommand {
  id: SlashCommandId;
  label: string;
  description: string;
}

/** Things you can do from the message box without leaving it. */
export const SLASH_COMMANDS: readonly SlashCommand[] = [
  {
    id: 'undo',
    label: '/undo',
    description: 'Undo the last change to the theme',
  },
  { id: 'redo', label: '/redo', description: 'Redo the change you undid' },
  { id: 'new', label: '/new', description: 'Start a new conversation' },
  {
    id: 'history',
    label: '/history',
    description: "Show the theme's version history",
  },
];

/** A shorter query would match too much of every description to be useful. */
const DESCRIPTION_MATCH_MIN = 3;

export function filterCommands(query: string): SlashCommand[] {
  const text = query.trim().toLowerCase().replace(/^\//, '');
  return SLASH_COMMANDS.filter(
    (command) =>
      !text ||
      command.id.startsWith(text) ||
      (text.length >= DESCRIPTION_MATCH_MIN &&
        command.description.toLowerCase().includes(text)),
  );
}
