import { PrismaService } from "@/platform/database/prisma/prisma.service";
import {
  ResourceNotFoundError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AgentRunRepository } from "../../application/ports/agent-run.repository.port";
import type { AgentMode } from "../../domain/agent-mode";
import {
  EVENT_PAGE_SIZE,
  ACTIVE_RUN_STATUSES as active,
  isActiveRunStatus,
} from "../../domain/agent.policy";
import type { QueueAgentRunInput } from "../../domain/agent.types";
import type { Json, Run } from "../../domain/agent.types";
import { MAX_RUN_REFERENCES } from "../../domain/attachment.policy";
import type { RunContext } from "../../domain/run-context";
import { appendConversationMessage, appendRunEvent } from "./agent-message-log";
import { runSelect } from "./agent.select";

@Injectable()
export class PrismaAgentRunRepository extends AgentRunRepository {
  constructor(private readonly db: PrismaService) {
    super();
  }
  async enqueue(input: QueueAgentRunInput) {
    try {
      return await this.db.$transaction(async (tx) => {
        // Lock order is always theme, then conversation, then run.
        let themeHead: string | null | undefined;
        if (input.themeId) {
          const rows = await tx.$queryRaw<
            { headRevisionId: string }[]
          >`SELECT "headRevisionId" FROM themes WHERE id=${input.themeId}::uuid AND "marketplaceId"=${input.marketplaceId}::uuid AND status='ACTIVE' FOR UPDATE`;
          if (!rows.length) {
            throw new ResourceNotFoundError("Theme not found");
          }
          themeHead = rows[0].headRevisionId;
        }
        const conversation = await tx.$queryRaw<
          { id: string }[]
        >`SELECT id FROM agent_conversations WHERE id=${input.conversationId}::uuid AND "marketplaceId"=${input.marketplaceId}::uuid AND status='ACTIVE' FOR UPDATE`;
        if (!conversation.length) {
          throw new ResourceNotFoundError("Conversation not found");
        }
        const existing = await tx.agentRun.findFirst({
          where: {
            marketplaceId: input.marketplaceId,
            idempotencyKey: input.idempotencyKey,
          },
          select: {
            ...runSelect,
            triggerMessage: { select: { content: true } },
          },
        });
        if (existing) {
          return this.replay(existing, input);
        }
        if (input.themeId && themeHead !== input.baseRevisionId) {
          throw new StateConflictError("Theme base revision has changed");
        }
        const busy = await tx.agentRun.count({
          where: {
            marketplaceId: input.marketplaceId,
            status: { in: [...active] },
            OR: [
              { conversationId: input.conversationId },
              ...(input.themeId ? [{ themeId: input.themeId }] : []),
            ],
          },
        });
        if (busy) {
          throw new StateConflictError(
            "This conversation or theme already has an active run",
          );
        }
        const attachmentIds = [...new Set(input.attachmentIds ?? [])];
        if (
          attachmentIds.length > MAX_RUN_REFERENCES ||
          (await tx.agentAttachment.count({
            where: {
              id: { in: attachmentIds },
              marketplaceId: input.marketplaceId,
              message: {
                conversationId: input.conversationId,
                marketplaceId: input.marketplaceId,
              },
              uploadStatus: "READY",
            },
          })) !== attachmentIds.length
        ) {
          throw new ResourceNotFoundError("Reference not found or not ready");
        }
        const message = await appendConversationMessage(tx, {
          marketplaceId: input.marketplaceId,
          conversationId: input.conversationId,
          role: "USER",
          // The context was validated at the edge and holds only plain data.
          content: {
            text: input.prompt,
            ...(input.context ? { context: input.context } : {}),
          } as unknown as Json,
          createdBy: input.ownerId,
        });
        const run = await tx.agentRun.create({
          data: {
            marketplaceId: input.marketplaceId,
            conversationId: input.conversationId,
            triggerMessageId: message.id,
            requestedBy: input.ownerId,
            themeId: input.themeId,
            mode: input.mode,
            baseRevisionId: input.baseRevisionId,
            idempotencyKey: input.idempotencyKey,
            attachmentIds,
          },
          select: runSelect,
        });
        await appendRunEvent(tx, {
          marketplaceId: run.marketplaceId,
          runId: run.id,
          type: "run.queued",
          payload: {},
        });
        await tx.agentConversation.update({
          where: { id: input.conversationId },
          data: { updatedAt: new Date() },
        });
        return run;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new StateConflictError(
          "A run is already active or the idempotency key is in use",
        );
      }
      throw error;
    }
  }
  async run(marketplaceId: string, runId: string) {
    const row = await this.db.agentRun.findFirst({
      where: { id: runId, marketplaceId },
      select: runSelect,
    });
    if (!row) {
      throw new ResourceNotFoundError("Run not found");
    }
    return row;
  }
  activeRun(marketplaceId: string, conversationId: string) {
    return this.db.agentRun.findFirst({
      where: { marketplaceId, conversationId, status: { in: [...active] } },
      select: runSelect,
      orderBy: { createdAt: "desc" },
    });
  }
  async events(marketplaceId: string, runId: string, after: bigint) {
    await this.run(marketplaceId, runId);
    return (
      await this.db.agentRunEvent.findMany({
        where: { marketplaceId, runId, sequence: { gt: after } },
        orderBy: { sequence: "asc" },
        take: EVENT_PAGE_SIZE,
      })
    ).map(({ id, sequence, type, payload, createdAt }) => ({
      id,
      sequence: sequence.toString(),
      type,
      payload: payload as Json,
      createdAt,
    }));
  }
  async cancel(marketplaceId: string, runId: string) {
    await this.run(marketplaceId, runId);
    await this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { status: string }[]
      >`SELECT status FROM agent_runs WHERE id=${runId}::uuid AND "marketplaceId"=${marketplaceId}::uuid FOR UPDATE`;
      if (!rows.length || !isActiveRunStatus(rows[0].status)) {
        return;
      }
      const immediate = rows[0].status !== "RUNNING";
      await tx.agentRun.update({
        where: { id: runId },
        data: {
          cancelRequestedAt: new Date(),
          ...(immediate
            ? {
                status: "CANCELLED",
                finishedAt: new Date(),
                modelTokenHash: null,
              }
            : {}),
        },
      });
      if (immediate) {
        await appendRunEvent(tx, {
          marketplaceId,
          runId,
          type: "run.cancelled",
          payload: {},
        });
      }
    });
    return this.run(marketplaceId, runId);
  }
  async usageForRun(marketplaceId: string, runId: string) {
    await this.run(marketplaceId, runId);
    const rows = await this.db.agentUsage.groupBy({
      by: ["provider", "model"],
      where: { marketplaceId, runId },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cachedInputTokens: true,
        costMicros: true,
      },
    });
    return rows.map((row) => ({
      provider: row.provider,
      model: row.model,
      inputTokens: (row._sum.inputTokens ?? 0n).toString(),
      outputTokens: (row._sum.outputTokens ?? 0n).toString(),
      cachedInputTokens: (row._sum.cachedInputTokens ?? 0n).toString(),
      costMicros: row._sum.costMicros?.toString() ?? null,
    }));
  }
  private replay(
    row: Run & { triggerMessage: { content: Prisma.JsonValue } },
    input: {
      conversationId: string;
      themeId?: string;
      mode: AgentMode;
      prompt: string;
      context?: RunContext;
      attachmentIds?: string[];
    },
  ) {
    const content = row.triggerMessage.content as {
      text?: string;
      context?: unknown;
    };
    if (
      row.conversationId !== input.conversationId ||
      row.themeId !== (input.themeId ?? null) ||
      row.mode !== input.mode ||
      content.text !== input.prompt ||
      JSON.stringify(content.context ?? null) !==
        JSON.stringify(input.context ?? null) ||
      JSON.stringify([...row.attachmentIds].sort()) !==
        JSON.stringify([...new Set(input.attachmentIds ?? [])].sort())
    ) {
      throw new StateConflictError(
        "Idempotency key belongs to a different request",
      );
    }
    const { triggerMessage: _message, ...run } = row;
    return run;
  }
}
