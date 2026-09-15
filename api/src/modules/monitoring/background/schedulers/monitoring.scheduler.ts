import { inngest } from "@/infrastructure/inngest/inngest.client";
import { Injectable, Logger } from "@nestjs/common";
import { cron } from "inngest";
import { MonitoringEligibilityService } from "../../services/monitoring-eligibility.service";
import { MonitoringEnqueueService } from "../../services/monitoring-enqueue.service";

const PROMPT_RUN_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MONITORING_CRON = "*/10 * * * *";

@Injectable()
export class MonitoringScheduler {
  private readonly logger = new Logger(MonitoringScheduler.name);
  readonly inngestFunction;

  constructor(
    private readonly eligibilityService: MonitoringEligibilityService,
    private readonly enqueueService: MonitoringEnqueueService,
  ) {
    this.inngestFunction = inngest.createFunction(
      {
        id: "monitoring-scheduler",
        name: "Monitoring scheduler",
        triggers: [cron(MONITORING_CRON)],
        retries: 3,
        singleton: { mode: "skip" },
      },
      async ({ step }) => {
        const dueBefore = new Date(Date.now() - PROMPT_RUN_INTERVAL_MS);
        const dueGroups = await step.run("find-due-prompts", () =>
          this.eligibilityService.findDuePromptGroups(dueBefore),
        );
        let enqueuedCount = 0;
        let skippedCount = 0;

        for (const group of dueGroups) {
          const enqueueResult = await step.run(
            `enqueue-${group.businessId}`,
            async () => {
              const result = await this.enqueueService.enqueueMonitoring(
                group.businessId,
                group.promptIds,
              );
              if (!result.enqueued) {
                this.logger.log(
                  `Skipped monitoring enqueue businessId=${group.businessId} workflowRunId=${result.workflowRunId} reason=${result.reason}`,
                );
              }
              return result;
            },
          );

          if (!enqueueResult.enqueued) {
            skippedCount += 1;
            continue;
          }
          enqueuedCount += 1;
        }

        const summary = {
          dueCount: dueGroups.length,
          enqueuedCount,
          skippedCount,
          dueBefore: dueBefore.toISOString(),
        };
        return step.run("log-monitoring-scheduler-summary", () => {
          this.logger.log(
            `Processed monitoring enqueue ${JSON.stringify(summary)}`,
          );
          return summary;
        });
      },
    );
  }
}
