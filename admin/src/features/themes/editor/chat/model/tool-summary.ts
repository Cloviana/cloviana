import type { ToolPart } from './part';

const LABELS: Record<string, string> = {
  read: 'Read',
  edit: 'Update',
  write: 'Write',
  patch: 'Update',
  multiedit: 'Update',
  grep: 'Search',
  glob: 'Find files',
  list: 'List',
  bash: 'Run',
  task: 'Task',
  build: 'Build',
};

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

/** The verb a step is shown under, such as "Update" for an edit. */
export function toolLabel(tool: string) {
  return LABELS[tool] ?? tool.charAt(0).toUpperCase() + tool.slice(1);
}

/** What the step acted on: the file, pattern or command. */
export function toolSubject(part: ToolPart) {
  return part.title || part.input || '';
}

const lineCount = (output: string) =>
  output.split('\n').filter((line) => line.trim()).length;

/** The one line shown under a step once it has run. Empty while it is still running. */
export function toolSummary(part: ToolPart): string {
  if (part.status === 'pending' || part.status === 'running') return '';
  if (part.status === 'error') {
    return part.output?.split('\n')[0] || 'Failed';
  }
  if (part.diff) {
    const { additions, deletions } = part.diff;
    return `${plural(additions, 'addition')}, ${plural(deletions, 'removal')}`;
  }
  switch (part.tool) {
    case 'build':
      return 'Build passed';
    case 'grep':
    case 'glob':
    case 'list':
      return part.output
        ? plural(lineCount(part.output), 'result')
        : 'No results';
    case 'edit':
    case 'write':
    case 'patch':
    case 'multiedit':
      return 'Done';
    default:
      return part.output?.split('\n')[0] ?? 'Done';
  }
}
