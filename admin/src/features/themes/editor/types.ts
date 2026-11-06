export type WorkspaceStatus =
  | 'REQUESTED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED'
  | 'DELETED';

export interface EditorState {
  themeId: string;
  revisionId: string;
  commitSha: string;
  version: string;
  codeReadOnly: boolean;
  publishEnabled: boolean;
  workspace: { status: WorkspaceStatus; errorCode: string | null } | null;
}

export interface PreviewState {
  url: string | null;
  expiresAt: string | null;
  ready: boolean;
}

export interface SourceFile {
  path: string;
  size: number;
}

export interface SourceFileContent {
  path: string;
  content: string;
}

export interface Revision {
  id: string;
  commitSha: string;
  parentRevisionId: string | null;
  message: string | null;
  origin: string;
  createdAt: string;
}

export interface RevisionHistory {
  headRevisionId: string;
  canRedo: boolean;
  revisions: Revision[];
}

export interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

export type AgentRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';

export interface AgentMessage {
  id: string;
  sequence: string;
  role: AgentRole;
  content: { text?: string } | null;
  createdAt: string;
}

export type AgentRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING_FOR_INPUT'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export interface AgentRun {
  id: string;
  conversationId: string;
  status: AgentRunStatus;
  errorSummary: string | null;
}
