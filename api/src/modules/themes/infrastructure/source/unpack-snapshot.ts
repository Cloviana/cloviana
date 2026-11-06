import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { extract } from "tar-stream";
import type { UnpackedSourceFile } from "../../application/ports/theme-source.storage.port";
import { isSourcePath } from "../../domain/source-path";
import {
  MAX_EXTRACTED_SNAPSHOT_BYTES,
  MAX_SNAPSHOT_ENTRIES,
  MAX_SOURCE_FILES,
  MAX_SOURCE_FILE_BYTES,
} from "../../domain/workspace.policy";

/**
 * Reads a revision archive in the API process. The archive is built inside a sandbox the agent
 * controls, so it is untrusted: everything is streamed and capped before it reaches memory, and
 * only regular files on safe paths are kept.
 */
export async function unpackSnapshot(archive: Buffer) {
  const files: UnpackedSourceFile[] = [];
  let entries = 0;
  let bytes = 0;

  const tar = extract();
  tar.on("entry", (header, stream, next) => {
    entries += 1;
    if (entries > MAX_SNAPSHOT_ENTRIES) {
      next(new Error("Archive has too many entries"));
      return;
    }
    const path = header.name.replace(/^\.\//, "");
    const keep =
      header.type === "file" &&
      isSourcePath(path) &&
      (header.size ?? 0) <= MAX_SOURCE_FILE_BYTES;
    const chunks: Buffer[] = [];
    let size = 0;
    stream.on("data", (chunk: Buffer) => {
      size += chunk.length;
      bytes += chunk.length;
      if (bytes > MAX_EXTRACTED_SNAPSHOT_BYTES) {
        stream.destroy(new Error("Archive is too large"));
      } else if (keep) {
        chunks.push(chunk);
      }
    });
    stream.on("error", next);
    stream.on("end", () => {
      if (header.type === "file" && isSourcePath(path)) {
        const content = keep ? Buffer.concat(chunks) : null;
        const viewable = content !== null && !content.includes(0);
        files.push({
          path,
          size,
          sha256: viewable
            ? createHash("sha256").update(content).digest("hex")
            : null,
          content: viewable ? content : null,
        });
      }
      next();
    });
  });

  await pipeline(Readable.from([archive]), createGunzip(), tar);
  if (files.length > MAX_SOURCE_FILES) {
    throw new Error("Archive has too many source files");
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
