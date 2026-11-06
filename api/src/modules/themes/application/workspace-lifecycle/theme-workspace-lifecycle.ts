import { Injectable, Logger } from "@nestjs/common";
import type { EditorTheme } from "../../domain/editor-workspace";
import { ThemeEditorStore } from "../ports/theme-editor.store";
import { ThemeWorkspacePort } from "../ports/theme-workspace.port";
import { type WorkspaceLease } from "../ports/workspace-lease.port";

@Injectable()
export class ThemeWorkspaceLifecycle {
  private readonly logger = new Logger(ThemeWorkspaceLifecycle.name);
  constructor(
    private readonly store: ThemeEditorStore,
    private readonly workspace: ThemeWorkspacePort,
  ) {}
  async stop(theme: EditorTheme, lease: WorkspaceLease) {
    const current = await this.store.workspace(theme.marketplaceId, theme.id);
    if (!current || ["DELETED", "STOPPED"].includes(current.status)) {
      return;
    }
    await this.store.updateWorkspace(
      theme.marketplaceId,
      theme.id,
      current.id,
      { status: "STOPPING" },
      lease,
    );
    if (current.providerSandboxId) {
      await this.workspace.remove(current.providerSandboxId);
    }
    await this.store.updateWorkspace(
      theme.marketplaceId,
      theme.id,
      current.id,
      { status: "STOPPED" },
      lease,
    );
  }
  async prepare(
    theme: EditorTheme,
    lease: WorkspaceLease,
    signal?: AbortSignal,
  ) {
    signal?.throwIfAborted();
    let record = await this.store.requestWorkspace(
      theme.marketplaceId,
      theme.id,
    );
    if (record.status === "STOPPING") {
      await this.stop(theme, lease);
      record = await this.store.requestWorkspace(theme.marketplaceId, theme.id);
    }
    if (
      record.status === "RUNNING" &&
      record.restoredRevisionId === theme.headRevisionId &&
      record.providerSandboxId
    ) {
      try {
        await this.workspace.startPreview(record.providerSandboxId);
        signal?.throwIfAborted();
        return record.providerSandboxId;
      } catch (error) {
        if (signal?.aborted || lease.signal.aborted) {
          throw error;
        }
        await this.stop(theme, lease);
        record = await this.store.requestWorkspace(
          theme.marketplaceId,
          theme.id,
        );
      }
    }
    await this.store.updateWorkspace(
      theme.marketplaceId,
      theme.id,
      record.id,
      { status: "STARTING", lastErrorCode: null },
      lease,
    );
    let ownedSandboxId: string | undefined;
    try {
      if (record.providerSandboxId) {
        // Discard processes and partial files left by an interrupted worker.
        ownedSandboxId = record.providerSandboxId;
        await this.workspace.remove(record.providerSandboxId);
        ownedSandboxId = undefined;
        await this.store.updateWorkspace(
          theme.marketplaceId,
          theme.id,
          record.id,
          { providerSandboxId: null },
          lease,
        );
      }
      // Recover a provision interrupted after provider creation but before the ID reached the DB.
      const sandboxId = await this.workspace.create(`cloviana-${record.id}`);
      ownedSandboxId = sandboxId;
      await this.store.updateWorkspace(
        theme.marketplaceId,
        theme.id,
        record.id,
        { providerSandboxId: sandboxId },
        lease,
      );
      signal?.throwIfAborted();
      await this.workspace.restore(
        sandboxId,
        theme.storageKey,
        theme.commitSha,
      );
      signal?.throwIfAborted();
      await lease.assert();
      await this.workspace.startPreview(sandboxId);
      await this.store.updateWorkspace(
        theme.marketplaceId,
        theme.id,
        record.id,
        { status: "RUNNING", restoredRevisionId: theme.headRevisionId },
        lease,
      );
      return sandboxId;
    } catch (error) {
      try {
        await lease.assert();
      } catch {
        // An expired worker must not delete a replacement worker's sandbox.
        throw error;
      }
      let cleanupFailed = false;
      if (ownedSandboxId) {
        try {
          await this.workspace.remove(ownedSandboxId);
        } catch {
          cleanupFailed = true;
          this.logger.warn(`Could not remove failed workspace ${record.id}`);
        }
      }
      await this.store
        .updateWorkspace(
          theme.marketplaceId,
          theme.id,
          record.id,
          {
            status: cleanupFailed ? "STOPPING" : "FAILED",
            lastErrorCode: "WORKSPACE_START_FAILED",
          },
          lease,
        )
        .catch(() =>
          this.logger.warn(
            `Could not record failure for workspace ${record.id}`,
          ),
        );
      throw error;
    }
  }
}
