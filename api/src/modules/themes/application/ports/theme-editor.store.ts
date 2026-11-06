import type {
  EditorRevision,
  EditorTheme,
  WorkspaceRecord,
  WorkspaceUpdate,
} from "../../domain/editor-workspace";
import type { WorkspaceLease } from "./workspace-lease.port";

export abstract class ThemeEditorStore {
  abstract get(marketplaceId: string, themeId: string): Promise<EditorTheme>;
  abstract revisions(
    marketplaceId: string,
    themeId: string,
  ): Promise<EditorRevision[]>;
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
