import { Module } from "@nestjs/common";
import { StoreMetadataWorkflow } from "./store-metadata.workflow";
import { ShopifyCatalogModule } from "@/integrations/shopify/shopify-catalog.module";

@Module({
  imports: [ShopifyCatalogModule],
  providers: [StoreMetadataWorkflow],
  exports: [StoreMetadataWorkflow],
})
export class StoreMetadataModule {}
