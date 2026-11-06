export interface WorkspaceLease {
  token: string;
  signal: AbortSignal;
  assert(): Promise<void>;
}

export abstract class WorkspaceLeases {
  abstract withLease<T>(
    marketplaceId: string,
    themeId: string,
    fn: (lease: WorkspaceLease) => Promise<T>,
  ): Promise<T>;
}
