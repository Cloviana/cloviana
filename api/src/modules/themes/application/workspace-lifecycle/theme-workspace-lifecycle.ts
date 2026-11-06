import { AppConfiguration } from "@/platform/config/app.configuration";
import { Injectable, Logger } from "@nestjs/common";
import type { EditorTheme } from "../../domain/editor-workspace";
import { ThemeSource } from "../editor/theme-source";
import { ThemeEditorStore } from "../ports/theme-editor.store";
import { ThemeWorkspacePort } from "../ports/theme-workspace.port";
import { type WorkspaceLease } from "../ports/workspace-lease.port";

@Injectable()
export class ThemeWorkspaceLifecycle {
  private readonly logger = new Logger(ThemeWorkspaceLifecycle.name);
  constructor(
    private readonly store: ThemeEditorStore,
    private readonly workspace: ThemeWorkspacePort,
    private readonly source: ThemeSource,
    private readonly config: AppConfiguration,
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
  /**
   * After the head moves: keep a sandbox whose history is clean and let `prepare` revert it in
   * place, or discard it. Only this leaves a REQUESTED record holding a sandbox. The revision is
   * cleared first, so a crash part-way can never pass as a healthy sandbox on the old revision.
   */
  async release(theme: EditorTheme, lease: WorkspaceLease) {
    const current = await this.store.workspace(theme.marketplaceId, theme.id);
    const reusable =
      this.config.themeInPlaceRevert &&
      !!current?.providerSandboxId &&
      ["RUNNING", "REQUESTED"].includes(current.status) &&
      (await this.store.lastRunSucceeded(theme.marketplaceId, theme.id));
    if (!reusable) {
      await this.stop(theme, lease);
      await this.store.requestWorkspace(theme.marketplaceId, theme.id);
      return;
    }
    await this.store.updateWorkspace(
      theme.marketplaceId,
      theme.id,
      current.id,
      { status: "REQUESTED", restoredRevisionId: null },
      lease,
    );
  }

  private async revertInPlace(
    theme: EditorTheme,
    record: { id: string; sandboxId: string },
    lease: WorkspaceLease,
    signal?: AbortSignal,
  ) {
    const startedAt = Date.now();
    await this.store.updateWorkspace(
      theme.marketplaceId,
      theme.id,
      record.id,
      { status: "STARTING", lastErrorCode: null },
      lease,
    );
    try {
      const result = await this.workspace.revert(
        record.sandboxId,
        theme.commitSha,
      );
      if (result !== "OK") {
        this.logger.log(`In-place revert of theme ${theme.id}: ${result}`);
        return null;
      }
      signal?.throwIfAborted();
      await lease.assert();
      await this.workspace.startPreview(record.sandboxId);
      await this.store.updateWorkspace(
        theme.marketplaceId,
        theme.id,
        record.id,
        { status: "RUNNING", restoredRevisionId: theme.headRevisionId },
        lease,
      );
      this.source.capturePicture(
        theme.marketplaceId,
        theme.id,
        theme.headRevisionId,
        record.sandboxId,
      );
      this.logger.log(
        `In-place revert of theme ${theme.id}: OK in ${Date.now() - startedAt}ms`,
      );
      return record.sandboxId;
    } catch (error) {
      if (signal?.aborted || lease.signal.aborted) {
        throw error;
      }
      this.logger.warn(`In-place revert of theme ${theme.id} failed`);
      return null;
    }
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
    if (record.status === "REQUESTED" && record.providerSandboxId) {
      const sandboxId = await this.revertInPlace(
        theme,
        { id: record.id, sandboxId: record.providerSandboxId },
        lease,
        signal,
      );
      if (sandboxId) {
        return sandboxId;
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
    const startedAt = Date.now();
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
      const createdAt = Date.now();
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
      const restoredAt = Date.now();
      await this.workspace.startPreview(sandboxId);
      await this.store.updateWorkspace(
        theme.marketplaceId,
        theme.id,
        record.id,
        { status: "RUNNING", restoredRevisionId: theme.headRevisionId },
        lease,
      );
      this.source.capturePicture(
        theme.marketplaceId,
        theme.id,
        theme.headRevisionId,
        sandboxId,
      );
      this.logger.log(
        `Workspace ready for theme ${theme.id}: create ${createdAt - startedAt}ms, restore ${restoredAt - createdAt}ms, start ${Date.now() - restoredAt}ms`,
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
