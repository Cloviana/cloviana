import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MonitoringEligibilityService } from "../../services/monitoring-eligibility.service";
import { MonitoringEnqueueService } from "../../services/monitoring-enqueue.service";

const PROMPT_RUN_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MONITORING_CRON = "*/10 * * * *";

@Injectable()
export class MonitoringScheduler {
  private readonly logger = new Logger(MonitoringScheduler.name);

  constructor(
    private readonly eligibilityService: MonitoringEligibilityService,
    private readonly enqueueService: MonitoringEnqueueService,
  ) {}

  @Cron(MONITORING_CRON)
  async enqueueDueMonitoringRuns(): Promise<void> {
    const dueBefore = new Date(Date.now() - PROMPT_RUN_INTERVAL_MS);
    const dueGroups =
      await this.eligibilityService.findDuePromptGroups(dueBefore);
    let enqueuedCount = 0;
    let skippedCount = 0;

    for (const group of dueGroups) {
      const enqueueResult = await this.enqueueService.enqueueMonitoring(
        group.businessId,
        group.promptIds,
      );

      if (!enqueueResult.enqueued) {
        skippedCount += 1;
        this.logger.log(
          `Skipped monitoring enqueue businessId=${group.businessId} jobId=${enqueueResult.jobId} reason=${enqueueResult.reason}`,
        );
        continue;
      }
      enqueuedCount += 1;
    }

    this.logger.log(
      `Processed monitoring enqueue dueCount=${dueGroups.length} enqueued=${enqueuedCount} skipped=${skippedCount} dueBefore=${dueBefore.toISOString()}`,
    );
  }
}
