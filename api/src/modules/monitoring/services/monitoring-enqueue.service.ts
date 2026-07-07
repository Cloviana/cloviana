import { MonitoringProducer } from "@/infrastructure/messaging/producers/monitoring.producer";
import { ManagedJobsService } from "@/modules/jobs/services/managed-jobs.service";
import {
  buildMonitoringJobDedupeKey,
  startOfUtcDay,
} from "@/workflows/monitoring/monitoring.job-key";
import { Injectable, Logger } from "@nestjs/common";
import { JobType } from "@prisma/client";
import { MonitoringEligibilityService } from "./monitoring-eligibility.service";

@Injectable()
export class MonitoringEnqueueService {
  private readonly logger = new Logger(MonitoringEnqueueService.name);

  constructor(
    private readonly monitoringEligibility: MonitoringEligibilityService,
    private readonly monitoringProducer: MonitoringProducer,
    private readonly managedJobs: ManagedJobsService,
  ) {}

  async enqueue(
    businessId: string,
    promptIds: string[],
    requestedDate = new Date(),
  ) {
    const uniquePromptIds = Array.from(new Set(promptIds.filter(Boolean)));
    if (uniquePromptIds.length === 0) {
      return { jobId: null, enqueued: false, reason: "no_prompts" as const };
    }

    if (
      await this.monitoringEligibility.hasFreshActiveRunForBusiness(businessId)
    ) {
      return {
        jobId: null,
        enqueued: false,
        reason: "fresh_active_run" as const,
      };
    }

    const runDate = startOfUtcDay(requestedDate);
    const reservation = await this.managedJobs.reserveJob({
      type: JobType.MONITORING,
      businessId,
      dedupeKey: buildMonitoringJobDedupeKey(runDate, uniquePromptIds),
      payload: {
        businessId,
        promptIds: uniquePromptIds,
        runDate: runDate.toISOString(),
      },
    });

    if (!reservation.shouldPublish) {
      return {
        jobId: reservation.jobId,
        enqueued: false,
        reason: reservation.reason,
      };
    }

    await this.monitoringProducer.runMonitoring({
      jobId: reservation.jobId,
      businessId,
      promptIds: uniquePromptIds,
      runDateIso: runDate.toISOString(),
    });

    this.logger.log(
      `Enqueued monitoring businessId=${businessId} jobId=${reservation.jobId} promptCount=${uniquePromptIds.length}`,
    );

    return {
      jobId: reservation.jobId,
      enqueued: true,
      reason: reservation.reason,
    };
  }
}
