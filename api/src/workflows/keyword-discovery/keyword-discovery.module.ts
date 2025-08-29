import { Module } from "@nestjs/common";
import { KeywordDiscoveryWorkflow } from "./keyword-discovery.workflow";
import { CatalogModule } from "@/modules/commerce/catalog/catalog.module";
import { SerankingModule } from "@/modules/integrations/seranking/seranking.module";

@Module({
  imports: [CatalogModule, SerankingModule],
  providers: [KeywordDiscoveryWorkflow],
  exports: [KeywordDiscoveryWorkflow],
})
export class KeywordDiscoveryModule {}
