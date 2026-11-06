// Edge-safe: used by proxy.ts, so no Node APIs.

/**
 * Hosts that serve the Cloviana dashboard (platform-auth owners and staff).
 * Every other host is a marketplace: <slug>.<platform domain> or a custom domain.
 */
function platformHostnames(): Set<string> {
  const hostnames = new Set(['localhost', '127.0.0.1']);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    hostnames.add(new URL(appUrl).hostname.toLowerCase());
  }

  for (const extra of process.env.NEXT_PUBLIC_PLATFORM_HOSTS?.split(',') ??
    []) {
    const hostname = extra.trim().toLowerCase();
    if (hostname) hostnames.add(hostname);
  }

  return hostnames;
}

const hostnames = platformHostnames();

export function hostnameOf(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, '');
}

export function isPlatformHost(host: string | null): boolean {
  return !host || hostnames.has(hostnameOf(host));
}
