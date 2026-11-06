import { PrismaService } from "@/platform/database/prisma/prisma.service";
import {
  ResourceNotFoundError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { AgentExecutionStore } from "../../application/ports/agent-execution.store.port";
import { RUN_STALE_AFTER_MS } from "../../domain/agent.policy";
import type { Json, Run } from "../../domain/agent.types";
import { appendConversationMessage, appendRunEvent } from "./agent-message-log";
import { runSelect } from "./agent.select";

@Injectable()
export class PrismaAgentExecutionStore extends AgentExecutionStore {
  constructor(private readonly db: PrismaService) {
    super();
  }
  async claim(workerToken: string): Promise<Run | null> {
    return this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT r.id FROM agent_runs r WHERE r.status='QUEUED'
        AND (r."themeId" IS NULL OR EXISTS (SELECT 1 FROM themes t WHERE t.id=r."themeId" AND t."marketplaceId"=r."marketplaceId" AND (t."workspaceLeaseUntil" IS NULL OR t."workspaceLeaseUntil"<now())))
        ORDER BY r."createdAt",r.id FOR UPDATE OF r SKIP LOCKED LIMIT 1`;
      if (!rows.length) {
        return null;
      }
      return tx.agentRun.update({
        where: { id: rows[0].id },
        data: {
          status: "RUNNING",
          workerToken,
          heartbeatAt: new Date(),
          startedAt: new Date(),
        },
        select: runSelect,
      });
    });
  }
  async heartbeat(runId: string, marketplaceId: string, workerToken: string) {
    const { count } = await this.db.agentRun.updateMany({
      where: {
        id: runId,
        marketplaceId,
        workerToken,
        status: "RUNNING",
        cancelRequestedAt: null,
      },
      data: { heartbeatAt: new Date() },
    });
    return count > 0;
  }
  async executionContext(run: Run) {
    const row = await this.db.marketplace.findFirst({
      where: { id: run.marketplaceId, ownerId: run.requestedBy },
      select: { slug: true, ownerId: true, name: true },
    });
    if (!row) {
      throw new ResourceNotFoundError("Marketplace access was revoked");
    }
    return row;
  }
  async emit(run: Run, workerToken: string, type: string, payload: Json) {
    await this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM agent_runs WHERE id=${run.id}::uuid AND "marketplaceId"=${run.marketplaceId}::uuid AND "workerToken"=${workerToken}::uuid AND status='RUNNING' FOR UPDATE`;
      if (!rows.length) {
        throw new StateConflictError("Run is no longer active");
      }
      await appendRunEvent(tx, {
        marketplaceId: run.marketplaceId,
        runId: run.id,
        type,
        payload,
      });
    });
  }
  async complete(run: Run, workerToken: string, text: string) {
    await this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM agent_conversations WHERE id=${run.conversationId}::uuid AND "marketplaceId"=${run.marketplaceId}::uuid FOR UPDATE`;
      const updated = await tx.agentRun.updateMany({
        where: {
          id: run.id,
          marketplaceId: run.marketplaceId,
          workerToken,
          status: "RUNNING",
          cancelRequestedAt: null,
        },
        data: {
          status: "SUCCEEDED",
          finishedAt: new Date(),
          modelTokenHash: null,
          workerToken: null,
        },
      });
      if (!updated.count) {
        throw new StateConflictError("Run was cancelled or interrupted");
      }
      await appendConversationMessage(tx, {
        marketplaceId: run.marketplaceId,
        conversationId: run.conversationId,
        role: "ASSISTANT",
        content: { text },
      });
      await appendRunEvent(tx, {
        marketplaceId: run.marketplaceId,
        runId: run.id,
        type: "run.succeeded",
        payload: {},
      });
      await tx.agentConversation.update({
        where: { id: run.conversationId },
        data: { updatedAt: new Date() },
      });
    });
  }
  async fail(run: Run, workerToken: string, code: string, cancelled: boolean) {
    await this.db.$transaction(async (tx) => {
      const changed = await tx.agentRun.updateMany({
        where: {
          id: run.id,
          marketplaceId: run.marketplaceId,
          workerToken,
          status: "RUNNING",
        },
        data: {
          status: cancelled ? "CANCELLED" : "FAILED",
          errorCode: code,
          errorSummary: cancelled
            ? "The run was cancelled."
            : "The run stopped. Check its events and saved revision before retrying.",
          finishedAt: new Date(),
          modelTokenHash: null,
          workerToken: null,
        },
      });
      if (!changed.count) {
        return;
      }
      await appendRunEvent(tx, {
        marketplaceId: run.marketplaceId,
        runId: run.id,
        type: cancelled ? "run.cancelled" : "run.failed",
        payload: { code },
      });
    });
  }
  async recoverStale() {
    // Never replay arbitrary tool effects after a process crash. Keep any saved revision visible.
    await this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          marketplaceId: string;
          themeId: string | null;
          cancelRequestedAt: Date | null;
        }>
      >`SELECT id,"marketplaceId","themeId","cancelRequestedAt" FROM agent_runs WHERE status='RUNNING' AND COALESCE("heartbeatAt","startedAt","createdAt")<now()-${RUN_STALE_AFTER_MS}::integer*interval '1 millisecond' FOR UPDATE SKIP LOCKED LIMIT 50`;
      for (const run of rows) {
        const cancelled = run.cancelRequestedAt !== null;
        const code = cancelled ? "CANCELLED" : "WORKER_INTERRUPTED";
        await tx.agentRun.update({
          where: { id: run.id },
          data: {
            status: cancelled ? "CANCELLED" : "FAILED",
            errorCode: code,
            errorSummary: cancelled
              ? "Run cancelled. Review resultRevisionId for a completed save."
              : "Worker interrupted. Review resultRevisionId before retrying.",
            finishedAt: new Date(),
            modelTokenHash: null,
            workerToken: null,
          },
        });
        await appendRunEvent(tx, {
          marketplaceId: run.marketplaceId,
          runId: run.id,
          type: cancelled ? "run.cancelled" : "run.failed",
          payload: { code },
        });
        if (run.themeId) {
          await tx.themeSandbox.updateMany({
            where: {
              marketplaceId: run.marketplaceId,
              themeId: run.themeId,
              status: { in: ["RUNNING", "STARTING"] },
            },
            data: { status: "REQUESTED", lastErrorCode: "WORKER_INTERRUPTED" },
          });
        }
      }
    });
  }
}
