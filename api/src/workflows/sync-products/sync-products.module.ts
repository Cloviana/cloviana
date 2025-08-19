import { Module } from "@nestjs/common";
import { SyncProductsWorkflow } from "./sync-products.workflow";
import { CatalogModule } from "@/modules/commerce/catalog/catalog.module";

@Module({
  imports: [CatalogModule],
  providers: [SyncProductsWorkflow],
  exports: [SyncProductsWorkflow],
})
export class SyncProductsModule {}
