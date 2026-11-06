export interface EditorTheme {
  id: string;
  marketplaceId: string;
  name: string;
  storageKey: string;
  snapshotVersion: bigint;
  headRevisionId: string;
  commitSha: string;
  redoStack: string[];
}

export interface EditorRevision {
  id: string;
  commitSha: string;
  parentRevisionId: string | null;
  message: string | null;
  origin: string;
  createdAt: Date;
}

export interface WorkspaceRecord {
  id: string;
  providerSandboxId: string | null;
  status:
    | "REQUESTED"
    | "STARTING"
    | "RUNNING"
    | "STOPPING"
    | "STOPPED"
    | "FAILED"
    | "DELETED";
  restoredRevisionId: string | null;
  lastErrorCode: string | null;
}

export type WorkspaceUpdate = Partial<
  Pick<
    WorkspaceRecord,
    "providerSandboxId" | "status" | "restoredRevisionId" | "lastErrorCode"
  >
>;
