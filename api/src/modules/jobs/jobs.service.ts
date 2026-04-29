import { PrismaService } from "@/clients/prisma/prisma.service";
import { CACHE_MANAGER, type Cache } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { JobStatus, JobType } from "@prisma/client";
import { JOB_SUMMARY_SELECT } from "./constants/selects.constants";

const NS = "job-runtime";
const V = "v1";
const TTL_MS = 1000 * 60 * 60 * 24 * 2;

export type JobRuntime = {
  status: JobStatus;
  percent: number | null;
  step: string | null;
  title: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
};

function runtimeKey(jobId: string) {
  return `${NS}:${V}:${jobId}`;
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /* ---------------- DB ---------------- */

  getById(businessId: string, jobId: string) {
    return this.prisma.job.findFirst({
      where: { id: jobId, businessId },
      select: JOB_SUMMARY_SELECT,
    });
  }

  list(businessId: string, type?: JobType, limit = 20) {
    return this.prisma.job.findMany({
      where: { businessId, ...(type ? { type } : {}) },
      select: JOB_SUMMARY_SELECT,
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 100),
    });
  }

  latest(businessId: string, type: JobType) {
    return this.prisma.job.findFirst({
      where: { businessId, type },
      select: JOB_SUMMARY_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  /* ---------------- Runtime (Redis) ---------------- */

  async getRuntime(jobId: string): Promise<JobRuntime | null> {
    return (await this.cache.get<JobRuntime>(runtimeKey(jobId))) ?? null;
  }

  async setRuntime(jobId: string, patch: Partial<JobRuntime>) {
    const key = runtimeKey(jobId);
    const prev = (await this.cache.get<JobRuntime>(key)) ?? null;

    const next: JobRuntime = {
      status: patch.status ?? prev?.status ?? JobStatus.RUNNING,
      percent: patch.percent ?? prev?.percent ?? null,
      step: patch.step ?? prev?.step ?? null,
      title: patch.title ?? prev?.title ?? "",
      meta: patch.meta ?? prev?.meta,
      updatedAt: new Date().toISOString(),
    };

    await this.cache.set(key, next, TTL_MS);
    return next;
  }

  /* ---------------- Combined ---------------- */

  async getStatus(businessId: string, jobId: string) {
    const job = await this.getById(businessId, jobId);
    if (!job) return null;

    const runtime = await this.getRuntime(jobId);
    return { job, runtime };
  }
}
