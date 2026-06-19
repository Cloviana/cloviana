import { startOfUtcDay } from "@/workflows/monitoring/utils/monitoring-job-key";
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MonitoringEligibilityService } from "../services/monitoring-eligibility.service";
import { MonitoringEnqueueService } from "../services/monitoring-enqueue.service";

const DUE_WINDOW_MS = 1000 * 60 * 60 * 24;

@Injectable()
export class MonitoringScheduler {
  private readonly logger = new Logger(MonitoringScheduler.name);

  constructor(
    private readonly monitoringEligibility: MonitoringEligibilityService,
    private readonly monitoringEnqueue: MonitoringEnqueueService,
  ) {}

  @Cron("*/10 * * * *")
  async enqueueDueMonitoringRuns(): Promise<void> {
    const cutoff = new Date(Date.now() - DUE_WINDOW_MS);
    const runDate = startOfUtcDay(new Date());
    const groups = await this.monitoringEligibility.findDuePromptGroups(cutoff);
    let enqueuedCount = 0;
    let skippedCount = 0;

    for (const group of groups) {
      const result = await this.monitoringEnqueue.enqueue(
        group.businessId,
        group.promptIds,
        runDate,
      );

      if (!result.enqueued) {
        skippedCount += 1;
        this.logger.log(
          `Skipped monitoring enqueue businessId=${group.businessId} jobId=${result.jobId} reason=${result.reason}`,
        );
        continue;
      }
      enqueuedCount += 1;
    }

    this.logger.log(
      `Processed monitoring enqueue dueCount=${groups.length} enqueued=${enqueuedCount} skipped=${skippedCount} cutoff=${cutoff.toISOString()}`,
    );
  }
}
