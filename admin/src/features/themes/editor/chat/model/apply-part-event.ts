import {
  PART_DELTA_EVENT,
  PART_UPSERT_EVENT,
  type Part,
  type PartEvent,
} from './part';

/** Applies one stream event to a run's parts. Pure: never mutates its input. */
export function applyPartEvent(
  parts: readonly Part[],
  event: PartEvent,
): readonly Part[] {
  if (event.type === PART_UPSERT_EVENT) {
    const at = parts.findIndex((part) => part.id === event.part.id);
    if (at === -1) return [...parts, event.part];
    return parts.map((part, index) => (index === at ? event.part : part));
  }

  if (event.type === PART_DELTA_EVENT) {
    return parts.map((part) =>
      part.id === event.id &&
      (part.type === 'text' || part.type === 'reasoning')
        ? { ...part, text: part.text + event.text }
        : part,
    );
  }

  return parts;
}
