import { ShopifyCatalogModule } from "@/integrations/shopify/shopify-catalog.module";
import { Module } from "@nestjs/common";
import { StoreMetadataWorkflow } from "./store-metadata.workflow";

@Module({
  imports: [ShopifyCatalogModule],
  providers: [StoreMetadataWorkflow],
  exports: [StoreMetadataWorkflow],
})
export class StoreMetadataModule {}
