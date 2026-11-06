import { StateConflictError } from "@/shared/errors/application-error";
import { Injectable, Logger } from "@nestjs/common";
import type {
  CodingWorkspace,
  ThemeEditorAccess,
} from "../editor/editor.types";
import { GetEditorThemeUseCase } from "../get-editor-theme/get-editor-theme.use-case";
import { ThemeEditorStore } from "../ports/theme-editor.store";
import { ThemeWorkspacePort } from "../ports/theme-workspace.port";
import { WorkspaceLeases } from "../ports/workspace-lease.port";
import { ThemeWorkspaceLifecycle } from "../workspace-lifecycle/theme-workspace-lifecycle";

/**
 * Runs read-only work against a theme's workspace: answering questions and drafting plans. It
 * takes the same lease as an edit, so nothing else changes the theme meanwhile, but it never
 * saves a revision. If the work left any change behind, the workspace is thrown away and the run
 * fails, so a read-only run can't alter a theme even if its restrictions were bypassed.
 */
@Injectable()
export class InspectThemeUseCase {
  private readonly logger = new Logger(InspectThemeUseCase.name);
  constructor(
    private readonly getTheme: GetEditorThemeUseCase,
    private readonly store: ThemeEditorStore,
    private readonly workspace: ThemeWorkspacePort,
    private readonly leases: WorkspaceLeases,
    private readonly lifecycle: ThemeWorkspaceLifecycle,
  ) {}

  async execute<T>(
    input: ThemeEditorAccess & {
      expectedRevisionId: string;
      signal: AbortSignal;
    },
    inspect: (workspace: CodingWorkspace) => Promise<T>,
  ) {
    const theme = await this.getTheme.execute(input);
    return this.leases.withLease(
      theme.marketplaceId,
      theme.id,
      async (lease) => {
        const current = await this.store.get(theme.marketplaceId, theme.id);
        if (current.headRevisionId !== input.expectedRevisionId) {
          throw new StateConflictError("The run's base revision is stale");
        }
        const signal = AbortSignal.any([input.signal, lease.signal]);
        signal.throwIfAborted();
        const sandboxId = await this.lifecycle.prepare(current, lease, signal);
        try {
          const result = await inspect({
            sandboxId,
            signal,
            baseRevisionId: current.headRevisionId,
            validateBuild: () => this.workspace.validateBuild(sandboxId),
          });
          signal.throwIfAborted();
          const changed = await this.workspace.changes(sandboxId);
          if (changed.length) {
            throw new StateConflictError(
              "A read-only run changed the theme and was discarded",
            );
          }
          return result;
        } catch (error) {
          await this.lifecycle
            .stop(current, lease)
            .catch(() =>
              this.logger.warn(
                `Could not stop workspace for theme ${theme.id}`,
              ),
            );
          throw error;
        }
      },
    );
  }
}
