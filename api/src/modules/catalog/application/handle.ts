import { CatalogHandleConflictError } from "../domain/catalog.errors";

/** A URL-safe handle derived from a title, such as "Blue Denim Jacket" -> "blue-denim-jacket". */
export function slugify(title: string, fallback: string): string {
  const handle = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110)
    .replace(/-+$/g, "");

  return handle || fallback;
}

/** Whether a write failed because the handle is already taken in the marketplace. */
export function isHandleConflict(error: unknown): boolean {
  return error instanceof CatalogHandleConflictError;
}
