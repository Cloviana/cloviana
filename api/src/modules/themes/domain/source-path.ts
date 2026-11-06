import { MAX_SOURCE_PATH_CHARACTERS } from "./workspace.policy";

// Treat every path from the browser as untrusted, even though the code view is read-only.
export function isSourcePath(path: string): boolean {
  if (
    !path ||
    path.length > MAX_SOURCE_PATH_CHARACTERS ||
    path.startsWith("/") ||
    path.includes("\\") ||
    [...path].some((character) => character.charCodeAt(0) < 32)
  ) {
    return false;
  }
  const blocked = new Set([
    ".git",
    "node_modules",
    ".next",
    ".opencode",
    ".cloviana",
    "dist",
    ".turbo",
  ]);
  return path.split("/").every(
    (part) =>
      !!part &&
      part !== "." &&
      part !== ".." &&
      !blocked.has(part) &&
      !part.startsWith(".env") &&
      // AppleDouble metadata from archives made on macOS, not source.
      !part.startsWith("._"),
  );
}
