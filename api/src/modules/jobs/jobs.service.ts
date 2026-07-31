import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { JobType, Prisma } from "@prisma/client";

const JOB_SUMMARY_SELECT = {
  id: true,
  type: true,
  status: true,
  error: true,
  attempts: true,
  result: true,
  createdAt: true,
  startedAt: true,
  finishedAt: true,
  lastHeartbeatAt: true,
} satisfies Prisma.JobSelect;

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
