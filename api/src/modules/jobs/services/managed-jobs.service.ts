import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { JobStatus, JobType, Prisma } from "@prisma/client";

const DEFAULT_STALE_MS = 10 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 15000;

type ManagedBusinessJobOptions<T> = {
  type: JobType;
  businessId: string;
  dedupeKey: string;
  execute: (context: { jobId: string }) => Promise<T>;
  onSuccess?: (context: {
    jobId: string;
    businessId: string;
    result: T;
    finishedAt: Date;
  }) => Promise<void>;
  onFailure?: (context: {
    jobId: string;
    businessId: string;
    error: string;
    finishedAt: Date;
  }) => Promise<void>;
  serializeResult?: (result: T) => Prisma.InputJsonValue | undefined;
  staleMs?: number;
};

@Injectable()
export class ManagedJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async runManagedBusinessJob<T>({
    type,
    businessId,
    dedupeKey,
    execute,
    onSuccess,
    onFailure,
    serializeResult,
    staleMs = DEFAULT_STALE_MS,
  }: ManagedBusinessJobOptions<T>) {
    let job = await this.prisma.job.upsert({
      where: {
        type_businessId_dedupeKey: {
          type,
          businessId,
          dedupeKey,
        },
      },
      update: {},
      create: {
        type,
        businessId,
        status: JobStatus.PENDING,
        dedupeKey,
      },
    });

    if (job.status === JobStatus.SUCCESS) {
      return job;
    }

    if (job.status === JobStatus.RUNNING) {
      const lastHeartbeat = job.lastHeartbeatAt?.getTime() ?? 0;
      const age = Date.now() - lastHeartbeat;

      if (age > staleMs) {
        job = await this.prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            finishedAt: new Date(),
            error: "Stale running job (no heartbeat)",
          },
        });
      } else {
        return job;
      }
    }

    await this.prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.RUNNING,
        attempts: { increment: 1 },
        startedAt: new Date(),
        finishedAt: null,
        lastHeartbeatAt: new Date(),
        error: null,
      },
    });

    const hb = setInterval(() => {
      this.prisma.job
        .update({
          where: { id: job.id },
          data: { lastHeartbeatAt: new Date() },
        })
        .catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    try {
      const result = await execute({ jobId: job.id });
      const finishedAt = new Date();

      await onSuccess?.({
        jobId: job.id,
        businessId,
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
    } catch (error: any) {
      const finishedAt = new Date();
      const message = String(error?.message ?? error).slice(0, 1000);

      await onFailure?.({
        jobId: job.id,
        businessId,
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
}
