import { randomUUID } from "node:crypto";
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
@Injectable()
export class EditThemeUseCase {
  private readonly logger = new Logger(EditThemeUseCase.name);
  constructor(
    private readonly getTheme: GetEditorThemeUseCase,
    private readonly store: ThemeEditorStore,
    private readonly workspace: ThemeWorkspacePort,
    private readonly leases: WorkspaceLeases,
    private readonly lifecycle: ThemeWorkspaceLifecycle,
  ) {}
  async execute<T>(
    input: ThemeEditorAccess & {
      runId: string;
      expectedRevisionId: string;
      message: string;
      signal: AbortSignal;
    },
    code: (workspace: CodingWorkspace) => Promise<T>,
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
        // Reuse a healthy saved workspace to keep installs and preview startup fast.
        // Failed/interrupted runs discard their cache before another run can use it.
        const signal = AbortSignal.any([input.signal, lease.signal]);
        signal.throwIfAborted();
        const sandboxId = await this.lifecycle.prepare(current, lease, signal);
        let storageKey: string | undefined;
        let commitStarted = false;
        try {
          signal.throwIfAborted();
          const result = await code({
            sandboxId,
            signal,
            baseRevisionId: current.headRevisionId,
            validateBuild: () => this.workspace.validateBuild(sandboxId),
          });
          signal.throwIfAborted();
          await lease.assert();
          storageKey = `themes/${theme.marketplaceId}/${theme.id}/snapshots/${randomUUID()}.tar.gz`;
          const snapshot = await this.workspace.checkpoint(
            sandboxId,
            storageKey,
            input.message,
          );
          signal.throwIfAborted();
          commitStarted = true;
          const revisionId = await this.store.commit(current, lease, {
            storageKey,
            commitSha: snapshot.commitSha,
            runId: input.runId,
            ownerId: input.ownerId,
            message: input.message,
          });
          if (revisionId === current.headRevisionId) {
            await this.workspace.discard(storageKey).catch(() => {
              this.logger.warn("Could not remove an unused theme snapshot");
            });
          }
          storageKey = undefined; // The DB now owns this immutable object.
          await this.workspace.startPreview(sandboxId);
          const sandbox = await this.store.workspace(
            theme.marketplaceId,
            theme.id,
          );
          if (!sandbox) {
            throw new StateConflictError(
              "Theme workspace is no longer available",
            );
          }
          await this.store.updateWorkspace(
            theme.marketplaceId,
            theme.id,
            sandbox.id,
            { restoredRevisionId: revisionId },
            lease,
          );
          return { result, revisionId };
        } catch (error) {
          // A connection failure can leave the commit outcome unknown. Once the DB
          // save starts, keep the object so a committed head stays usable.
          if (storageKey && !commitStarted) {
            await this.workspace
              .discard(storageKey)
              .catch(() =>
                this.logger.warn("Could not remove an unsaved theme snapshot"),
              );
          }
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
