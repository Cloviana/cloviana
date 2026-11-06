import { PrismaService } from "@/platform/database/prisma/prisma.service";
import { StateConflictError } from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { AgentModelAccess } from "../../application/ports/agent-model-access.port";
import {
  MAX_CODING_MODEL_REQUESTS,
  MODEL_TOKEN_HEARTBEAT_MAX_AGE_MS,
  RUN_TIMEOUT_MS,
} from "../../domain/agent.policy";
import type { AgentUsageInput } from "../../domain/agent.types";
import type { Run } from "../../domain/agent.types";

@Injectable()
export class PrismaAgentModelAccess extends AgentModelAccess {
  async revokeModelToken(run: Run, workerToken: string) {
    await this.db.agentRun.updateMany({
      where: { id: run.id, marketplaceId: run.marketplaceId, workerToken },
      data: { modelTokenHash: null },
    });
  }
  constructor(private readonly db: PrismaService) {
    super();
  }
  async recordModel(run: Run, workerToken: string, model: string) {
    const result = await this.db.agentRun.updateMany({
      where: {
        id: run.id,
        marketplaceId: run.marketplaceId,
        workerToken,
        status: "RUNNING",
        cancelRequestedAt: null,
      },
      data: { modelProvider: "openrouter", modelName: model },
    });
    if (!result.count) {
      throw new StateConflictError("Run is no longer active");
    }
  }
  async issueModelToken(run: Run, workerToken: string, hash: string) {
    const { count } = await this.db.agentRun.updateMany({
      where: {
        id: run.id,
        marketplaceId: run.marketplaceId,
        workerToken,
        status: "RUNNING",
        cancelRequestedAt: null,
      },
      data: { modelTokenHash: hash },
    });
    if (!count) {
      throw new StateConflictError("Run is no longer active");
    }
  }
  async authorizeModelRequest(runId: string, hash: string) {
    const { count } = await this.db.agentRun.updateMany({
      where: {
        id: runId,
        modelTokenHash: hash,
        status: "RUNNING",
        cancelRequestedAt: null,
        heartbeatAt: {
          gt: new Date(Date.now() - MODEL_TOKEN_HEARTBEAT_MAX_AGE_MS),
        },
        startedAt: { gt: new Date(Date.now() - RUN_TIMEOUT_MS) },
        modelRequestCount: { lt: MAX_CODING_MODEL_REQUESTS },
      },
      data: { modelRequestCount: { increment: 1 } },
    });
    return count > 0;
  }
  async usage(run: Run, workerToken: string, input: AgentUsageInput) {
    const values = [
      input.inputTokens,
      input.outputTokens,
      input.cachedInputTokens,
      input.costMicros,
    ];
    if (
      values.some(
        (value) =>
          value !== undefined &&
          (!Number.isFinite(value) ||
            value < 0 ||
            value > Number.MAX_SAFE_INTEGER),
      )
    ) {
      return;
    }
    if (
      !(await this.db.agentRun.count({
        where: {
          id: run.id,
          marketplaceId: run.marketplaceId,
          workerToken,
          status: "RUNNING",
        },
      }))
    ) {
      return;
    }
    const integer = (value: number) => BigInt(Math.max(0, Math.round(value)));
    await this.db.agentUsage.create({
      data: {
        marketplaceId: run.marketplaceId,
        runId: run.id,
        provider: input.provider,
        model: input.model,
        inputTokens: integer(input.inputTokens),
        outputTokens: integer(input.outputTokens),
        cachedInputTokens:
          input.cachedInputTokens === undefined
            ? undefined
            : integer(input.cachedInputTokens),
        costMicros:
          input.costMicros === undefined
            ? undefined
            : integer(input.costMicros),
      },
    });
  }
}
