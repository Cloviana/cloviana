import { randomUUID } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  normalizeDomain,
  normalizeHostname,
} from "@/common/utils/normalize-domain.util";
import { Injectable } from "@nestjs/common";
import {
  AiEngine,
  Prisma,
  PromptResponseStatus,
  PromptRunStatus,
  PromptStatus,
} from "@prisma/client";
import { computeBusinessMetrics } from "../monitoring-metric-calculator";
import { RESPONSES_PER_PROMPT_PER_ENGINE } from "../monitoring.constants";
import type { StateType } from "../monitoring.state";
import type {
  EngineFailure,
  EngineResponse,
  MetricResponse,
} from "../monitoring.types";

const TRANSACTION_MAX_WAIT_MS = 10000;
const TRANSACTION_TIMEOUT_MS = 20000;
function toAiEngine(
  engine: EngineResponse["engine"] | EngineFailure["engine"],
): AiEngine {
  switch (engine) {
    case "google-aio":
      return AiEngine.AI_OVERVIEWS;
    case "perplexity":
      return AiEngine.PERPLEXITY;
    case "claude":
      return AiEngine.CLAUDE;
    case "chatgpt":
      return AiEngine.CHATGPT;
  }
}

@Injectable()
export class MonitoringRunPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async persist(result: StateType): Promise<{ businessMetricCount: number }> {
    const finishedAt = new Date();
    const promptNameByDomain = new Map<string, string>();
    const competitorByDomain = new Map<string, string>();

    const promptRuns: Prisma.PromptRunCreateManyInput[] = [];
    const promptResponses: Prisma.PromptResponseCreateManyInput[] = [];
    const mentions: Prisma.MentionCreateManyInput[] = [];
    const citations: Prisma.CitationCreateManyInput[] = [];
    const fanOutQueries: Prisma.FanOutQueryCreateManyInput[] = [];
    let timestampOffset = 0;

    promptNameByDomain.set(
      normalizeDomain(result.profile.domain) ?? result.profile.domain,
      result.profile.name || result.profile.domain,
    );

    for (const competitor of result.competitors) {
      const normalizedDomain =
        normalizeDomain(competitor.domain) ?? competitor.domain;
      promptNameByDomain.set(
        normalizedDomain,
        competitor.name || competitor.domain,
      );
      competitorByDomain.set(normalizedDomain, competitor.id);
    }

    for (const response of result.engineResponses) {
      const promptRunId = randomUUID();
      const promptResponseId = randomUUID();
      const createdAt = new Date(finishedAt.getTime() + timestampOffset);
      timestampOffset += 1;

      promptRuns.push({
        id: promptRunId,
        promptId: response.promptId,
        status: PromptRunStatus.COMPLETED,
        completedAt: finishedAt,
        createdAt,
      });

      promptResponses.push({
        id: promptResponseId,
        promptRunId,
        promptId: response.promptId,
        engine: toAiEngine(response.engine),
        text: response.content,
        status: PromptResponseStatus.SUCCESS,
        createdAt,
      });

      for (const [index, mention] of response.mentions.entries()) {
        const normalizedDomain =
          normalizeDomain(mention.domain) ?? mention.domain;

        mentions.push({
          id: randomUUID(),
          promptResponseId,
          name: promptNameByDomain.get(normalizedDomain) ?? mention.domain,
          domain: normalizedDomain,
          position: index + 1,
          competitorId: competitorByDomain.get(normalizedDomain) ?? null,
        });
      }

      for (const [index, citation] of response.citations.entries()) {
        citations.push({
          id: randomUUID(),
          promptResponseId,
          url: citation.url,
          domain: normalizeHostname(citation.url) ?? citation.url,
          title: citation.title,
          position: index + 1,
        });
      }

      for (const query of response.fanOutQueries) {
        fanOutQueries.push({
          id: randomUUID(),
          promptResponseId,
          query,
        });
      }
    }

    for (const failure of result.engineFailures) {
      const promptRunId = randomUUID();
      const promptResponseId = randomUUID();
      const createdAt = new Date(finishedAt.getTime() + timestampOffset);
      timestampOffset += 1;

      promptRuns.push({
        id: promptRunId,
        promptId: failure.promptId,
        status: PromptRunStatus.FAILED,
        completedAt: finishedAt,
        createdAt,
      });

      promptResponses.push({
        id: promptResponseId,
        promptRunId,
        promptId: failure.promptId,
        engine: toAiEngine(failure.engine),
        text: null,
        status: PromptResponseStatus.FAILED,
        error: failure.error,
        createdAt,
      });
    }

    const businessMetricCount = await this.prisma.$transaction(
      async (tx) => {
        if (promptRuns.length > 0) {
          await tx.promptRun.createMany({ data: promptRuns });
        }

        if (promptResponses.length > 0) {
          await tx.promptResponse.createMany({ data: promptResponses });
        }

        if (mentions.length > 0) {
          await tx.mention.createMany({ data: mentions });
        }

        if (citations.length > 0) {
          await tx.citation.createMany({ data: citations });
        }

        if (fanOutQueries.length > 0) {
          await tx.fanOutQuery.createMany({ data: fanOutQueries });
        }

        if (result.prompts.length > 0) {
          await tx.prompt.updateMany({
            where: {
              id: { in: result.prompts.map((prompt) => prompt.id) },
            },
            data: { lastRunAt: finishedAt },
          });
        }

        await tx.promptMetric.deleteMany({
          where: {
            promptId: { in: result.prompts.map((prompt) => prompt.id) },
            date: result.date,
          },
        });

        if (result.promptMetrics.length > 0) {
          await tx.promptMetric.createMany({
            data: result.promptMetrics,
          });
        }

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
        const businessMetrics = computeBusinessMetrics(
          result,
          snapshotResponses,
        );

        if (businessMetrics.length > 0) {
          await tx.businessMetric.createMany({
            data: businessMetrics,
          });
        }

        return businessMetrics.length;
      },
      {
        maxWait: TRANSACTION_MAX_WAIT_MS,
        timeout: TRANSACTION_TIMEOUT_MS,
      },
    );

    return { businessMetricCount };
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
      },
      orderBy: [
        { promptId: "asc" },
        { engine: "asc" },
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });

    const latestCountByPromptAndEngine = new Map<string, number>();
    const snapshot: MetricResponse[] = [];

    for (const response of responses) {
      const key = `${response.promptId}:${response.engine}`;
      const count = latestCountByPromptAndEngine.get(key) ?? 0;

      if (count >= RESPONSES_PER_PROMPT_PER_ENGINE) {
        continue;
      }

      latestCountByPromptAndEngine.set(key, count + 1);
      snapshot.push({
        engine: response.engine,
        promptId: response.promptId,
        mentions: response.mentions.map((mention) => ({
          domain: mention.domain,
        })),
        citations: response.citations.map((citation) => ({
          url: citation.url,
          title: citation.title ?? "",
        })),
      });
    }

    return snapshot;
  }
}
