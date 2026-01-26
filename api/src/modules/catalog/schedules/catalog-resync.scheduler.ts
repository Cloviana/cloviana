import { PrismaService } from "@/clients/prisma/prisma.service";
import { SyncCatalogWorkflow } from "@/workflows/sync-catalog/sync-catalog.workflow";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class CatalogResyncScheduler {
  private readonly logger = new Logger(CatalogResyncScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly syncCatalogWorkflow: SyncCatalogWorkflow,
  ) {}

  @Cron(CronExpression.EVERY_2_HOURS)
  async handle() {
    const channels = await this.prisma.channel.findMany({
      select: { storeId: true },
    });

    this.logger.log(
      `Starting daily catalog resync for ${channels.length} store(s)`,
    );

    for (const { storeId } of channels) {
      if (!storeId) continue;

      try {
        await this.syncCatalogWorkflow.run(storeId);
      } catch (error: any) {
        this.logger.error(
          `Catalog resync failed for store ${storeId}: ${error?.message ?? error}`,
        );
      }
    }
  }
}
