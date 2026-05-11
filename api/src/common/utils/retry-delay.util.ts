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

function parseDurationMs(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)(ms|s|m)?$/);

  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2] ?? "s";

  if (!Number.isFinite(amount)) return null;
  if (unit === "ms") return amount;
  if (unit === "s") return amount * 1000;
  if (unit === "m") return amount * 60_000;

  return null;
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
