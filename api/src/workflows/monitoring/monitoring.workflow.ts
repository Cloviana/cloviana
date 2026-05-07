import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { PerplexityService } from "@/clients/perplexity/perplexity.service";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { ManagedJobsService } from "@/modules/jobs/services/managed-jobs.service";
import { Injectable, Logger } from "@nestjs/common";
import { PromptStatus } from "@prisma/client";
import { formatDateKey, startOfUtcDay } from "./utils/monitoring-job-key";
import { computePromptMetrics } from "./utils/monitoring-metric-calculator";
import { graph } from "./monitoring.graph";
import type { StateType } from "./monitoring.state";
import { MonitoringRunPersistenceService } from "./services/monitoring-run-persistence.service";

type MonitoringInitialState = Pick<
  StateType,
  "businessId" | "prompts" | "competitors" | "profile" | "date"
>;

type MonitoringRunSummary = {
  date: string;
  promptCount: number;
  responseCount: number;
  failureCount: number;
  promptMetricCount: number;
  businessMetricCount: number;
};

function buildRunSummary(
  date: Date,
  state: StateType,
  businessMetricCount: number,
): MonitoringRunSummary {
  return {
    date: formatDateKey(date),
    promptCount: state.prompts.length,
    responseCount: state.engineResponses.length,
    failureCount: state.engineFailures.length,
    promptMetricCount: state.promptMetrics.length,
    businessMetricCount,
  };
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
    jobId: string,
    businessId: string,
    promptIds?: string[],
    runDate = new Date(),
  ) {
    const date = startOfUtcDay(runDate);

    return this.managedJobs.runJob({
      jobId,
      execute: () => this.execute(businessId, date, promptIds),
      serializeResult: (result) => result,
    });
  }

  private async execute(
    businessId: string,
    date: Date,
    promptIds?: string[],
  ): Promise<MonitoringRunSummary> {
    const initialState = await this.buildInitialState(
      businessId,
      date,
      promptIds,
    );
    const dateKey = formatDateKey(date);

    if (initialState.prompts.length === 0) {
      this.logger.log(
        `[${businessId}] Skipping monitoring; no active prompts matched the requested subset`,
      );

      return {
        date: dateKey,
        promptCount: 0,
        responseCount: 0,
        failureCount: 0,
        promptMetricCount: 0,
        businessMetricCount: 0,
      };
    }

    this.logger.log(
      `[${businessId}] Starting monitoring date=${dateKey} promptCount=${initialState.prompts.length}`,
    );
    this.logger.debug(
      `[${businessId}] Monitoring graph input promptIds=${initialState.prompts.map((prompt) => prompt.id).join(",")} competitorCount=${initialState.competitors.length}`,
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
    this.logger.debug(
      `[${businessId}] Monitoring graph output responseCount=${result.engineResponses.length} failureCount=${result.engineFailures.length}`,
    );

    const finalState: StateType = {
      ...result,
      promptMetrics: computePromptMetrics(result, result.engineResponses),
    };
    this.logger.debug(
      `[${businessId}] Monitoring prompt metrics computed promptMetricCount=${finalState.promptMetrics.length}`,
    );

    const { businessMetricCount } =
      await this.monitoringRunPersistence.persist(finalState);
    this.logger.debug(
      `[${businessId}] Monitoring persistence completed businessMetricCount=${businessMetricCount}`,
    );

    const summary = buildRunSummary(date, finalState, businessMetricCount);

    this.logger.log(
      `[${businessId}] Completed monitoring ${JSON.stringify(summary)}`,
    );

    return summary;
  }

  private async buildInitialState(
    businessId: string,
    date: Date,
    promptIds?: string[],
  ): Promise<MonitoringInitialState> {
    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      include: {
        competitors: { orderBy: { createdAt: "asc" } },
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
      businessId: business.id,
      date,
      prompts: business.prompts.map(({ id, text }) => ({ id, text })),
      competitors: business.competitors.map(({ id, domain, name }) => ({
        id,
        domain,
        name,
      })),
      profile: {
        name: business.name,
        domain: business.domain,
        category: business.category ?? "",
        description: business.description ?? "",
        icp: business.icp ?? "",
      },
    };
  }
}
