type HeaderLike = {
  get?: (name: string) => string | null | undefined;
};

function getHeaderValue(headers: unknown, name: string): string | undefined {
  if (!headers) return undefined;

  if (typeof (headers as HeaderLike).get === "function") {
    return (headers as HeaderLike).get?.(name) ?? undefined;
  }

  if (typeof headers === "object") {
    const record = headers as Record<string, unknown>;
    const direct = record[name];
    if (typeof direct === "string") return direct;

    const lowerName = name.toLowerCase();
    const match = Object.entries(record).find(
      ([key]) => key.toLowerCase() === lowerName,
    );
    if (typeof match?.[1] === "string") return match[1];
  }

  return undefined;
}

function getErrorHeader(error: unknown, name: string): string | undefined {
  const err = error as {
    headers?: unknown;
    response?: { headers?: unknown };
  };

  return (
    getHeaderValue(err.headers, name) ??
    getHeaderValue(err.response?.headers, name)
  );
}

const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
};

function parseDurationMs(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  // A bare number is seconds (standard Retry-After).
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed) * 1000;

  // Compound provider durations like "1m12s", "7.66s", or "250ms".
  const segments = trimmed.match(/\d+(?:\.\d+)?(?:ms|s|m|h)/g);
  if (!segments || segments.join("") !== trimmed) return null;

  let total = 0;
  for (const segment of segments) {
    const match = segment.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)$/);
    if (!match) return null;
    total += Number(match[1]) * UNIT_MS[match[2]];
  }
  return total;
}

function parseRetryAfterMs(value: string): number | null {
  const duration = parseDurationMs(value);
  if (duration !== null) return duration;

  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());

  return null;
}

export function providerRetryDelayMs(
  error: unknown,
  headerNames: string[],
): number | null {
  for (const headerName of headerNames) {
    const value = getErrorHeader(error, headerName);
    if (!value) continue;

    const delay = parseRetryAfterMs(value);
    if (delay !== null) return delay;
  }

  return null;
}
