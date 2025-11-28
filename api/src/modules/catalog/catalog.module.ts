import { Module } from "@nestjs/common";
import { SyncCatalogModule } from "@/workflows";
import { CatalogService } from "./catalog.service";
import { ProductsController } from "./controllers/products.controller";
import { CollectionsController } from "./controllers/collections.controller";
import { CatalogResyncScheduler } from "./schedules/catalog-resync.scheduler";

@Module({
  imports: [SyncCatalogModule],
  controllers: [ProductsController, CollectionsController],
  providers: [CatalogService, CatalogResyncScheduler],
  exports: [CatalogService],
})
export class CatalogModule {}
