import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { JobStatus, JobType } from "@prisma/client";
import { JOB_SUMMARY_SELECT } from "./constants/selects.constants";

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(storeId: string, jobId: string) {
    return this.prisma.job.findFirst({
      where: { id: jobId, storeId },
      select: JOB_SUMMARY_SELECT,
    });
  }

  async list(storeId: string, type?: JobType, limit = 20) {
    return this.prisma.job.findMany({
      where: { storeId, ...(type ? { type } : {}) },
      select: JOB_SUMMARY_SELECT,
      orderBy: [{ createdAt: "desc" }],
      take: Math.min(Math.max(limit, 1), 100),
    });
  }

  async latest(storeId: string, type: JobType) {
    return this.prisma.job.findFirst({
      where: { storeId, type },
      select: JOB_SUMMARY_SELECT,
      orderBy: [{ createdAt: "desc" }],
    });
  }

  async latestStatus(
    storeId: string,
    type: JobType,
  ): Promise<{ status: JobStatus | null; jobId: string | null }> {
    const job = await this.latest(storeId, type);
    return { status: job?.status ?? null, jobId: job?.id ?? null };
  }
}
