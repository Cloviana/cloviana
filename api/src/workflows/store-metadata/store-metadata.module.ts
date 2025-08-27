import { Module } from "@nestjs/common";
import { StoreMetadataWorkflow } from "./store-metadata.workflow";
import { CatalogModule } from "@/modules/commerce/catalog/catalog.module";

@Module({
  imports: [CatalogModule],
  providers: [StoreMetadataWorkflow],
  exports: [StoreMetadataWorkflow],
})
export class StoreMetadataModule {}
