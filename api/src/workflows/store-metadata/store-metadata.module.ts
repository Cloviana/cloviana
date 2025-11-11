import { CatalogModule } from "@/modules/catalog/catalog.module";
import { Module } from "@nestjs/common";
import { StoreMetadataWorkflow } from "./store-metadata.workflow";

@Module({
  imports: [CatalogModule],
  providers: [StoreMetadataWorkflow],
  exports: [StoreMetadataWorkflow],
})
export class StoreMetadataModule {}
