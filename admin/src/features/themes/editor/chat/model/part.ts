import * as z from 'zod';

/**
 * What the assistant did during a run, as an ordered list of parts. The API is the source of
 * truth (`api/src/modules/agents/domain/transcript.ts`): change both together. Everything that
 * arrives from the stream or a saved message is parsed with these schemas before it is rendered.
 */

const toolStatus = z.enum(['pending', 'running', 'completed', 'error']);
const todoStatus = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

const fileDiff = z.object({
  path: z.string(),
  additions: z.number(),
  deletions: z.number(),
  patch: z.string(),
});

export const partSchema = z.discriminatedUnion('type', [
  z.object({ id: z.string(), type: z.literal('text'), text: z.string() }),
  z.object({
    id: z.string(),
    type: z.literal('reasoning'),
    text: z.string(),
    startedAt: z.number(),
    endedAt: z.number().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('tool'),
    tool: z.string(),
    status: toolStatus,
    title: z.string().optional(),
    input: z.string().optional(),
    output: z.string().optional(),
    diff: fileDiff.optional(),
    startedAt: z.number().optional(),
    endedAt: z.number().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('todos'),
    items: z.array(z.object({ content: z.string(), status: todoStatus })),
  }),
  z.object({
    id: z.string(),
    type: z.literal('notice'),
    level: z.enum(['info', 'warning', 'error']),
    text: z.string(),
  }),
]);

export type Part = z.infer<typeof partSchema>;
export type TextPart = Extract<Part, { type: 'text' }>;
export type ReasoningPart = Extract<Part, { type: 'reasoning' }>;
export type ToolPart = Extract<Part, { type: 'tool' }>;
export type TodosPart = Extract<Part, { type: 'todos' }>;
export type NoticePart = Extract<Part, { type: 'notice' }>;
export type ToolStatus = z.infer<typeof toolStatus>;
export type FileDiff = z.infer<typeof fileDiff>;

export const PART_UPSERT_EVENT = 'part.upsert';
export const PART_DELTA_EVENT = 'part.delta';

export type PartEvent =
  | { type: typeof PART_UPSERT_EVENT; part: Part }
  | { type: typeof PART_DELTA_EVENT; id: string; text: string };

const upsertPayload = z.object({ part: partSchema });
const deltaPayload = z.object({ id: z.string(), text: z.string() });

/** Turns a stream event into a typed one, or null for anything else or anything malformed. */
export function parsePartEvent(name: string, data: string): PartEvent | null {
  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch {
    return null;
  }
  if (name === PART_UPSERT_EVENT) {
    const parsed = upsertPayload.safeParse(json);
    return parsed.success
      ? { type: PART_UPSERT_EVENT, part: parsed.data.part }
      : null;
  }
  if (name === PART_DELTA_EVENT) {
    const parsed = deltaPayload.safeParse(json);
    return parsed.success ? { type: PART_DELTA_EVENT, ...parsed.data } : null;
  }
  return null;
}

/** Parts of a saved assistant message. Older messages have only `text`, which becomes one part. */
export function partsOfMessage(content: unknown): Part[] {
  if (typeof content !== 'object' || content === null) return [];
  const { parts, text } = content as { parts?: unknown; text?: unknown };
  if (Array.isArray(parts)) {
    return parts.flatMap((part) => {
      const parsed = partSchema.safeParse(part);
      return parsed.success ? [parsed.data] : [];
    });
  }
  return typeof text === 'string' && text
    ? [{ id: 'text', type: 'text', text }]
    : [];
}
