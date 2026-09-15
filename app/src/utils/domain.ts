/**
 * Display form of a stored domain: hostname only, no "www.". The native URL
 * parser handles the scheme, path, port, case and IDN cases; subdomains are
 * kept on purpose, since "docs.acme.com" and "acme.com" are different sources.
 */
export function normalizeDomain(domain: string): string {
  try {
    const { hostname } = new URL(
      domain.includes('://') ? domain : `https://${domain}`,
    );

    return hostname.replace(/^www\./, '');
  } catch {
    return domain;
  }
}

/**
 * Favicon for a domain, via Google's public service. Every favicon in the app
 * goes through here so the day that endpoint changes is a one-line day.
 */
export function getFaviconUrl(domain: string, size: 32 | 64 = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    domain,
  )}&sz=${size}`;
}
