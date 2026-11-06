import { PrismaService } from "@/platform/database/prisma/prisma.service";
import {
  ResourceNotFoundError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { ThemeEditorStore } from "../../application/ports/theme-editor.store";
import type { WorkspaceLease } from "../../application/ports/workspace-lease.port";
import type {
  EditorTheme,
  WorkspaceRecord,
  WorkspaceUpdate,
} from "../../domain/editor-workspace";
import type { SourceFile } from "../../domain/source-manifest";
import {
  REVISION_PAGE_SIZE,
  WORKSPACE_START_STALE_AFTER_MS,
} from "../../domain/workspace.policy";
@Injectable()
export class PrismaThemeEditorStore extends ThemeEditorStore {
  constructor(private readonly db: PrismaService) {
    super();
  }

  async get(marketplaceId: string, themeId: string): Promise<EditorTheme> {
    const row = await this.db.theme.findFirst({
      where: {
        id: themeId,
        marketplaceId,
        status: "ACTIVE",
        provisioningStatus: "READY",
      },
      include: { headRevision: true },
    });
    if (!row?.storageKey || !row.headRevision) {
      throw new ResourceNotFoundError("Theme not found or not ready");
    }
    return {
      id: row.id,
      marketplaceId,
      name: row.name,
      storageKey: row.storageKey,
      snapshotVersion: row.snapshotVersion,
      headRevisionId: row.headRevision.id,
      commitSha: row.headRevision.commitSha,
      redoStack: row.redoStack,
    };
  }

  revisions(marketplaceId: string, themeId: string) {
    return this.db.themeRevision.findMany({
      where: { marketplaceId, themeId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: REVISION_PAGE_SIZE,
      select: {
        id: true,
        commitSha: true,
        parentRevisionId: true,
        message: true,
        origin: true,
        createdAt: true,
      },
    });
  }

  async lastRunSucceeded(marketplaceId: string, themeId: string) {
    const run = await this.db.agentRun.findFirst({
      where: { marketplaceId, themeId },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    });
    return !run || run.status === "SUCCEEDED";
  }

  revision(marketplaceId: string, themeId: string, revisionId: string) {
    return this.db.themeRevision.findFirst({
      where: { id: revisionId, marketplaceId, themeId },
      select: { storageKey: true, parentRevisionId: true },
    });
  }

  async manifest(marketplaceId: string, themeId: string, revisionId: string) {
    const row = await this.db.themeRevisionManifest.findFirst({
      where: { revisionId, marketplaceId, revision: { themeId } },
      select: { files: true },
    });
    return row ? (row.files as unknown as SourceFile[]) : null;
  }

  async saveManifest(
    marketplaceId: string,
    revisionId: string,
    files: SourceFile[],
  ) {
    await this.db.themeRevisionManifest.createMany({
      data: {
        marketplaceId,
        revisionId,
        files: files as unknown as Prisma.InputJsonValue,
      },
      skipDuplicates: true,
    });
  }

  workspace(
    marketplaceId: string,
    themeId: string,
  ): Promise<WorkspaceRecord | null> {
    return this.db.themeSandbox.findFirst({
      where: { marketplaceId, themeId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        providerSandboxId: true,
        status: true,
        restoredRevisionId: true,
        lastErrorCode: true,
      },
    });
  }

  requestWorkspace(
    marketplaceId: string,
    themeId: string,
  ): Promise<WorkspaceRecord> {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM themes WHERE id=${themeId}::uuid AND "marketplaceId"=${marketplaceId}::uuid FOR UPDATE`;
      const active = await tx.themeSandbox.findFirst({
        where: {
          marketplaceId,
          themeId,
          status: { in: ["REQUESTED", "STARTING", "RUNNING", "STOPPING"] },
        },
      });
      if (active) {
        return active;
      }
      return tx.themeSandbox.create({
        data: { marketplaceId, themeId, status: "REQUESTED" },
      });
    });
  }

  async pendingWorkspaces(limit: number) {
    return this.db.themeSandbox.findMany({
      where: {
        theme: { agentRun_themeId: { none: { status: "RUNNING" } } },
        OR: [
          { status: "REQUESTED" },
          { status: "STOPPING" },
          {
            status: "STARTING",
            updatedAt: {
              lt: new Date(Date.now() - WORKSPACE_START_STALE_AFTER_MS),
            },
          },
        ],
      },
      take: limit,
      orderBy: { createdAt: "asc" },
      select: { marketplaceId: true, themeId: true },
    });
  }

  async updateWorkspace(
    marketplaceId: string,
    themeId: string,
    id: string,
    patch: WorkspaceUpdate,
    lease: WorkspaceLease,
  ) {
    await this.db.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM themes WHERE id=${themeId}::uuid AND "marketplaceId"=${marketplaceId}::uuid AND "workspaceLeaseToken"=${lease.token}::uuid AND "workspaceLeaseUntil">now() FOR UPDATE`;
      if (!locked.length) {
        throw new StateConflictError("Workspace lease expired");
      }
      const result = await tx.themeSandbox.updateMany({
        where: { id, marketplaceId, themeId },
        data: {
          ...patch,
          ...(patch.providerSandboxId
            ? {
                provider: patch.providerSandboxId.startsWith("docker:")
                  ? "DOCKER"
                  : "DAYTONA",
              }
            : {}),
          status: patch.status,
          lastActivityAt: new Date(),
        },
      });
      if (!result.count) {
        throw new StateConflictError("Theme workspace is no longer available");
      }
    });
  }

  async commit(
    theme: EditorTheme,
    lease: WorkspaceLease,
    input: {
      storageKey: string;
      commitSha: string;
      runId: string;
      ownerId: string;
      message: string;
    },
  ) {
    return this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM themes WHERE id=${theme.id}::uuid AND "marketplaceId"=${theme.marketplaceId}::uuid AND "workspaceLeaseToken"=${lease.token}::uuid AND "workspaceLeaseUntil">now() AND "snapshotVersion"=${theme.snapshotVersion} FOR UPDATE`;
      if (!rows.length) {
        throw new StateConflictError("Theme changed while saving");
      }
      // Serialize snapshot publication with cancellation and interrupted-run recovery.
      const runs = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM agent_runs WHERE id=${input.runId}::uuid AND "marketplaceId"=${theme.marketplaceId}::uuid AND "themeId"=${theme.id}::uuid AND status='RUNNING' AND "cancelRequestedAt" IS NULL FOR UPDATE`;
      if (!runs.length) {
        throw new StateConflictError("Agent run is no longer active");
      }
      if (input.commitSha === theme.commitSha) {
        return theme.headRevisionId;
      }
      if (
        !(await tx.marketplace.count({
          where: { id: theme.marketplaceId, ownerId: input.ownerId },
        }))
      ) {
        throw new StateConflictError("Marketplace access was revoked");
      }
      const revision = await tx.themeRevision.create({
        data: {
          marketplaceId: theme.marketplaceId,
          themeId: theme.id,
          commitSha: input.commitSha,
          storageKey: input.storageKey,
          parentRevisionId: theme.headRevisionId,
          message: input.message.slice(0, 500),
          origin: "AGENT",
          createdBy: input.ownerId,
          agentRunId: input.runId,
        },
      });
      await tx.theme.update({
        where: { id: theme.id },
        data: {
          storageKey: input.storageKey,
          snapshotVersion: { increment: 1 },
          headRevisionId: revision.id,
          redoRevisionId: null,
          redoStack: [],
          lastSnapshotAt: new Date(),
        },
      });
      await tx.agentRun.update({
        where: { id: input.runId },
        data: { resultRevisionId: revision.id },
      });
      return revision.id;
    });
  }

  async navigate(
    theme: EditorTheme,
    lease: WorkspaceLease,
    operation: "undo" | "redo" | "restore",
    revisionId?: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM themes WHERE id=${theme.id}::uuid AND "marketplaceId"=${theme.marketplaceId}::uuid AND "workspaceLeaseToken"=${lease.token}::uuid AND "workspaceLeaseUntil">now() AND "snapshotVersion"=${theme.snapshotVersion} FOR UPDATE`;
      if (!rows.length) {
        throw new StateConflictError("Theme changed");
      }
      if (
        await tx.agentRun.count({
          where: {
            marketplaceId: theme.marketplaceId,
            themeId: theme.id,
            status: { in: ["QUEUED", "RUNNING", "WAITING_FOR_INPUT"] },
          },
        })
      ) {
        throw new StateConflictError(
          "Cancel the active agent run before changing versions",
        );
      }
      const head = await tx.themeRevision.findFirstOrThrow({
        where: {
          id: theme.headRevisionId,
          marketplaceId: theme.marketplaceId,
          themeId: theme.id,
        },
      });
      const stack = [...theme.redoStack];
      let target: string | null | undefined = revisionId;
      if (operation === "undo") {
        target = head.parentRevisionId;
        stack.push(head.id);
      }
      if (operation === "redo") {
        target = stack.pop();
      }
      if (!target) {
        throw new StateConflictError(`Nothing to ${operation}`);
      }
      const revision = await tx.themeRevision.findFirst({
        where: {
          id: target,
          marketplaceId: theme.marketplaceId,
          themeId: theme.id,
        },
      });
      if (!revision) {
        throw new ResourceNotFoundError("Revision not found");
      }
      if (!revision.storageKey) {
        throw new StateConflictError("Revision snapshot is unavailable");
      }
      await tx.theme.update({
        where: { id: theme.id },
        data: {
          headRevisionId: revision.id,
          storageKey: revision.storageKey,
          snapshotVersion: { increment: 1 },
          redoStack: operation === "restore" ? [] : stack,
          redoRevisionId:
            operation === "restore" ? null : (stack.at(-1) ?? null),
        },
      });
      return revision.id;
    });
  }
}
