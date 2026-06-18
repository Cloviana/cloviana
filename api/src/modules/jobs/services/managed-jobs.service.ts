import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import type { Job } from "@prisma/client";
import { JobStatus, JobType, Prisma } from "@prisma/client";

export const DEFAULT_JOB_STALE_MS = 10 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 15000;

type JobExecutionContext = {
  jobId: string;
  businessId: string;
};

type JobSuccessContext<T> = JobExecutionContext & {
  result: T;
  finishedAt: Date;
};

type JobFailureContext = JobExecutionContext & {
  error: string;
  finishedAt: Date;
};

export type JobProgress = {
  percent: number | null;
  step: string | null;
  title: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
};

export type JobProgressPatch = Omit<JobProgress, "updatedAt">;

type JobHandlers<T> = {
  execute: (context: JobExecutionContext) => Promise<T>;
  onSuccess?: (context: JobSuccessContext<T>) => Promise<void>;
  onFailure?: (context: JobFailureContext) => Promise<void>;
  serializeResult?: (result: T) => Prisma.InputJsonValue | undefined;
};

type JobIdentity = {
  type: JobType;
  businessId: string;
  dedupeKey: string;
};

type StaleJobOptions = {
  staleMs?: number;
};

type ReserveJobOptions = JobIdentity &
  StaleJobOptions & {
    payload?: Prisma.InputJsonValue;
  };

type RunJobOptions<T> = JobHandlers<T> &
  StaleJobOptions & {
    jobId: string;
  };

type RunJobInlineOptions<T> = JobIdentity &
  JobHandlers<T> &
  StaleJobOptions & {
    payload?: Prisma.InputJsonValue;
  };

type ReserveJobReason =
  | "created"
  | "retryable"
  | "already_pending"
  | "already_running"
  | "already_succeeded";

type ReserveJobResult = {
  jobId: string;
  status: JobStatus;
  shouldPublish: boolean;
  reason: ReserveJobReason;
};

type ManagedJob = Pick<Job, "id" | "status" | "updatedAt" | "lastHeartbeatAt">;
type JobResult = Pick<Job, "id" | "status" | "finishedAt">;

type JobError = {
  message?: unknown;
};

@Injectable()
export class ManagedJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async reserveJob({
    type,
    businessId,
    dedupeKey,
    payload,
    staleMs = DEFAULT_JOB_STALE_MS,
  }: ReserveJobOptions): Promise<ReserveJobResult> {
    try {
      const job = await this.prisma.job.create({
        data: {
          type,
          businessId,
          status: JobStatus.PENDING,
          dedupeKey,
          payload,
        },
      });

      return this.reservation(job, true, "created");
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

    const job = await this.prisma.job.findUniqueOrThrow({
      where: {
        type_businessId_dedupeKey: {
          type,
          businessId,
          dedupeKey,
        },
      },
    });

    if (job.status === JobStatus.SUCCESS) {
      return this.reservation(job, false, "already_succeeded");
    }

    if (job.status === JobStatus.PENDING && this.isFresh(job, staleMs)) {
      return this.reservation(job, false, "already_pending");
    }

    if (
      job.status === JobStatus.RUNNING &&
      this.hasFreshHeartbeat(job, staleMs)
    ) {
      return this.reservation(job, false, "already_running");
    }

    const retryableJob = await this.prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.PENDING,
        finishedAt: null,
        lastHeartbeatAt: null,
        progress: Prisma.DbNull,
        error:
          job.status === JobStatus.RUNNING
            ? "Stale running job queued for retry"
            : null,
        payload,
      },
    });

    return this.reservation(retryableJob, true, "retryable");
  }

  async runJob<T>({
    jobId,
    execute,
    onSuccess,
    onFailure,
    serializeResult,
    staleMs = DEFAULT_JOB_STALE_MS,
  }: RunJobOptions<T>): Promise<JobResult> {
    let job = await this.prisma.job.findUniqueOrThrow({
      where: { id: jobId },
    });

    if (job.status === JobStatus.SUCCESS) {
      return job;
    }

    if (job.status === JobStatus.RUNNING) {
      if (this.hasFreshHeartbeat(job, staleMs)) {
        return job;
      }

      job = await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          finishedAt: new Date(),
          error: "Stale running job (no heartbeat)",
        },
      });
    }

    const started = await this.prisma.job.updateMany({
      where: {
        id: job.id,
        status: { in: [JobStatus.PENDING, JobStatus.FAILED] },
      },
      data: {
        status: JobStatus.RUNNING,
        attempts: { increment: 1 },
        startedAt: new Date(),
        finishedAt: null,
        lastHeartbeatAt: new Date(),
        progress: Prisma.DbNull,
        error: null,
      },
    });

    if (started.count === 0) {
      return this.prisma.job.findUniqueOrThrow({ where: { id: job.id } });
    }

    const hb = setInterval(() => {
      this.prisma.job
        .update({
          where: { id: job.id },
          data: { lastHeartbeatAt: new Date() },
        })
        .catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    try {
      const result = await execute({
        jobId: job.id,
        businessId: job.businessId,
      });
      const finishedAt = new Date();

      await onSuccess?.({
        jobId: job.id,
        businessId: job.businessId,
        result,
        finishedAt,
      });

      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.SUCCESS,
          finishedAt,
          result: serializeResult?.(result),
        },
      });

      return { id: job.id, status: JobStatus.SUCCESS, finishedAt };
    } catch (error: unknown) {
      const finishedAt = new Date();
      const message = this.errorMessage(error);

      await onFailure?.({
        jobId: job.id,
        businessId: job.businessId,
        error: message,
        finishedAt,
      });

      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          finishedAt,
          error: message,
        },
      });

      throw error;
    } finally {
      clearInterval(hb);
      await this.prisma.job.updateMany({
        where: { id: job.id, status: JobStatus.RUNNING },
        data: {
          status: JobStatus.FAILED,
          finishedAt: new Date(),
          error: "Process terminated without finalization",
        },
      });
    }
  }

  async runJobInline<T>({
    type,
    businessId,
    dedupeKey,
    payload,
    execute,
    onSuccess,
    onFailure,
    serializeResult,
    staleMs = DEFAULT_JOB_STALE_MS,
  }: RunJobInlineOptions<T>) {
    const reservation = await this.reserveJob({
      type,
      businessId,
      dedupeKey,
      payload,
      staleMs,
    });

    return this.runJob({
      jobId: reservation.jobId,
      execute,
      onSuccess,
      onFailure,
      serializeResult,
      staleMs,
    });
  }

  async updateProgress(jobId: string, patch: JobProgressPatch) {
    const progress: JobProgress = {
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.job.update({
      where: { id: jobId },
      data: { progress: progress as Prisma.InputJsonValue },
    });

    return progress;
  }

  private reservation(
    job: { id: string; status: JobStatus },
    shouldPublish: boolean,
    reason: ReserveJobReason,
  ): ReserveJobResult {
    return {
      jobId: job.id,
      status: job.status,
      shouldPublish,
      reason,
    };
  }

  private isFresh(job: ManagedJob, staleMs: number): boolean {
    return Date.now() - job.updatedAt.getTime() <= staleMs;
  }

  private hasFreshHeartbeat(job: ManagedJob, staleMs: number): boolean {
    const lastHeartbeat = job.lastHeartbeatAt?.getTime() ?? 0;

    return Date.now() - lastHeartbeat <= staleMs;
  }

  private errorMessage(error: unknown): string {
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? (error as JobError).message
        : error;

    return String(message).slice(0, 1000);
  }
}
