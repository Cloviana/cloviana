/**
 * What the user was looking at when they sent a message, as chips they can see and remove. The
 * API validates the same shape (`api/.../domain/run-context.ts`) and gives it to the agent as
 * data about the request.
 */

export interface Selection {
  path: string;
  startLine: number;
  endLine: number;
  text: string;
}

/** What the editor is showing right now. */
export interface ContextSources {
  /** The storefront route open in the preview. */
  page?: string;
  /** The file open in the code view. */
  file?: string;
  selection?: Selection;
}

/** What gets sent. Mirrors the API's `RunContext`. */
export interface RunContext {
  page?: string;
  file?: string;
  selection?: Selection;
  mentions?: string[];
}

export type ChipKind = 'page' | 'file' | 'selection' | 'mention';

export interface Chip {
  kind: ChipKind;
  /** Identifies the chip for removal: the value it stands for. */
  id: string;
  label: string;
  /** The full value, for a tooltip. */
  title: string;
}

/**
 * What the user has dismissed or added. A dismissal is tied to the value it hid, so moving to
 * another page or file brings that kind of chip back by itself.
 */
export interface ContextState {
  dismissed: Partial<Record<Exclude<ChipKind, 'mention'>, string>>;
  mentions: readonly string[];
}

export const EMPTY_CONTEXT: ContextState = { dismissed: {}, mentions: [] };

/** Matches the API's limits. */
export const MAX_SELECTION_TEXT = 4000;
export const MAX_MENTIONS = 8;

const basename = (path: string) => path.split('/').at(-1) ?? path;

const selectionId = (s: Selection) => `${s.path}:${s.startLine}-${s.endLine}`;

function visible(sources: ContextSources, state: ContextState) {
  return {
    page:
      sources.page && state.dismissed.page !== sources.page
        ? sources.page
        : undefined,
    file:
      sources.file && state.dismissed.file !== sources.file
        ? sources.file
        : undefined,
    selection:
      sources.selection &&
      state.dismissed.selection !== selectionId(sources.selection)
        ? sources.selection
        : undefined,
  };
}

export function chipsOf(sources: ContextSources, state: ContextState): Chip[] {
  const shown = visible(sources, state);
  const chips: Chip[] = [];
  if (shown.page) {
    chips.push({
      kind: 'page',
      id: shown.page,
      label: `Page ${shown.page}`,
      title: shown.page,
    });
  }
  if (shown.file) {
    chips.push({
      kind: 'file',
      id: shown.file,
      label: basename(shown.file),
      title: shown.file,
    });
  }
  if (shown.selection) {
    const { path, startLine, endLine } = shown.selection;
    const lines =
      startLine === endLine
        ? `line ${startLine}`
        : `lines ${startLine}–${endLine}`;
    chips.push({
      kind: 'selection',
      id: selectionId(shown.selection),
      label: `${basename(path)} ${lines}`,
      title: `${path}, ${lines}`,
    });
  }
  for (const path of state.mentions) {
    chips.push({
      kind: 'mention',
      id: path,
      label: basename(path),
      title: path,
    });
  }
  return chips;
}

/** The context to send with a message, or undefined when there is none. */
export function toRunContext(
  sources: ContextSources,
  state: ContextState,
): RunContext | undefined {
  const shown = visible(sources, state);
  const context: RunContext = {
    ...(shown.page ? { page: shown.page } : {}),
    ...(shown.file ? { file: shown.file } : {}),
    ...(shown.selection
      ? {
          selection: {
            ...shown.selection,
            text: shown.selection.text.slice(0, MAX_SELECTION_TEXT),
          },
        }
      : {}),
    ...(state.mentions.length ? { mentions: [...state.mentions] } : {}),
  };
  return Object.keys(context).length ? context : undefined;
}

export function dismissChip(
  state: ContextState,
  chip: Pick<Chip, 'kind' | 'id'>,
): ContextState {
  if (chip.kind === 'mention') {
    return {
      ...state,
      mentions: state.mentions.filter((path) => path !== chip.id),
    };
  }
  return { ...state, dismissed: { ...state.dismissed, [chip.kind]: chip.id } };
}

export function addMention(state: ContextState, path: string): ContextState {
  if (state.mentions.includes(path) || state.mentions.length >= MAX_MENTIONS) {
    return state;
  }
  return { ...state, mentions: [...state.mentions, path] };
}

/** After a message is sent, what was pointed at with `@` has done its job. */
export function afterSend(state: ContextState): ContextState {
  return { ...state, mentions: [] };
}
