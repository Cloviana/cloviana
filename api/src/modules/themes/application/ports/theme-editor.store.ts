import type {
  EditorRevision,
  EditorTheme,
  WorkspaceRecord,
  WorkspaceUpdate,
} from "../../domain/editor-workspace";
import type { SourceFile } from "../../domain/source-manifest";
import type { WorkspaceLease } from "./workspace-lease.port";

export abstract class ThemeEditorStore {
  abstract get(marketplaceId: string, themeId: string): Promise<EditorTheme>;
  abstract revisions(
    marketplaceId: string,
    themeId: string,
  ): Promise<EditorRevision[]>;
  /** False after a failed or cancelled run, whose leftovers a sandbox must not carry forward. */
  abstract lastRunSucceeded(
    marketplaceId: string,
    themeId: string,
  ): Promise<boolean>;
  abstract revision(
    marketplaceId: string,
    themeId: string,
    revisionId: string,
  ): Promise<{
    storageKey: string | null;
    parentRevisionId: string | null;
  } | null>;
  abstract manifest(
    marketplaceId: string,
    themeId: string,
    revisionId: string,
  ): Promise<SourceFile[] | null>;
  abstract saveManifest(
    marketplaceId: string,
    revisionId: string,
    files: SourceFile[],
  ): Promise<void>;
  abstract workspace(
    marketplaceId: string,
    themeId: string,
  ): Promise<WorkspaceRecord | null>;
  abstract requestWorkspace(
    marketplaceId: string,
    themeId: string,
  ): Promise<WorkspaceRecord>;
  abstract pendingWorkspaces(
    limit: number,
  ): Promise<Array<{ marketplaceId: string; themeId: string }>>;
  abstract updateWorkspace(
    marketplaceId: string,
    themeId: string,
    id: string,
    patch: WorkspaceUpdate,
    lease: WorkspaceLease,
  ): Promise<void>;
  abstract commit(
    theme: EditorTheme,
    lease: WorkspaceLease,
    input: {
      storageKey: string;
      commitSha: string;
      runId: string;
      ownerId: string;
      message: string;
    },
  ): Promise<string>;
  abstract navigate(
    theme: EditorTheme,
    lease: WorkspaceLease,
    operation: "undo" | "redo" | "restore",
    revisionId?: string,
  ): Promise<string>;
}
