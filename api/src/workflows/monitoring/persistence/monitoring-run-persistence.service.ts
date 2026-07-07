// Writes a finished monitoring run to the database in one transaction:
// insert this run's records, blank out old response bodies (we only keep
// the latest response text per prompt), then replace today's metrics.
import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { Prisma, PromptResponseStatus, PromptStatus } from "@prisma/client";
import { RESPONSES_PER_PROMPT_PER_ENGINE } from "../monitoring.constants";
import type { MonitoringState } from "../monitoring.state";
import type { MetricResponse } from "../monitoring.types";
import { computeBusinessMetrics } from "../metrics/monitoring-metric-calculator";
import {
  type MonitoringPersistenceRecords,
  buildMonitoringPersistenceRecords,
} from "./monitoring-persistence-records";

const TRANSACTION_MAX_WAIT_MS = 30_000;
const TRANSACTION_TIMEOUT_MS = 120_000;

@Injectable()
export class MonitoringRunPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async persist(
    result: MonitoringState,
  ): Promise<{ businessMetricCount: number }> {
    const finishedAt = new Date();
    const records = buildMonitoringPersistenceRecords(result, finishedAt);

    const businessMetricCount = await this.prisma.$transaction(
      async (tx) => {
        await this.insertRunRecords(tx, records);
        await this.clearPreviousResponseBodies(
          tx,
          result,
          records.promptResponses,
        );
        await this.markPromptsRun(tx, result, finishedAt);
        await this.replacePromptMetrics(tx, result);

        return this.replaceBusinessMetrics(tx, result);
      },
      {
        maxWait: TRANSACTION_MAX_WAIT_MS,
        timeout: TRANSACTION_TIMEOUT_MS,
      },
    );

    return { businessMetricCount };
  }

  private async insertRunRecords(
    tx: Prisma.TransactionClient,
    records: MonitoringPersistenceRecords,
  ): Promise<void> {
    if (records.promptRuns.length > 0) {
      await tx.promptRun.createMany({ data: records.promptRuns });
    }
    if (records.promptResponses.length > 0) {
      await tx.promptResponse.createMany({ data: records.promptResponses });
    }
    if (records.mentions.length > 0) {
      await tx.mention.createMany({ data: records.mentions });
    }
    if (records.citations.length > 0) {
      await tx.citation.createMany({ data: records.citations });
    }
    if (records.fanOutQueries.length > 0) {
      await tx.fanOutQuery.createMany({ data: records.fanOutQueries });
    }
  }

  private async clearPreviousResponseBodies(
    tx: Prisma.TransactionClient,
    result: MonitoringState,
    currentResponses: Prisma.PromptResponseCreateManyInput[],
  ): Promise<void> {
    const currentResponseIds = currentResponses
      .map((response) => response.id)
      .filter((id): id is string => id !== undefined);
    if (currentResponseIds.length === 0) return;

    await tx.promptResponse.updateMany({
      where: {
        promptId: { in: result.prompts.map((prompt) => prompt.id) },
        id: { notIn: currentResponseIds },
      },
      data: { text: null },
    });
  }

  private async markPromptsRun(
    tx: Prisma.TransactionClient,
    result: MonitoringState,
    finishedAt: Date,
  ): Promise<void> {
    if (result.prompts.length === 0) return;

    await tx.prompt.updateMany({
      where: {
        id: { in: result.prompts.map((prompt) => prompt.id) },
      },
      data: { lastRunAt: finishedAt },
    });
  }

  private async replacePromptMetrics(
    tx: Prisma.TransactionClient,
    result: MonitoringState,
  ): Promise<void> {
    await tx.promptMetric.deleteMany({
      where: {
        promptId: { in: result.prompts.map((prompt) => prompt.id) },
        date: result.date,
      },
    });

    if (result.promptMetrics.length > 0) {
      await tx.promptMetric.createMany({ data: result.promptMetrics });
    }
  }

  private async replaceBusinessMetrics(
    tx: Prisma.TransactionClient,
    result: MonitoringState,
  ): Promise<number> {
    await tx.businessMetric.deleteMany({
      where: {
        businessId: result.businessId,
        date: result.date,
      },
    });

    const snapshotResponses = await this.loadLatestBusinessResponseSnapshot(
      tx,
      result.businessId,
    );
    const businessMetrics = computeBusinessMetrics(result, snapshotResponses);

    if (businessMetrics.length > 0) {
      await tx.businessMetric.createMany({ data: businessMetrics });
    }

    return businessMetrics.length;
  }

  private async loadLatestBusinessResponseSnapshot(
    tx: Prisma.TransactionClient,
    businessId: string,
  ): Promise<MetricResponse[]> {
    const responses = await tx.promptResponse.findMany({
      where: {
        status: PromptResponseStatus.SUCCESS,
        prompt: {
          businessId,
          status: PromptStatus.ACTIVE,
        },
      },
      include: {
        mentions: true,
        citations: true,
        prompt: {
          select: {
            awarenessStage: true,
          },
        },
      },
      orderBy: [
        { promptId: "asc" },
        { engine: "asc" },
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });

    const responseCountByPromptAndEngine = new Map<string, number>();
    const snapshot: MetricResponse[] = [];

    for (const response of responses) {
      const key = `${response.promptId}:${response.engine}`;
      const responseCount = responseCountByPromptAndEngine.get(key) ?? 0;

      if (responseCount >= RESPONSES_PER_PROMPT_PER_ENGINE) continue;

      responseCountByPromptAndEngine.set(key, responseCount + 1);
      snapshot.push({
        engine: response.engine,
        promptId: response.promptId,
        awarenessStage: response.prompt.awarenessStage,
        mentions: response.mentions.map(({ domain }) => ({ domain })),
        citations: response.citations.map(({ url, title }) => ({
          url,
          title: title ?? "",
        })),
      });
    }

    return snapshot;
  }
}
