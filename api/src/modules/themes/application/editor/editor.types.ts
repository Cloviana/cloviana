export interface ThemeEditorAccess {
  ownerId: string;
  slug: string;
  themeId: string;
}

export interface CodingWorkspace {
  sandboxId: string;
  signal: AbortSignal;
  baseRevisionId: string;
  validateBuild(): Promise<boolean>;
}
