import { createHash } from "node:crypto";
import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { PerplexityService } from "@/clients/perplexity/perplexity.service";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { ManagedJobsService } from "@/modules/jobs/services/managed-jobs.service";
import { Injectable, Logger } from "@nestjs/common";
import { JobType, PromptStatus } from "@prisma/client";
import { graph } from "./monitoring.graph";
import type { StateType } from "./monitoring.state";
import { MonitoringRunPersistenceService } from "./services/monitoring-run-persistence.service";

const DEDUPE_PREFIX = "monitoring";

function startOfUtcDay(value: Date): Date {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function formatDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class MonitoringWorkflow {
  private readonly logger = new Logger(MonitoringWorkflow.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly managedJobs: ManagedJobsService,
    private readonly anthropic: AnthropicService,
    private readonly dataForSeo: DataForSeoService,
    private readonly groq: GroqService,
    private readonly openai: OpenAIService,
    private readonly perplexity: PerplexityService,
    private readonly monitoringRunPersistence: MonitoringRunPersistenceService,
  ) {}

  async run(
    businessId: string,
    promptIds?: string[],
    runDate = startOfUtcDay(new Date()),
  ) {
    const date = startOfUtcDay(runDate);
    const dedupeKey = this.buildDedupeKey(date, promptIds);

    return this.managedJobs.runManagedBusinessJob({
      type: JobType.MONITORING,
      businessId,
      dedupeKey,
      execute: async () => {
        const initialState = await this.buildInitialState(
          businessId,
          date,
          promptIds,
        );

        if (initialState.prompts.length === 0) {
          this.logger.log(
            `Skipping monitoring for businessId=${businessId}; no active prompts matched the requested subset`,
          );

          return {
            date: formatDateKey(date),
            promptCount: 0,
            responseCount: 0,
            failureCount: 0,
            promptMetricCount: 0,
            businessMetricCount: 0,
          };
        }

        this.logger.log(
          `Starting monitoring for businessId=${businessId} date=${formatDateKey(date)} promptCount=${initialState.prompts.length}`,
        );

        const result = await graph.invoke(initialState, {
          configurable: {
            anthropic: this.anthropic,
            dataForSeo: this.dataForSeo,
            groq: this.groq,
            openai: this.openai,
            perplexity: this.perplexity,
            logger: this.logger,
          },
        });

        const persisted = await this.monitoringRunPersistence.persist(result);

        this.logger.log(
          `Completed monitoring for businessId=${businessId} date=${formatDateKey(date)} promptCount=${initialState.prompts.length} responseCount=${result.engineResponses.length} failureCount=${result.engineFailures.length} promptMetricCount=${result.promptMetrics.length} businessMetricCount=${persisted.businessMetricCount}`,
        );

        return {
          date: formatDateKey(date),
          promptCount: result.prompts.length,
          responseCount: result.engineResponses.length,
          failureCount: result.engineFailures.length,
          promptMetricCount: result.promptMetrics.length,
          businessMetricCount: persisted.businessMetricCount,
        };
      },
      serializeResult: (result) => result,
    });
  }

  private buildDedupeKey(date: Date, promptIds?: string[]): string {
    const normalizedPromptIds =
      promptIds && promptIds.length > 0
        ? [...new Set(promptIds)].sort().join(",")
        : "all-active-prompts";
    const digest = createHash("sha256")
      .update(normalizedPromptIds)
      .digest("hex")
      .slice(0, 16);

    return `${DEDUPE_PREFIX}:${formatDateKey(date)}:${digest}`;
  }

  private async buildInitialState(
    businessId: string,
    date: Date,
    promptIds?: string[],
  ): Promise<StateType> {
    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      include: {
        competitors: {
          orderBy: { createdAt: "asc" },
        },
        prompts: {
          where: {
            status: PromptStatus.ACTIVE,
            ...(promptIds?.length ? { id: { in: promptIds } } : {}),
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return {
      prompts: business.prompts.map((prompt) => ({
        promptId: prompt.id,
        text: prompt.text,
      })),
      competitors: business.competitors.map((competitor) => ({
        id: competitor.id,
        domain: competitor.domain,
        name: competitor.name,
      })),
      profile: {
        businessId: business.id,
        name: business.name,
        category: business.category ?? "",
        description: business.description ?? "",
        icp: business.icp ?? "",
        domain: business.domain,
      },
      date,
      engineResponses: [],
      engineFailures: [],
      promptMetrics: [],
    };
  }
}
