import { MonitoringProducer } from "@/infrastructure/messaging/producers/monitoring.producer";
import { ManagedJobsService } from "@/modules/jobs/services/managed-jobs.service";
import {
  buildMonitoringJobDedupeKey,
  startOfUtcDay,
} from "@/workflows/monitoring/utils/monitoring-job-key";
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { JobType } from "@prisma/client";
import { MonitoringEligibilityService } from "../services/monitoring-eligibility.service";

const DUE_WINDOW_MS = 1000 * 60 * 60 * 24 * 3;

@Injectable()
export class MonitoringScheduler {
  private readonly logger = new Logger(MonitoringScheduler.name);

  constructor(
    private readonly monitoringEligibility: MonitoringEligibilityService,
    private readonly monitoringProducer: MonitoringProducer,
    private readonly managedJobs: ManagedJobsService,
  ) {}

  @Cron("*/10 * * * *")
  async enqueueDueMonitoringRuns(): Promise<void> {
    const cutoff = new Date(Date.now() - DUE_WINDOW_MS);
    const runDate = startOfUtcDay(new Date());
    const groups = await this.monitoringEligibility.findDuePromptGroups(cutoff);
    let enqueuedCount = 0;
    let skippedCount = 0;

    for (const group of groups) {
      if (
        await this.monitoringEligibility.hasFreshActiveRunForBusiness(
          group.businessId,
        )
      ) {
        skippedCount += 1;
        this.logger.log(
          `Skipped monitoring enqueue businessId=${group.businessId} reason=fresh_active_run`,
        );
        continue;
      }

      const dedupeKey = buildMonitoringJobDedupeKey(runDate, group.promptIds);
      const reservation = await this.managedJobs.reserveJob({
        type: JobType.MONITORING,
        businessId: group.businessId,
        dedupeKey,
        payload: {
          businessId: group.businessId,
          promptIds: group.promptIds,
          runDate: runDate.toISOString(),
        },
      });

      if (!reservation.shouldPublish) {
        skippedCount += 1;
        this.logger.log(
          `Skipped monitoring enqueue businessId=${group.businessId} jobId=${reservation.jobId} reason=${reservation.reason}`,
        );
        continue;
      }

      await this.monitoringProducer.runMonitoring({
        jobId: reservation.jobId,
        runDateIso: runDate.toISOString(),
        ...group,
      });
      enqueuedCount += 1;
    }

    this.logger.log(
      `Processed monitoring enqueue dueCount=${groups.length} enqueued=${enqueuedCount} skipped=${skippedCount} cutoff=${cutoff.toISOString()}`,
    );
  }
}
