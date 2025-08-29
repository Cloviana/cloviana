export async function resolveFavicon(domain: string): Promise<string> {
  const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  try {
    const response = await fetch(googleFavicon);
    if (response.ok) {
      return googleFavicon;
    }
  } catch {
    // ignore fetch errors
  }
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}
