import "@shopify/shopify-api/adapters/node";

import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { ShopifyService } from "./shopify.service";
import { AppConfiguration } from "@/config/app.configuration";
import { SCOPES } from "./shopify.constants";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "SHOPIFY_CLIENT",
      useFactory: (config: AppConfiguration) =>
        shopifyApi({
          apiKey: config.shopifyApiKey,
          apiSecretKey: config.shopifyApiSecret,
          scopes: SCOPES,
          hostName: config.shopifyHost,
          apiVersion: LATEST_API_VERSION,
          isEmbeddedApp: false,
        }),
      inject: [AppConfiguration],
    },
    ShopifyService,
  ],
  exports: ["SHOPIFY_CLIENT", ShopifyService],
})
export class ShopifyModule {}
