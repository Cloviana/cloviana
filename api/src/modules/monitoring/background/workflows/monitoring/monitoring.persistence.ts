// Converts and persists a completed monitoring run in one transaction.
import { randomUUID } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  normalizeDomain,
  normalizeHostname,
} from "@/common/utils/normalize-domain.util";
import {
  Prisma,
  PromptResponseStatus,
  PromptRunStatus,
  PromptStatus,
} from "@prisma/client";
import { computeBusinessMetrics } from "./monitoring.metrics";
import {
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
  sentimentClaims: Prisma.SentimentClaimCreateManyInput[];
  sentimentEvidences: Prisma.SentimentEvidenceCreateManyInput[];
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
  const brandIdByDomain = new Map<string, string>();
  const promptRuns: Prisma.PromptRunCreateManyInput[] = [];
  const promptResponses: Prisma.PromptResponseCreateManyInput[] = [];
  const mentions: Prisma.MentionCreateManyInput[] = [];
  const citations: Prisma.CitationCreateManyInput[] = [];
  const fanOutQueries: Prisma.FanOutQueryCreateManyInput[] = [];
  const sentimentClaims: Prisma.SentimentClaimCreateManyInput[] = [];
  const sentimentEvidences: Prisma.SentimentEvidenceCreateManyInput[] = [];

  for (const brand of runResult.brands) {
    const domain = normalizeDomain(brand.domain) ?? brand.domain;
    brandNameByDomain.set(domain, brand.name || brand.domain);
    brandIdByDomain.set(domain, brand.id);
  }

  for (const prompt of runResult.prompts) {
    const successfulResponses = runResult.engineResponses.filter(
      (response) => response.promptId === prompt.id,
    );
    if (successfulResponses.length === 0) {
      continue;
    }

    const promptRunId = randomUUID();

    promptRuns.push({
      id: promptRunId,
      promptId: prompt.id,
      status: PromptRunStatus.COMPLETED,
      completedAt,
      createdAt: completedAt,
    });

    for (const response of successfulResponses) {
      const promptResponseId = randomUUID();
      promptResponses.push({
        id: promptResponseId,
        promptRunId,
        engine: response.engine,
        text: response.content,
        webSearch: response.webSearch,
        status: PromptResponseStatus.SUCCESS,
        error: null,
        createdAt: completedAt,
      });

      for (const mention of response.mentions) {
        const domain = normalizeDomain(mention.domain) ?? mention.domain;
        const brandId = brandIdByDomain.get(domain);
        if (!brandId) {
          // Extraction only ever returns domains from the monitored brand
          // list, so this means that list and the persisted brands diverged.
          throw new Error(
            `No monitored brand found for mentioned domain "${domain}"`,
          );
        }

        mentions.push({
          id: randomUUID(),
          promptResponseId,
          name: brandNameByDomain.get(domain) ?? mention.domain,
          domain,
          order: mention.position,
          brandId,
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
          canonicalUrl: citation.canonicalUrl,
          domain: normalizeHostname(citation.url) ?? citation.url,
          title: citation.title,
          urlType: citation.urlType,
          domainType: citation.domainType,
          order: index + 1,
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

      for (const claim of response.sentimentClaims) {
        const claimBrandId = brandIdByDomain.get(
          normalizeDomain(claim.brandDomain) ?? claim.brandDomain,
        );
        if (!claimBrandId) {
          continue;
        }

        const sentimentClaimId = randomUUID();
        sentimentClaims.push({
          id: sentimentClaimId,
          promptResponseId,
          brandId: claimBrandId,
          label: claim.label,
          sentiment: claim.sentiment,
          createdAt: completedAt,
        });

        for (const evidence of claim.evidences) {
          sentimentEvidences.push({
            id: randomUUID(),
            sentimentClaimId,
            startOffset: evidence.startOffset,
            endOffset: evidence.endOffset,
          });
        }
      }
    }
  }

  return {
    promptRuns,
    promptResponses,
    mentions,
    citations,
    fanOutQueries,
    sentimentClaims,
    sentimentEvidences,
  };
}

async function insertRecords(
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
  if (records.sentimentClaims.length > 0) {
    await transaction.sentimentClaim.createMany({
      data: records.sentimentClaims,
    });
  }
  if (records.sentimentEvidences.length > 0) {
    await transaction.sentimentEvidence.createMany({
      data: records.sentimentEvidences,
    });
  }
}

function successfulPromptIds(runResult: MonitoringRunResult): string[] {
  return Array.from(
    new Set(runResult.engineResponses.map((response) => response.promptId)),
  );
}

async function markPromptsAsRun(
  transaction: Prisma.TransactionClient,
  runResult: MonitoringRunResult,
  completedAt: Date,
): Promise<void> {
  const promptIds = successfulPromptIds(runResult);
  if (promptIds.length === 0) {
    return;
  }

  await transaction.prompt.updateMany({
    where: { id: { in: promptIds } },
    data: { lastRunAt: completedAt },
  });
}

async function replacePromptMetrics(
  transaction: Prisma.TransactionClient,
  runResult: MonitoringRunResult,
): Promise<void> {
  const promptIds = successfulPromptIds(runResult);
  if (promptIds.length === 0) {
    return;
  }

  await transaction.promptMetric.deleteMany({
    where: {
      promptId: { in: promptIds },
      date: runResult.date,
    },
  });

  if (runResult.promptMetrics.length > 0) {
    await transaction.promptMetric.createMany({
      data: runResult.promptMetrics,
    });
  }
}

async function loadLatestBusinessResponseSnapshot(
  transaction: Prisma.TransactionClient,
  businessId: string,
): Promise<MonitoringMetricResponse[]> {
  const storedResponses = await transaction.promptResponse.findMany({
    where: {
      status: PromptResponseStatus.SUCCESS,
      promptRun: {
        prompt: { businessId, status: PromptStatus.ACTIVE },
      },
    },
    include: {
      mentions: true,
      citations: true,
      sentimentClaims: {
        select: { sentiment: true, brand: { select: { domain: true } } },
      },
      promptRun: {
        select: {
          promptId: true,
          prompt: { select: { awarenessStage: true } },
        },
      },
    },
    orderBy: [
      { promptRun: { promptId: "asc" } },
      { engine: "asc" },
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });

  const seenPromptEngines = new Set<string>();
  const latestResponses: MonitoringMetricResponse[] = [];
  for (const response of storedResponses) {
    const promptId = response.promptRun.promptId;
    const promptEngineKey = `${promptId}:${response.engine}`;
    if (seenPromptEngines.has(promptEngineKey)) {
      continue;
    }

    seenPromptEngines.add(promptEngineKey);
    latestResponses.push({
      engine: response.engine,
      promptId,
      awarenessStage: response.promptRun.prompt.awarenessStage,
      mentions: response.mentions.map(({ domain }) => ({ domain })),
      sentimentClaims: response.sentimentClaims.map(({ sentiment, brand }) => ({
        sentiment,
        brandDomain: brand?.domain ?? null,
      })),
      citations: response.citations.map(({ url, title }) => ({
        url,
        title: title ?? "",
      })),
    });
  }

  return latestResponses;
}

async function replaceBusinessMetrics(
  transaction: Prisma.TransactionClient,
  runResult: MonitoringRunResult,
): Promise<number> {
  await transaction.businessMetric.deleteMany({
    where: { businessId: runResult.businessId, date: runResult.date },
  });

  const snapshotResponses = await loadLatestBusinessResponseSnapshot(
    transaction,
    runResult.businessId,
  );
  const businessMetrics = computeBusinessMetrics(runResult, snapshotResponses);
  if (businessMetrics.length > 0) {
    await transaction.businessMetric.createMany({ data: businessMetrics });
  }

  return businessMetrics.length;
}

export async function persistMonitoringRun(
  prisma: PrismaService,
  runResult: MonitoringRunResult,
): Promise<{ businessMetricCount: number }> {
  const completedAt = new Date();
  const records = buildMonitoringPersistenceRecords(runResult, completedAt);

  const businessMetricCount = await prisma.$transaction(
    async (transaction) => {
      await insertRecords(transaction, records);
      await markPromptsAsRun(transaction, runResult, completedAt);
      await replacePromptMetrics(transaction, runResult);
      return replaceBusinessMetrics(transaction, runResult);
    },
    {
      maxWait: TRANSACTION_MAX_WAIT_MS,
      timeout: TRANSACTION_TIMEOUT_MS,
    },
  );

  return { businessMetricCount };
}
