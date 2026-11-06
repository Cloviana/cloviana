export interface SourceFile {
  path: string;
  size: number;
  /** Null for a binary or oversized file, which the code view lists but can't show. */
  sha256: string | null;
}

export const BLOB_HASH = /^[a-f0-9]{64}$/;
