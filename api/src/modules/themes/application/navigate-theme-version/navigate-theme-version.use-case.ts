import { StateConflictError } from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import type { ThemeEditorAccess } from "../editor/editor.types";
import { GetEditorThemeUseCase } from "../get-editor-theme/get-editor-theme.use-case";
import { ThemeEditorStore } from "../ports/theme-editor.store";
import { WorkspaceLeases } from "../ports/workspace-lease.port";
import { ThemeWorkspaceLifecycle } from "../workspace-lifecycle/theme-workspace-lifecycle";
@Injectable()
export class NavigateThemeVersionUseCase {
  constructor(
    private readonly getTheme: GetEditorThemeUseCase,
    private readonly store: ThemeEditorStore,
    private readonly leases: WorkspaceLeases,
    private readonly lifecycle: ThemeWorkspaceLifecycle,
  ) {}
  async execute(
    input: ThemeEditorAccess,
    operation: "undo" | "redo" | "restore",
    expectedRevisionId: string,
    revisionId?: string,
  ) {
    const theme = await this.getTheme.execute(input);
    return this.leases.withLease(
      theme.marketplaceId,
      theme.id,
      async (lease) => {
        const current = await this.store.get(theme.marketplaceId, theme.id);
        if (current.headRevisionId !== expectedRevisionId) {
          throw new StateConflictError(
            "Theme has changed; refresh its current revision",
          );
        }
        const next = await this.store.navigate(
          current,
          lease,
          operation,
          revisionId,
        );
        await this.lifecycle.stop(current, lease);
        await this.store.requestWorkspace(current.marketplaceId, current.id);
        return { revisionId: next, workspaceStatus: "REQUESTED" };
      },
    );
  }
}
