import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { StoreStatus } from "@prisma/client";
import { INIT_STORES_EVENT } from "@/constants/rabbitmq.constants";
import { SyncProductsWorkflow } from "@/workflows/sync-products/sync-products.workflow";
import { KeywordDiscoveryWorkflow } from "@/workflows/keyword-discovery/keyword-discovery.workflow";

interface GenerateBlogsEvent {
  storeId: string;
}

@Controller()
export class StoresConsumer {
  private readonly logger = new Logger(StoresConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly syncProducts: SyncProductsWorkflow,
    private readonly keywordDiscovery: KeywordDiscoveryWorkflow,
  ) {}

  @EventPattern(INIT_STORES_EVENT)
  async handleInit(@Payload() { storeId }: GenerateBlogsEvent) {
    this.logger.log(
      `Received ${INIT_STORES_EVENT} event for storeId=${storeId}`,
    );

    await this.prisma.store.update({
      where: { id: storeId },
      data: { status: StoreStatus.INITIALIZING },
    });

    try {
      this.logger.log(
        `Starting product sync and keyword discovery for storeId=${storeId}`,
      );

      await Promise.all([
        this.syncProducts.run(storeId),
        this.keywordDiscovery.run(storeId),
      ]);

      this.logger.log(
        `Product sync and keyword discovery finished for storeId=${storeId}`,
      );

      await this.prisma.store.update({
        where: { id: storeId },
        data: { status: StoreStatus.ACTIVE },
      });
      this.logger.log(`Store ${storeId} status updated to ACTIVE`);
    } catch (err: any) {
      this.logger.error(
        `Failed to initialize storeId=${storeId}: ${err.message}`,
        err.stack,
      );
      await this.prisma.store.update({
        where: { id: storeId },
        data: { status: StoreStatus.FAILED },
      });
      this.logger.warn(`Store ${storeId} status updated to FAILED`);
    }
  }
}
