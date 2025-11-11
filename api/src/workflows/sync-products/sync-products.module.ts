import { CatalogModule } from "@/modules/catalog/catalog.module";
import { Module } from "@nestjs/common";
import { SyncProductsWorkflow } from "./sync-products.workflow";

@Module({
  imports: [CatalogModule],
  providers: [SyncProductsWorkflow],
  exports: [SyncProductsWorkflow],
})
export class SyncProductsModule {}
