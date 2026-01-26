import { ShopifyCatalogModule } from "@/integrations/shopify/shopify-catalog.module";
import { Module } from "@nestjs/common";
import { SyncCatalogWorkflow } from "./sync-catalog.workflow";

@Module({
  imports: [ShopifyCatalogModule],
  providers: [SyncCatalogWorkflow],
  exports: [SyncCatalogWorkflow],
})
export class SyncCatalogModule {}
