import { Injectable } from "@nestjs/common";
import type { ThemeEditorAccess } from "../editor/editor.types";
import { GetEditorThemeUseCase } from "../get-editor-theme/get-editor-theme.use-case";
import { ThemeEditorStore } from "../ports/theme-editor.store";
import { WorkspaceLeases } from "../ports/workspace-lease.port";
import { ThemeWorkspaceLifecycle } from "../workspace-lifecycle/theme-workspace-lifecycle";
@Injectable()
export class RestartThemeWorkspaceUseCase {
  constructor(
    private readonly getTheme: GetEditorThemeUseCase,
    private readonly store: ThemeEditorStore,
    private readonly leases: WorkspaceLeases,
    private readonly lifecycle: ThemeWorkspaceLifecycle,
  ) {}
  async execute(input: ThemeEditorAccess) {
    const theme = await this.getTheme.execute(input);
    return this.leases.withLease(
      theme.marketplaceId,
      theme.id,
      async (lease) => {
        await this.lifecycle.stop(theme, lease);
        await this.store.requestWorkspace(theme.marketplaceId, theme.id);
        return { status: "REQUESTED" };
      },
    );
  }
}
