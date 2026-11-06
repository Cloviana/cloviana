export const THEME_SNAPSHOT_STORAGE = Symbol("THEME_SNAPSHOT_STORAGE");

export interface TemplateManifest {
  version: string;
  /** The template's initial commit, which becomes every new theme's first revision. */
  commitSha: string;
}

export interface ThemeSnapshotStorage {
  readTemplateManifest(
    templateKey: string,
    version: string,
  ): Promise<TemplateManifest>;
  /** Copies the template archive to `destinationKey` without downloading it. */
  copyTemplate(
    templateKey: string,
    version: string,
    destinationKey: string,
  ): Promise<void>;
  remove(key: string): Promise<void>;
}
