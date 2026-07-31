// Loads a business's active prompts, runs providers in parallel, enriches the
// responses, computes metrics, and persists the completed monitoring run.
import { PrismaService } from "@/clients/prisma/prisma.service";
import { ManagedJobsService } from "@/modules/jobs/managed-jobs.service";
import { Injectable, Logger } from "@nestjs/common";
import { PromptStatus } from "@prisma/client";
import { MonitoringAnalysisService } from "./monitoring-analysis.service";
import { MonitoringEngineService } from "./monitoring-engine.service";
import { MonitoringPersistenceService } from "./monitoring-persistence.service";
import { computePromptMetrics } from "./monitoring.metrics";
import type {
  MonitoringRunInput,
  MonitoringRunResult,
} from "./monitoring.types";

type MonitoringRunSummary = {
  date: string;
  promptCount: number;
  responseCount: number;
  failureCount: number;
  promptMetricCount: number;
  businessMetricCount: number;
};

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function createRunSummary(
  runDate: Date,
  runResult: MonitoringRunResult,
  businessMetricCount: number,
): MonitoringRunSummary {
  return {
    date: formatDateKey(runDate),
    promptCount: runResult.prompts.length,
    responseCount: runResult.engineResponses.length,
    failureCount: runResult.engineFailures.length,
    promptMetricCount: runResult.promptMetrics.length,
    businessMetricCount,
  };
}

@Injectable()
export class MonitoringWorkflow {
  private readonly logger = new Logger(MonitoringWorkflow.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly managedJobs: ManagedJobsService,
    private readonly engineService: MonitoringEngineService,
    private readonly analysisService: MonitoringAnalysisService,
    private readonly persistenceService: MonitoringPersistenceService,
  ) {}

  async run(
    jobId: string,
    businessId: string,
    promptIds?: string[],
    runDate = new Date(),
  ) {
    const normalizedRunDate = new Date(runDate);
    normalizedRunDate.setUTCHours(0, 0, 0, 0);

    return this.managedJobs.runJob({
      jobId,
      execute: () => this.executeRun(businessId, normalizedRunDate, promptIds),
      serializeResult: (jobResult) => jobResult,
    });
  }

  private async executeRun(
    businessId: string,
    runDate: Date,
    promptIds?: string[],
  ): Promise<MonitoringRunSummary> {
    const runInput = await this.loadRunInput(businessId, runDate, promptIds);
    const dateKey = formatDateKey(runDate);

    if (runInput.prompts.length === 0) {
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
      `[${businessId}] Starting monitoring date=${dateKey} promptCount=${runInput.prompts.length}`,
    );

    const { engineResponses, engineFailures } =
      await this.engineService.executeEngines(runInput);

    if (engineResponses.length === 0 && engineFailures.length > 0) {
      throw new Error(
        `Monitoring failed: all ${engineFailures.length} engine requests failed`,
      );
    }

    const analyzedResponses = await this.analysisService.enrichResponses(
      runInput,
      engineResponses,
    );
    const runResult: MonitoringRunResult = {
      ...runInput,
      engineResponses: analyzedResponses,
      engineFailures,
      promptMetrics: computePromptMetrics(runInput, analyzedResponses),
    };
    const { businessMetricCount } =
      await this.persistenceService.persistRun(runResult);

    const summary = createRunSummary(runDate, runResult, businessMetricCount);

    this.logger.log(
      `[${businessId}] Completed monitoring ${JSON.stringify(summary)}`,
    );

    return summary;
  }

  private async loadRunInput(
    businessId: string,
    runDate: Date,
    promptIds?: string[],
  ): Promise<MonitoringRunInput> {
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
      date: runDate,
      prompts: business.prompts.map(({ id, text }) => ({ id, text })),
      competitors: business.competitors.map(({ id, domain, name }) => ({
        id,
        domain,
        name,
      })),
      profile: {
        name: business.name,
        domain: business.domain,
      },
    };
  }
}
