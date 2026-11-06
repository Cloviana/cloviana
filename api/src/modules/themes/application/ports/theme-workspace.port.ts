export abstract class ThemeWorkspacePort {
  abstract create(name: string): Promise<string>;
  abstract remove(sandboxId: string): Promise<void>;
  abstract restore(
    sandboxId: string,
    storageKey: string,
    commitSha: string,
  ): Promise<void>;
  abstract startPreview(sandboxId: string): Promise<void>;
  abstract validateBuild(sandboxId: string): Promise<boolean>;
  abstract preview(
    sandboxId: string,
  ): Promise<{ url: string; expiresAt: string | null; ready: boolean }>;
  abstract tree(
    sandboxId: string,
  ): Promise<Array<{ path: string; size: number }>>;
  abstract changes(sandboxId: string): Promise<string[]>;
  abstract file(
    sandboxId: string,
    path: string,
  ): Promise<{ path: string; content: string }>;
  abstract checkpoint(
    sandboxId: string,
    storageKey: string,
    message: string,
    baseCommitSha: string,
  ): Promise<{ commitSha: string }>;
  /** Moves a running sandbox to a commit in place; any result but "OK" means rebuild it. */
  abstract revert(sandboxId: string, commitSha: string): Promise<string>;
  abstract screenshot(sandboxId: string): Promise<Buffer>;
  abstract download(storageKey: string): Promise<string>;
  abstract discard(storageKey: string): Promise<void>;
}
