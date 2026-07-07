// Turns a finished monitoring run (graph state) into the Prisma
// createMany() payloads for a run's tables. Pure transform, no DB access —
// MonitoringRunPersistenceService is what actually writes these out.
import { randomUUID } from "node:crypto";
import {
  normalizeDomain,
  normalizeHostname,
} from "@/common/utils/normalize-domain.util";
import { Prisma, PromptResponseStatus, PromptRunStatus } from "@prisma/client";
import { RESPONSES_PER_PROMPT_PER_ENGINE } from "../monitoring.constants";
import type { MonitoringState } from "../monitoring.state";
import { MONITORING_ENGINES } from "../monitoring.types";
import { toAiEngine } from "../engines/ai-engine-map";

export type MonitoringPersistenceRecords = {
  promptRuns: Prisma.PromptRunCreateManyInput[];
  promptResponses: Prisma.PromptResponseCreateManyInput[];
  mentions: Prisma.MentionCreateManyInput[];
  citations: Prisma.CitationCreateManyInput[];
  fanOutQueries: Prisma.FanOutQueryCreateManyInput[];
};

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function buildMonitoringPersistenceRecords(
  result: MonitoringState,
  finishedAt: Date,
): MonitoringPersistenceRecords {
  const brandNameByDomain = new Map<string, string>();
  const competitorIdByDomain = new Map<string, string>();
  const promptRuns: Prisma.PromptRunCreateManyInput[] = [];
  const promptResponses: Prisma.PromptResponseCreateManyInput[] = [];
  const mentions: Prisma.MentionCreateManyInput[] = [];
  const citations: Prisma.CitationCreateManyInput[] = [];
  const fanOutQueries: Prisma.FanOutQueryCreateManyInput[] = [];
  let timestampOffset = 0;

  const businessDomain =
    normalizeDomain(result.profile.domain) ?? result.profile.domain;
  brandNameByDomain.set(
    businessDomain,
    result.profile.name || result.profile.domain,
  );

  for (const competitor of result.competitors) {
    const domain = normalizeDomain(competitor.domain) ?? competitor.domain;
    brandNameByDomain.set(domain, competitor.name || competitor.domain);
    competitorIdByDomain.set(domain, competitor.id);
  }

  for (const prompt of result.prompts) {
    for (
      let sampleNumber = 1;
      sampleNumber <= RESPONSES_PER_PROMPT_PER_ENGINE;
      sampleNumber += 1
    ) {
      const sampleResponses = result.engineResponses.filter(
        (response) =>
          response.promptId === prompt.id &&
          response.sampleNumber === sampleNumber,
      );
      const sampleFailures = result.engineFailures.filter(
        (failure) =>
          failure.promptId === prompt.id &&
          failure.sampleNumber === sampleNumber,
      );

      if (sampleResponses.length === 0 && sampleFailures.length === 0) {
        continue;
      }

      const responseByEngine = new Map(
        sampleResponses.map((response) => [response.engine, response]),
      );
      const failureByEngine = new Map(
        sampleFailures.map((failure) => [failure.engine, failure]),
      );
      const promptRunId = randomUUID();
      // Offset by 1ms per run so createdAt ordering matches insertion order
      // for prompts/samples that finish within the same millisecond.
      const createdAt = new Date(finishedAt.getTime() + timestampOffset);
      timestampOffset += 1;

      promptRuns.push({
        id: promptRunId,
        promptId: prompt.id,
        status:
          sampleResponses.length > 0
            ? PromptRunStatus.COMPLETED
            : PromptRunStatus.FAILED,
        completedAt: finishedAt,
        createdAt,
      });

      for (const engine of MONITORING_ENGINES) {
        const response = responseByEngine.get(engine);
        const failure = failureByEngine.get(engine);
        if (!response && !failure) continue;

        const promptResponseId = randomUUID();
        promptResponses.push({
          id: promptResponseId,
          promptRunId,
          promptId: prompt.id,
          engine: toAiEngine(engine),
          text: response?.content ?? null,
          status: response
            ? PromptResponseStatus.SUCCESS
            : PromptResponseStatus.FAILED,
          error: response ? null : (failure?.error ?? "Unknown engine failure"),
          createdAt,
        });

        if (!response) continue;

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
          if (!isHttpUrl(citation.url)) continue;

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
  }

  return {
    promptRuns,
    promptResponses,
    mentions,
    citations,
    fanOutQueries,
  };
}
