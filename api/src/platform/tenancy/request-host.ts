import type { IncomingHttpHeaders } from "node:http";

type HeaderSource = IncomingHttpHeaders | Headers;

function header(source: HeaderSource, name: string): string | undefined {
  if (source instanceof Headers) {
    return source.get(name) ?? undefined;
  }
  const value = source[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The public host a client used, including any port. Behind the app's rewrite the API sees the
 * app's own host, so x-forwarded-host (set by the proxy) wins over host.
 */
export function requestHost(source: HeaderSource): string | undefined {
  const forwarded = header(source, "x-forwarded-host")?.split(",")[0]?.trim();
  return forwarded || header(source, "host") || undefined;
}

/** Lowercase host without port or trailing dot. */
export function hostnameOf(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}
