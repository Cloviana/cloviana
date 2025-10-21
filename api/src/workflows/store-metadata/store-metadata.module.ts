import { Module } from "@nestjs/common";
import { StoreMetadataWorkflow } from "./store-metadata.workflow";
import { CatalogModule } from "@/modules/catalog/catalog.module";

@Module({
  imports: [CatalogModule],
  providers: [StoreMetadataWorkflow],
  exports: [StoreMetadataWorkflow],
})
export class StoreMetadataModule {}
