import { PrismaService } from "@/clients/prisma/prisma.service";
import { DEFAULT_JOB_STALE_MS } from "@/modules/jobs/managed-jobs.service";
import { Injectable } from "@nestjs/common";
import {
  BusinessStatus,
  JobStatus,
  JobType,
  PromptStatus,
} from "@prisma/client";

export interface DueMonitoringGroup {
  businessId: string;
  promptIds: string[];
}

@Injectable()
export class MonitoringEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async hasActiveMonitoringJob(
    businessId: string,
    staleMs = DEFAULT_JOB_STALE_MS,
  ): Promise<boolean> {
    const staleBefore = new Date(Date.now() - staleMs);
    const activeJob = await this.prisma.job.findFirst({
      where: {
        type: JobType.MONITORING,
        businessId,
        OR: [
          {
            status: JobStatus.PENDING,
            updatedAt: { gte: staleBefore },
          },
          {
            status: JobStatus.RUNNING,
            lastHeartbeatAt: { gte: staleBefore },
          },
        ],
      },
      select: { id: true },
    });

    return Boolean(activeJob);
  }

  async findDuePromptGroups(cutoff: Date): Promise<DueMonitoringGroup[]> {
    const duePrompts = await this.prisma.prompt.findMany({
      where: {
        status: PromptStatus.ACTIVE,
        business: { status: BusinessStatus.ACTIVE },
        OR: [{ lastRunAt: null }, { lastRunAt: { lte: cutoff } }],
      },
      select: {
        id: true,
        businessId: true,
      },
      orderBy: [{ businessId: "asc" }, { createdAt: "asc" }],
    });

    const promptIdsByBusiness = new Map<string, string[]>();

    for (const prompt of duePrompts) {
      const promptIds = promptIdsByBusiness.get(prompt.businessId) ?? [];
      promptIds.push(prompt.id);
      promptIdsByBusiness.set(prompt.businessId, promptIds);
    }

    return Array.from(promptIdsByBusiness, ([businessId, promptIds]) => ({
      businessId,
      promptIds,
    }));
  }
}
