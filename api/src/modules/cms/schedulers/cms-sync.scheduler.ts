import { PrismaService } from "@/clients/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { CmsSyncService } from "../services/cms-sync.service";

@Injectable()
export class CmsSyncScheduler {
  private readonly logger = new Logger(CmsSyncScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cmsSync: CmsSyncService,
  ) {}

  @Cron("0 */6 * * *")
  async syncAll() {
    const businesses = await this.prisma.cmsConnection.findMany({
      select: { businessId: true },
      distinct: ["businessId"],
    });
    const bucket = new Date().toISOString().slice(0, 13);
    this.logger.log(`CMS sync sweep for ${businesses.length} businesses`);
    for (const { businessId } of businesses) {
      try {
        await this.cmsSync.runSync(businessId, `cron:${bucket}`);
      } catch (err: any) {
        this.logger.error(
          `CMS sync job failed businessId=${businessId}: ${err.message}`,
        );
      }
    }
  }
}
