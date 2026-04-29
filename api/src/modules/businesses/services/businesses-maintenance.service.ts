import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { BusinessSetupStatus } from "@prisma/client";

@Injectable()
export class BusinessesMaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async clearStaleInProgressBusinesses(cutoff: Date): Promise<number> {
    const result = await this.prisma.business.deleteMany({
      where: {
        setupStatus: BusinessSetupStatus.IN_PROGRESS,
        updatedAt: { lte: cutoff },
      },
    });

    return result.count;
  }
}
