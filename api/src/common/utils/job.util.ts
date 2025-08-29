import { JobType } from "@prisma/client";

export function makeDedupeKey(type: JobType, scope: string | string[], date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  const s = Array.isArray(scope) ? scope.join(":") : scope;
  return `${type}:${s}:${day}`;
}
