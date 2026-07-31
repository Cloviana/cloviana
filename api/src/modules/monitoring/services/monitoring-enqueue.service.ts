import { createHash } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { ManagedJobsService } from "@/modules/jobs/managed-jobs.service";
import { Injectable, Logger } from "@nestjs/common";
import { JobType, PromptStatus } from "@prisma/client";
import { MonitoringProducer } from "../background/queue/monitoring.producer";
import { MonitoringEligibilityService } from "./monitoring-eligibility.service";

function buildMonitoringDedupeKey(date: Date, promptIds: string[]): string {
  const promptKey = [...new Set(promptIds)].sort().join(",");
  const digest = createHash("sha256")
    .update(promptKey)
    .digest("hex")
    .slice(0, 16);

  return `monitoring:${date.toISOString().slice(0, 10)}:${digest}`;
}

@Injectable()
export class MonitoringEnqueueService {
  private readonly logger = new Logger(MonitoringEnqueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibilityService: MonitoringEligibilityService,
    private readonly producer: MonitoringProducer,
    private readonly managedJobs: ManagedJobsService,
  ) {}

  async enqueueActivePrompts(businessId: string) {
    const activePrompts = await this.prisma.prompt.findMany({
      where: { businessId, status: PromptStatus.ACTIVE },
      select: { id: true },
    });

    return this.enqueueMonitoring(
      businessId,
      activePrompts.map((prompt) => prompt.id),
    );
  }

  async enqueueMonitoring(
    businessId: string,
    promptIds: string[],
    requestedDate = new Date(),
  ) {
    const uniquePromptIds = Array.from(new Set(promptIds.filter(Boolean)));
    if (uniquePromptIds.length === 0) {
      return { jobId: null, enqueued: false, reason: "no_prompts" as const };
    }

    if (await this.eligibilityService.hasActiveMonitoringJob(businessId)) {
      return {
        jobId: null,
        enqueued: false,
        reason: "fresh_active_run" as const,
      };
    }

    const runDate = new Date(requestedDate);
    runDate.setUTCHours(0, 0, 0, 0);
    const reservation = await this.managedJobs.reserveJob({
      type: JobType.MONITORING,
      businessId,
      dedupeKey: buildMonitoringDedupeKey(runDate, uniquePromptIds),
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

    await this.producer.enqueueMonitoringRun({
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
