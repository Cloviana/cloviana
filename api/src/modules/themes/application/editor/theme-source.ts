import {
  InvalidInputError,
  ResourceNotFoundError,
} from "@/shared/errors/application-error";
import { Injectable, Logger } from "@nestjs/common";
import { BLOB_HASH, type SourceFile } from "../../domain/source-manifest";
import { MAX_PICTURE_BYTES } from "../../domain/workspace.policy";
import { ThemeEditorStore } from "../ports/theme-editor.store";
import { ThemeSourceStorage } from "../ports/theme-source.storage.port";
import { ThemeWorkspacePort } from "../ports/theme-workspace.port";

const BLOB_WRITE_CONCURRENCY = 8;
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Reads a revision's files from storage, so the code view works with no sandbox running. A manifest
 * is derived from the immutable archive: at save time, or on first read for older revisions.
 */
@Injectable()
export class ThemeSource {
  private readonly logger = new Logger(ThemeSource.name);
  private readonly indexing = new Map<string, Promise<SourceFile[]>>();
  constructor(
    private readonly store: ThemeEditorStore,
    private readonly storage: ThemeSourceStorage,
    private readonly workspace: ThemeWorkspacePort,
  ) {}

  async manifest(marketplaceId: string, themeId: string, revisionId: string) {
    const saved = await this.store.manifest(marketplaceId, themeId, revisionId);
    if (saved) {
      return saved;
    }
    const running = this.indexing.get(revisionId);
    if (running) {
      return running;
    }
    const indexed = this.index(marketplaceId, themeId, revisionId).finally(() =>
      this.indexing.delete(revisionId),
    );
    this.indexing.set(revisionId, indexed);
    return indexed;
  }

  /** Best effort after a save: the first read rebuilds the manifest if this fails. */
  prepare(marketplaceId: string, themeId: string, revisionId: string) {
    this.manifest(marketplaceId, themeId, revisionId).catch(() =>
      this.logger.warn(`Could not index theme revision ${revisionId}`),
    );
  }

  picture(marketplaceId: string, themeId: string, revisionId: string) {
    return this.storage
      .readPicture(marketplaceId, themeId, revisionId)
      .catch(() => {
        throw new ResourceNotFoundError("No picture for this revision yet");
      });
  }

  /** Best effort: the picture only saves waiting, and the sandbox may be replaced meanwhile. */
  capturePicture(
    marketplaceId: string,
    themeId: string,
    revisionId: string,
    sandboxId: string,
  ) {
    void (async () => {
      if (await this.storage.hasPicture(marketplaceId, themeId, revisionId)) {
        return;
      }
      const image = await this.workspace.screenshot(sandboxId);
      // The bytes come from the sandbox, so only a real PNG of a sane size is kept.
      if (
        image.length > MAX_PICTURE_BYTES ||
        !image.subarray(0, 8).equals(PNG)
      ) {
        throw new Error("Not a PNG");
      }
      await this.storage.writePicture(
        marketplaceId,
        themeId,
        revisionId,
        image,
      );
    })().catch(() =>
      this.logger.warn(`Could not capture revision ${revisionId}`),
    );
  }

  blob(marketplaceId: string, themeId: string, sha256: string) {
    if (!BLOB_HASH.test(sha256)) {
      throw new InvalidInputError("Invalid file hash");
    }
    return this.storage.readBlob(marketplaceId, themeId, sha256);
  }

  private async index(
    marketplaceId: string,
    themeId: string,
    revisionId: string,
  ) {
    const revision = await this.store.revision(
      marketplaceId,
      themeId,
      revisionId,
    );
    if (!revision?.storageKey) {
      throw new ResourceNotFoundError("Theme revision not found");
    }
    const parent = revision.parentRevisionId
      ? await this.store.manifest(
          marketplaceId,
          themeId,
          revision.parentRevisionId,
        )
      : null;
    const stored = new Set(parent?.map((file) => file.sha256));

    const unpacked = await this.storage.unpack(revision.storageKey);
    const pending = new Map(
      unpacked.flatMap(({ sha256, content }) =>
        sha256 && content && !stored.has(sha256)
          ? [[sha256, content] as const]
          : [],
      ),
    );
    const queue = [...pending];
    // Blobs go first: a manifest must never name a file that isn't stored yet.
    await Promise.all(
      Array.from({ length: BLOB_WRITE_CONCURRENCY }, async () => {
        for (let next = queue.pop(); next; next = queue.pop()) {
          await this.storage.writeBlob(
            marketplaceId,
            themeId,
            next[0],
            next[1],
          );
        }
      }),
    );

    const files = unpacked.map(({ path, size, sha256 }) => ({
      path,
      size,
      sha256,
    }));
    await this.store.saveManifest(marketplaceId, revisionId, files);
    return files;
  }
}
