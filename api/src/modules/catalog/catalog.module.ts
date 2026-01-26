import { SyncCatalogModule } from "@/workflows";
import { Module } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { ProductsController } from "./controllers/products.controller";
import { CatalogResyncScheduler } from "./schedules/catalog-resync.scheduler";

@Module({
  imports: [SyncCatalogModule],
  controllers: [ProductsController],
  providers: [CatalogService, CatalogResyncScheduler],
  exports: [CatalogService],
})
export class CatalogModule {}
