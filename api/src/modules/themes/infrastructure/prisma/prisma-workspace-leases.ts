import { randomUUID } from "node:crypto";
import { PrismaService } from "@/platform/database/prisma/prisma.service";
import { StateConflictError } from "@/shared/errors/application-error";
import { Injectable, Logger } from "@nestjs/common";
import {
  type WorkspaceLease,
  WorkspaceLeases,
} from "../../application/ports/workspace-lease.port";
import {
  WORKSPACE_LEASE_DURATION_MS,
  WORKSPACE_LEASE_HEARTBEAT_MS,
} from "../../domain/workspace.policy";

@Injectable()
export class PrismaWorkspaceLeases extends WorkspaceLeases {
  private readonly logger = new Logger(PrismaWorkspaceLeases.name);
  constructor(private readonly db: PrismaService) {
    super();
  }

  async withLease<T>(
    marketplaceId: string,
    themeId: string,
    work: (lease: WorkspaceLease) => Promise<T>,
  ): Promise<T> {
    const token = randomUUID();
    // Use the database clock for every lease decision across API replicas.
    const acquired = await this.db.$queryRaw<{ id: string }[]>`
      UPDATE themes SET "workspaceLeaseToken"=${token}::uuid,
        "workspaceLeaseUntil"=now()+${WORKSPACE_LEASE_DURATION_MS}::integer*interval '1 millisecond'
      WHERE id=${themeId}::uuid AND "marketplaceId"=${marketplaceId}::uuid
        AND ("workspaceLeaseUntil" IS NULL OR "workspaceLeaseUntil"<now()) RETURNING id`;
    if (!acquired.length) {
      throw new StateConflictError("Theme workspace is busy");
    }

    const controller = new AbortController();
    const assert = async () => {
      if (controller.signal.aborted) {
        throw new StateConflictError("Workspace lease expired");
      }
      const current = await this.db.$queryRaw<{ id: string }[]>`
        SELECT id FROM themes WHERE id=${themeId}::uuid AND "marketplaceId"=${marketplaceId}::uuid
          AND "workspaceLeaseToken"=${token}::uuid AND "workspaceLeaseUntil">now()`;
      if (!current.length) {
        controller.abort();
        throw new StateConflictError("Workspace lease expired");
      }
    };
    let refreshing = false;
    const heartbeat = setInterval(async () => {
      if (refreshing || controller.signal.aborted) {
        return;
      }
      refreshing = true;
      try {
        const renewed = await this.db.$queryRaw<{ id: string }[]>`
          UPDATE themes SET "workspaceLeaseUntil"=now()+${WORKSPACE_LEASE_DURATION_MS}::integer*interval '1 millisecond'
          WHERE id=${themeId}::uuid AND "marketplaceId"=${marketplaceId}::uuid
            AND "workspaceLeaseToken"=${token}::uuid AND "workspaceLeaseUntil">now() RETURNING id`;
        if (!renewed.length) {
          controller.abort();
        }
      } catch {
        controller.abort();
      } finally {
        refreshing = false;
      }
    }, WORKSPACE_LEASE_HEARTBEAT_MS);
    heartbeat.unref();

    try {
      const result = await work({ token, signal: controller.signal, assert });
      await assert();
      return result;
    } finally {
      clearInterval(heartbeat);
      try {
        await this.db
          .$executeRaw`UPDATE themes SET "workspaceLeaseToken"=NULL,"workspaceLeaseUntil"=NULL
          WHERE id=${themeId}::uuid AND "marketplaceId"=${marketplaceId}::uuid AND "workspaceLeaseToken"=${token}::uuid`;
      } catch {
        // Expiry remains the fallback; failed cleanup must not mask a save or its original error.
        this.logger.warn(
          `Could not release workspace lease for theme ${themeId}`,
        );
      }
    }
  }
}
