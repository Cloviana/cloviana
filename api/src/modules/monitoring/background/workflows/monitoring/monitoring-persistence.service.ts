// Converts and persists a completed monitoring run in one transaction.
import { randomUUID } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  normalizeDomain,
  normalizeHostname,
} from "@/common/utils/normalize-domain.util";
import { Injectable } from "@nestjs/common";
import {
  Prisma,
  PromptResponseStatus,
  PromptRunStatus,
  PromptStatus,
} from "@prisma/client";
import { computeBusinessMetrics } from "./monitoring.metrics";
import {
  type MonitoringEngineFailure,
  type MonitoringEngineResponse,
  type MonitoringMetricResponse,
  type MonitoringRunResult,
} from "./monitoring.types";

const TRANSACTION_MAX_WAIT_MS = 30_000;
const TRANSACTION_TIMEOUT_MS = 120_000;

interface MonitoringPersistenceRecords {
  promptRuns: Prisma.PromptRunCreateManyInput[];
  promptResponses: Prisma.PromptResponseCreateManyInput[];
  mentions: Prisma.MentionCreateManyInput[];
  citations: Prisma.CitationCreateManyInput[];
  fanOutQueries: Prisma.FanOutQueryCreateManyInput[];
}

interface EngineOutcome {
  response?: MonitoringEngineResponse;
  failure?: MonitoringEngineFailure;
}

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function buildMonitoringPersistenceRecords(
  runResult: MonitoringRunResult,
  completedAt: Date,
): MonitoringPersistenceRecords {
  const brandNameByDomain = new Map<string, string>();
  const competitorIdByDomain = new Map<string, string>();
  const promptRuns: Prisma.PromptRunCreateManyInput[] = [];
  const promptResponses: Prisma.PromptResponseCreateManyInput[] = [];
  const mentions: Prisma.MentionCreateManyInput[] = [];
  const citations: Prisma.CitationCreateManyInput[] = [];
  const fanOutQueries: Prisma.FanOutQueryCreateManyInput[] = [];

  const businessDomain =
    normalizeDomain(runResult.profile.domain) ?? runResult.profile.domain;
  brandNameByDomain.set(
    businessDomain,
    runResult.profile.name || runResult.profile.domain,
  );

  for (const competitor of runResult.competitors) {
    const domain = normalizeDomain(competitor.domain) ?? competitor.domain;
    brandNameByDomain.set(domain, competitor.name || competitor.domain);
    competitorIdByDomain.set(domain, competitor.id);
  }

  for (const prompt of runResult.prompts) {
    const successfulResponses = runResult.engineResponses.filter(
      (response) => response.promptId === prompt.id,
    );
    const failedResponses = runResult.engineFailures.filter(
      (failure) => failure.promptId === prompt.id,
    );
    if (successfulResponses.length === 0 && failedResponses.length === 0) {
      continue;
    }

    const promptRunId = randomUUID();

    promptRuns.push({
      id: promptRunId,
      promptId: prompt.id,
      status:
        successfulResponses.length > 0
          ? PromptRunStatus.COMPLETED
          : PromptRunStatus.FAILED,
      completedAt,
      createdAt: completedAt,
    });

    const engineOutcomes: EngineOutcome[] = [
      ...successfulResponses.map((response) => ({ response })),
      ...failedResponses.map((failure) => ({ failure })),
    ];

    for (const { response, failure } of engineOutcomes) {
      const engine = response?.engine ?? failure?.engine;
      if (!engine) {
        continue;
      }

      const promptResponseId = randomUUID();
      promptResponses.push({
        id: promptResponseId,
        promptRunId,
        promptId: prompt.id,
        engine,
        text: response?.content ?? null,
        status: response
          ? PromptResponseStatus.SUCCESS
          : PromptResponseStatus.FAILED,
        error: response
          ? null
          : (failure?.errorMessage ?? "Unknown engine failure"),
        createdAt: completedAt,
      });

      if (!response) {
        continue;
      }

      for (const [index, mention] of response.mentions.entries()) {
        const domain = normalizeDomain(mention.domain) ?? mention.domain;
        mentions.push({
          id: randomUUID(),
          promptResponseId,
          name: brandNameByDomain.get(domain) ?? mention.domain,
          domain,
          position: index + 1,
          competitorId: competitorIdByDomain.get(domain) ?? null,
        });
      }

      for (const [index, citation] of response.citations.entries()) {
        if (!isHttpUrl(citation.url)) {
          continue;
        }

        citations.push({
          id: randomUUID(),
          promptResponseId,
          url: citation.url,
          domain: normalizeHostname(citation.url) ?? citation.url,
          title: citation.title,
          position: index + 1,
        });
      }

      for (const fanOutQuery of response.fanOutQueries) {
        fanOutQueries.push({
          id: randomUUID(),
          promptResponseId,
          query: fanOutQuery.query,
          inferred: fanOutQuery.inferred,
        });
      }
    }
  }

  return {
    promptRuns,
    promptResponses,
    mentions,
    citations,
    fanOutQueries,
  };
}

@Injectable()
export class MonitoringPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async persistRun(
    runResult: MonitoringRunResult,
  ): Promise<{ businessMetricCount: number }> {
    const completedAt = new Date();
    const persistenceRecords = buildMonitoringPersistenceRecords(
      runResult,
      completedAt,
    );

    const businessMetricCount = await this.prisma.$transaction(
      async (transaction) => {
        await this.insertRecords(transaction, persistenceRecords);
        await this.clearPreviousResponseBodies(
          transaction,
          runResult,
          persistenceRecords.promptResponses,
        );
        await this.markPromptsAsRun(transaction, runResult, completedAt);
        await this.replacePromptMetrics(transaction, runResult);
        return this.replaceBusinessMetrics(transaction, runResult);
      },
      {
        maxWait: TRANSACTION_MAX_WAIT_MS,
        timeout: TRANSACTION_TIMEOUT_MS,
      },
    );

    return { businessMetricCount };
  }

  private async insertRecords(
    transaction: Prisma.TransactionClient,
    records: MonitoringPersistenceRecords,
  ): Promise<void> {
    if (records.promptRuns.length > 0) {
      await transaction.promptRun.createMany({ data: records.promptRuns });
    }
    if (records.promptResponses.length > 0) {
      await transaction.promptResponse.createMany({
        data: records.promptResponses,
      });
    }
    if (records.mentions.length > 0) {
      await transaction.mention.createMany({ data: records.mentions });
    }
    if (records.citations.length > 0) {
      await transaction.citation.createMany({ data: records.citations });
    }
    if (records.fanOutQueries.length > 0) {
      await transaction.fanOutQuery.createMany({
        data: records.fanOutQueries,
      });
    }
  }

  private async clearPreviousResponseBodies(
    transaction: Prisma.TransactionClient,
    runResult: MonitoringRunResult,
    currentResponses: Prisma.PromptResponseCreateManyInput[],
  ): Promise<void> {
    const currentResponseIds = currentResponses
      .map((response) => response.id)
      .filter((id): id is string => id !== undefined);
    if (currentResponseIds.length === 0) {
      return;
    }

    await transaction.promptResponse.updateMany({
      where: {
        promptId: { in: runResult.prompts.map((prompt) => prompt.id) },
        id: { notIn: currentResponseIds },
      },
      data: { text: null },
    });
  }

  private async markPromptsAsRun(
    transaction: Prisma.TransactionClient,
    runResult: MonitoringRunResult,
    completedAt: Date,
  ): Promise<void> {
    await transaction.prompt.updateMany({
      where: { id: { in: runResult.prompts.map((prompt) => prompt.id) } },
      data: { lastRunAt: completedAt },
    });
  }

  private async replacePromptMetrics(
    transaction: Prisma.TransactionClient,
    runResult: MonitoringRunResult,
  ): Promise<void> {
    await transaction.promptMetric.deleteMany({
      where: {
        promptId: { in: runResult.prompts.map((prompt) => prompt.id) },
        date: runResult.date,
      },
    });

    if (runResult.promptMetrics.length > 0) {
      await transaction.promptMetric.createMany({
        data: runResult.promptMetrics,
      });
    }
  }

  private async replaceBusinessMetrics(
    transaction: Prisma.TransactionClient,
    runResult: MonitoringRunResult,
  ): Promise<number> {
    await transaction.businessMetric.deleteMany({
      where: { businessId: runResult.businessId, date: runResult.date },
    });

    const snapshotResponses = await this.loadLatestBusinessResponseSnapshot(
      transaction,
      runResult.businessId,
    );
    const businessMetrics = computeBusinessMetrics(
      runResult,
      snapshotResponses,
    );
    if (businessMetrics.length > 0) {
      await transaction.businessMetric.createMany({ data: businessMetrics });
    }

    return businessMetrics.length;
  }

  private async loadLatestBusinessResponseSnapshot(
    transaction: Prisma.TransactionClient,
    businessId: string,
  ): Promise<MonitoringMetricResponse[]> {
    const storedResponses = await transaction.promptResponse.findMany({
      where: {
        status: PromptResponseStatus.SUCCESS,
        prompt: { businessId, status: PromptStatus.ACTIVE },
      },
      include: {
        mentions: true,
        citations: true,
        prompt: { select: { awarenessStage: true } },
      },
      orderBy: [
        { promptId: "asc" },
        { engine: "asc" },
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });

    const seenPromptEngines = new Set<string>();
    const latestResponses: MonitoringMetricResponse[] = [];
    for (const response of storedResponses) {
      const promptEngineKey = `${response.promptId}:${response.engine}`;
      if (seenPromptEngines.has(promptEngineKey)) {
        continue;
      }

      seenPromptEngines.add(promptEngineKey);
      latestResponses.push({
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

    return latestResponses;
  }
}
