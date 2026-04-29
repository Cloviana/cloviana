import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { BusinessStatus, PromptStatus } from "@prisma/client";

export type DueMonitoringGroup = {
  businessId: string;
  promptIds: string[];
};

@Injectable()
export class MonitoringEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

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
