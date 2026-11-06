import type { Part, ToolPart } from './part';

/** Quiet lookup tools that read better as one line than as a long list of identical ones. */
const GROUPED_LABEL: Record<string, (count: number) => string> = {
  read: (n) => `Read ${n} files`,
  grep: (n) => `Searched ${n} times`,
  glob: (n) => `Looked up files ${n} times`,
  list: (n) => `Listed ${n} folders`,
};

export type Block =
  | { kind: 'part'; part: Part }
  | { kind: 'group'; id: string; label: string; parts: ToolPart[] };

const isGroupable = (part: Part): part is ToolPart =>
  part.type === 'tool' &&
  part.status === 'completed' &&
  part.tool in GROUPED_LABEL;

/**
 * Orders a run's parts for display. Consecutive finished lookups of one kind collapse into a
 * single line; anything running, failed or different stays on its own so progress stays visible.
 */
export function groupParts(parts: readonly Part[]): Block[] {
  const blocks: Block[] = [];
  let run: ToolPart[] = [];

  const flush = () => {
    if (run.length > 1) {
      blocks.push({
        kind: 'group',
        id: run[0].id,
        label: GROUPED_LABEL[run[0].tool](run.length),
        parts: run,
      });
    } else {
      blocks.push(...run.map((part): Block => ({ kind: 'part', part })));
    }
    run = [];
  };

  for (const part of parts) {
    if (isGroupable(part) && (!run.length || run[0].tool === part.tool)) {
      run.push(part);
      continue;
    }
    flush();
    if (isGroupable(part)) {
      run.push(part);
    } else {
      blocks.push({ kind: 'part', part });
    }
  }
  flush();
  return blocks;
}
