import { ShopifyModule } from "@/clients/shopify/shopify.module";
import { Module } from "@nestjs/common";
import { ShopifyCatalogService } from "./shopify-catalog.service";

@Module({
  imports: [ShopifyModule],
  providers: [ShopifyCatalogService],
  exports: [ShopifyCatalogService],
})
export class ShopifyCatalogModule {}
