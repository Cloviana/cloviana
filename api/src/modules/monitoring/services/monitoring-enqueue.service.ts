import { createHash } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { InngestService } from "@/infrastructure/inngest/inngest.service";
import { WorkflowRunsService } from "@/modules/workflow-runs/workflow-runs.service";
import { Injectable, Logger } from "@nestjs/common";
import { PromptStatus, WorkflowRunType } from "@prisma/client";
import { monitoringRunRequested } from "../background/workflows/monitoring/monitoring.events";

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
    private readonly inngestService: InngestService,
    private readonly workflowRuns: WorkflowRunsService,
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
      return {
        workflowRunId: null,
        enqueued: false,
        reason: "no_prompts" as const,
      };
    }

    const runDate = new Date(requestedDate);
    runDate.setUTCHours(0, 0, 0, 0);
    const reservation = await this.workflowRuns.reserveWorkflowRun({
      type: WorkflowRunType.MONITORING,
      businessId,
      dedupeKey: buildMonitoringDedupeKey(runDate, uniquePromptIds),
    });

    if (
      reservation.reason === "already_succeeded" ||
      reservation.reason === "already_running"
    ) {
      return {
        workflowRunId: reservation.workflowRunId,
        enqueued: false,
        reason: reservation.reason,
      };
    }

    if (!reservation.eventId) {
      throw new Error(
        `Workflow run ${reservation.workflowRunId} is missing an Inngest event ID`,
      );
    }

    await this.inngestService.send({
      id: reservation.eventId,
      name: monitoringRunRequested.name,
      data: {
        workflowRunId: reservation.workflowRunId,
        businessId,
        promptIds: uniquePromptIds,
        runDateIso: runDate.toISOString(),
      },
    });

    this.logger.log(
      `Enqueued monitoring businessId=${businessId} workflowRunId=${reservation.workflowRunId} promptCount=${uniquePromptIds.length}`,
    );

    return {
      workflowRunId: reservation.workflowRunId,
      enqueued: true,
      reason: reservation.reason,
    };
  }
}
