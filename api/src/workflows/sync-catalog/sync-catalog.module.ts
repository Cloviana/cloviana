import { Module } from "@nestjs/common";
import { SyncCatalogWorkflow } from "./sync-catalog.workflow";
import { ShopifyCatalogModule } from "@/integrations/shopify/shopify-catalog.module";

@Module({
  imports: [ShopifyCatalogModule],
  providers: [SyncCatalogWorkflow],
  exports: [SyncCatalogWorkflow],
})
export class SyncCatalogModule {}
