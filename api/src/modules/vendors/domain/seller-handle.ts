const MAX_LENGTH = 40;

export const HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Acme & Sons!" -> "acme-sons". Falls back to "store" when nothing usable is left. */
export function slugifyHandle(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, "");
  return slug || "store";
}
