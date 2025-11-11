import { SYNC_PRODUCTS_EVENT } from "@/constants/rabbitmq.constants";
import { SyncProductsWorkflow } from "@/workflows/sync-products/sync-products.workflow";
import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";

interface GenerateBlogsEvent {
  storeId: string;
}

@Controller()
export class ProductsConsumer {
  private readonly logger = new Logger(ProductsConsumer.name);

  constructor(private readonly syncProducts: SyncProductsWorkflow) {}

  @EventPattern(SYNC_PRODUCTS_EVENT)
  async handleSync(@Payload() { storeId }: GenerateBlogsEvent) {
    this.logger.log(
      `Received ${SYNC_PRODUCTS_EVENT} event for storeId=${storeId}`,
    );
    try {
      this.logger.log(`Starting product sync for storeId=${storeId}`);

      await this.syncProducts.run(storeId);

      this.logger.log(`Product sync finished for storeId=${storeId}`);
    } catch (err: any) {
      this.logger.error(
        `Failed to sync products storeId=${storeId}: ${err.message}`,
        err.stack,
      );
    }
  }
}
