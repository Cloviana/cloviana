import { ShopifyModule } from "@/clients/shopify/shopify.module";
import { Module } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Module({
  imports: [ShopifyModule],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
