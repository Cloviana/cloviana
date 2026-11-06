import { Injectable } from "@nestjs/common";
import { ThemeEditorStore } from "../ports/theme-editor.store";
import { WorkspaceLeases } from "../ports/workspace-lease.port";
import { ThemeWorkspaceLifecycle } from "../workspace-lifecycle/theme-workspace-lifecycle";
@Injectable()
export class PrepareThemeWorkspaceUseCase {
  constructor(
    private readonly store: ThemeEditorStore,
    private readonly leases: WorkspaceLeases,
    private readonly lifecycle: ThemeWorkspaceLifecycle,
  ) {}
  async execute(marketplaceId: string, themeId: string, signal?: AbortSignal) {
    return this.leases.withLease(marketplaceId, themeId, async (lease) => {
      const theme = await this.store.get(marketplaceId, themeId);
      await this.lifecycle.prepare(theme, lease, signal);
    });
  }
}
