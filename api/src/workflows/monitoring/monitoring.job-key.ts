// Date helpers plus the dedupe key used by ManagedJobsService to avoid
// scheduling two monitoring runs for the same business/date/prompt subset.
import { createHash } from "node:crypto";

const DEDUPE_PREFIX = "monitoring";

export function startOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildMonitoringJobDedupeKey(
  date: Date,
  promptIds?: string[],
): string {
  const input = promptIds?.length
    ? [...new Set(promptIds)].sort().join(",")
    : "all-active-prompts";

  const digest = createHash("sha256").update(input).digest("hex").slice(0, 16);

  return `${DEDUPE_PREFIX}:${formatDateKey(date)}:${digest}`;
}
