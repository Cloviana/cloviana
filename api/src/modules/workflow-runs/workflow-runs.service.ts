import { randomUUID } from "node:crypto";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import type { WorkflowRun } from "@prisma/client";
import { Prisma, WorkflowRunStatus, WorkflowRunType } from "@prisma/client";

const WORKFLOW_RUN_SUMMARY_SELECT = {
  id: true,
  type: true,
  status: true,
  eventId: true,
  progress: true,
  result: true,
  error: true,
  createdAt: true,
  startedAt: true,
  finishedAt: true,
} satisfies Prisma.WorkflowRunSelect;

type ReserveWorkflowRunOptions = {
  type: WorkflowRunType;
  businessId: string;
  dedupeKey: string;
};

type ReserveWorkflowRunReason =
  | "created"
  | "retryable"
  | "already_pending"
  | "already_running"
  | "already_succeeded";

type ReserveWorkflowRunResult = {
  workflowRunId: string;
  eventId: string | null;
  status: WorkflowRunStatus;
  reason: ReserveWorkflowRunReason;
};

type WorkflowRunResult = Pick<WorkflowRun, "id" | "status" | "finishedAt">;

type WorkflowRunError = {
  message?: unknown;
};

function createEventId(type: WorkflowRunType): string {
  return `${type.toLowerCase()}:${randomUUID()}`;
}

@Injectable()
export class WorkflowRunsService {
  constructor(private readonly prisma: PrismaService) {}

  getById(businessId: string, workflowRunId: string) {
    return this.prisma.workflowRun.findFirst({
      where: { id: workflowRunId, businessId },
      select: WORKFLOW_RUN_SUMMARY_SELECT,
    });
  }

  list(businessId: string, type?: WorkflowRunType, limit = 20) {
    return this.prisma.workflowRun.findMany({
      where: { businessId, ...(type ? { type } : {}) },
      select: WORKFLOW_RUN_SUMMARY_SELECT,
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 100),
    });
  }

  latest(businessId: string, type: WorkflowRunType) {
    return this.prisma.workflowRun.findFirst({
      where: { businessId, type },
      select: WORKFLOW_RUN_SUMMARY_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  async reserveWorkflowRun({
    type,
    businessId,
    dedupeKey,
  }: ReserveWorkflowRunOptions): Promise<ReserveWorkflowRunResult> {
    try {
      const workflowRun = await this.prisma.workflowRun.create({
        data: {
          id: randomUUID(),
          type,
          businessId,
          status: WorkflowRunStatus.PENDING,
          dedupeKey,
          eventId: createEventId(type),
        },
      });

      return this.reservation(workflowRun, "created");
    } catch (error) {
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        )
      ) {
        throw error;
      }
    }

    let workflowRun = await this.prisma.workflowRun.findUniqueOrThrow({
      where: {
        type_businessId_dedupeKey: {
          type,
          businessId,
          dedupeKey,
        },
      },
    });

    if (workflowRun.status === WorkflowRunStatus.SUCCESS) {
      return this.reservation(workflowRun, "already_succeeded");
    }

    if (workflowRun.status === WorkflowRunStatus.RUNNING) {
      return this.reservation(workflowRun, "already_running");
    }

    if (workflowRun.status === WorkflowRunStatus.PENDING) {
      if (!workflowRun.eventId) {
        await this.prisma.workflowRun.updateMany({
          where: {
            id: workflowRun.id,
            status: WorkflowRunStatus.PENDING,
            eventId: null,
          },
          data: { eventId: createEventId(type) },
        });
        workflowRun = await this.prisma.workflowRun.findUniqueOrThrow({
          where: { id: workflowRun.id },
        });
      }
      return this.reservation(
        workflowRun,
        this.reasonForExistingRun(workflowRun.status),
      );
    }

    const eventId = createEventId(type);
    const retry = await this.prisma.workflowRun.updateMany({
      where: {
        id: workflowRun.id,
        status: WorkflowRunStatus.FAILED,
      },
      data: {
        status: WorkflowRunStatus.PENDING,
        eventId,
        progress: Prisma.DbNull,
        result: Prisma.DbNull,
        startedAt: null,
        finishedAt: null,
        error: null,
      },
    });
    workflowRun = await this.prisma.workflowRun.findUniqueOrThrow({
      where: { id: workflowRun.id },
    });

    return this.reservation(
      workflowRun,
      retry.count === 1
        ? "retryable"
        : this.reasonForExistingRun(workflowRun.status),
    );
  }

  async startWorkflowRun(
    workflowRunId: string,
  ): Promise<{ shouldExecute: boolean }> {
    const workflowRun = await this.prisma.workflowRun.findUniqueOrThrow({
      where: { id: workflowRunId },
      select: { status: true },
    });

    if (
      workflowRun.status === WorkflowRunStatus.SUCCESS ||
      workflowRun.status === WorkflowRunStatus.RUNNING
    ) {
      return { shouldExecute: false };
    }

    const started = await this.prisma.workflowRun.updateMany({
      where: {
        id: workflowRunId,
        status: {
          in: [WorkflowRunStatus.PENDING, WorkflowRunStatus.FAILED],
        },
      },
      data: {
        status: WorkflowRunStatus.RUNNING,
        startedAt: new Date(),
        finishedAt: null,
        error: null,
      },
    });

    return { shouldExecute: started.count === 1 };
  }

  async completeWorkflowRun(
    workflowRunId: string,
    result?: Prisma.InputJsonValue,
  ): Promise<WorkflowRunResult> {
    const finishedAt = new Date();
    return this.prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: {
        status: WorkflowRunStatus.SUCCESS,
        finishedAt,
        error: null,
        result,
      },
      select: { id: true, status: true, finishedAt: true },
    });
  }

  async updateWorkflowRunProgress(
    workflowRunId: string,
    progress: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { progress },
    });
  }

  async markWorkflowRunRetrying(workflowRunId: string): Promise<void> {
    await this.prisma.workflowRun.updateMany({
      where: {
        id: workflowRunId,
        status: { not: WorkflowRunStatus.SUCCESS },
      },
      data: {
        status: WorkflowRunStatus.PENDING,
        finishedAt: null,
      },
    });
  }

  async failWorkflowRun(workflowRunId: string, error: unknown): Promise<void> {
    await this.prisma.workflowRun.updateMany({
      where: {
        id: workflowRunId,
        status: { not: WorkflowRunStatus.SUCCESS },
      },
      data: {
        status: WorkflowRunStatus.FAILED,
        finishedAt: new Date(),
        error: this.errorMessage(error),
      },
    });
  }

  private reservation(
    workflowRun: Pick<WorkflowRun, "id" | "eventId" | "status">,
    reason: ReserveWorkflowRunReason,
  ): ReserveWorkflowRunResult {
    return {
      workflowRunId: workflowRun.id,
      eventId: workflowRun.eventId,
      status: workflowRun.status,
      reason,
    };
  }

  private reasonForExistingRun(
    status: WorkflowRunStatus,
  ): Exclude<ReserveWorkflowRunReason, "created" | "retryable"> {
    if (status === WorkflowRunStatus.SUCCESS) {
      return "already_succeeded";
    }
    if (status === WorkflowRunStatus.RUNNING) {
      return "already_running";
    }
    return "already_pending";
  }

  private errorMessage(error: unknown): string {
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? (error as WorkflowRunError).message
        : error;

    return String(message).slice(0, 1000);
  }
}
