import { randomUUID } from "node:crypto";
import { StateConflictError } from "@/shared/errors/application-error";
import { Injectable, Logger } from "@nestjs/common";
import type { EditorTheme } from "../../domain/editor-workspace";
import type {
  CodingWorkspace,
  ThemeEditorAccess,
} from "../editor/editor.types";
import { ThemeSource } from "../editor/theme-source";
import { GetEditorThemeUseCase } from "../get-editor-theme/get-editor-theme.use-case";
import { ThemeEditorStore } from "../ports/theme-editor.store";
import { ThemeWorkspacePort } from "../ports/theme-workspace.port";
import {
  type WorkspaceLease,
  WorkspaceLeases,
} from "../ports/workspace-lease.port";
import { ThemeWorkspaceLifecycle } from "../workspace-lifecycle/theme-workspace-lifecycle";
@Injectable()
export class EditThemeUseCase {
  private readonly logger = new Logger(EditThemeUseCase.name);
  constructor(
    private readonly getTheme: GetEditorThemeUseCase,
    private readonly store: ThemeEditorStore,
    private readonly source: ThemeSource,
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
          const revisionId = await this.save(
            current,
            lease,
            sandboxId,
            input,
            signal,
          );
          return { result, revisionId };
        } catch (error) {
          // A run the user stopped keeps its work, if the project still builds.
          if (input.signal.aborted && !lease.signal.aborted) {
            await this.keepInterruptedWork(current, lease, sandboxId, input);
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

  /** Checkpoints the sandbox, commits it as the theme's next revision, and refreshes the preview. */
  private async save(
    current: EditorTheme,
    lease: WorkspaceLease,
    sandboxId: string,
    input: { runId: string; ownerId: string; message: string },
    signal?: AbortSignal,
  ) {
    const { marketplaceId, id: themeId } = current;
    const storageKey = `themes/${marketplaceId}/${themeId}/snapshots/${randomUUID()}.tar.gz`;
    let commitStarted = false;
    try {
      const snapshot = await this.workspace.checkpoint(
        sandboxId,
        storageKey,
        input.message,
        current.commitSha,
      );
      signal?.throwIfAborted();
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
      this.source.prepare(marketplaceId, themeId, revisionId);
      await this.workspace.startPreview(sandboxId);
      this.source.capturePicture(marketplaceId, themeId, revisionId, sandboxId);
      const sandbox = await this.store.workspace(marketplaceId, themeId);
      if (!sandbox) {
        throw new StateConflictError("Theme workspace is no longer available");
      }
      await this.store.updateWorkspace(
        marketplaceId,
        themeId,
        sandbox.id,
        { restoredRevisionId: revisionId },
        lease,
      );
      return revisionId;
    } catch (error) {
      // A connection failure can leave the commit outcome unknown. Once the DB
      // save starts, keep the object so a committed head stays usable.
      if (!commitStarted) {
        await this.workspace
          .discard(storageKey)
          .catch(() =>
            this.logger.warn("Could not remove an unsaved theme snapshot"),
          );
      }
      throw error;
    }
  }

  /** Saves what a stopped run had done, but only if it left changes and the project builds. */
  private async keepInterruptedWork(
    current: EditorTheme,
    lease: WorkspaceLease,
    sandboxId: string,
    input: { runId: string; ownerId: string; message: string },
  ) {
    try {
      if (!(await this.workspace.changes(sandboxId)).length) {
        return;
      }
      if (!(await this.workspace.validateBuild(sandboxId))) {
        return;
      }
      await lease.assert();
      await this.save(current, lease, sandboxId, {
        ...input,
        message: `Interrupted: ${input.message}`.slice(0, 200),
      });
    } catch {
      this.logger.warn(
        `Could not keep the work of interrupted run ${input.runId}`,
      );
    }
  }
}
