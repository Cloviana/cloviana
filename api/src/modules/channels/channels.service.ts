import { BadRequestException, Injectable } from "@nestjs/common";
import pRetry from "p-retry";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { StoresProducer } from "@/modules/messaging/producers/stores.producer";
import { ShopifyService } from "@/clients/shopify/shopify.service";
import {
  GetShopInfoDocument,
  GetShopInfoQuery,
  GetShopInfoQueryVariables,
} from "@/clients/shopify/generated";
import { AppConfiguration } from "@/config/app.configuration";

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storesProducer: StoresProducer,
    private readonly shopify: ShopifyService,
    private readonly config: AppConfiguration,
  ) {}

  async connectShopify(input: {
    storeId: string;
    shop: string;
    code: string;
    state: string;
  }) {
    const token = await this.exchangeCode(input.shop, input.code);
    const client = await this.shopify.getAdminClient(input.shop, token);
    const {
      shop: { name, myshopifyDomain },
    } = await pRetry(
      () =>
        client.request<GetShopInfoQuery, GetShopInfoQueryVariables>(
          GetShopInfoDocument,
        ),
      { retries: 5, factor: 2, minTimeout: 2000, maxTimeout: 4000 },
    );

    return this.prisma.$transaction(async (tx) => {
      const store = await tx.store.findUnique({ where: { id: input.storeId } });
      if (!store) throw new BadRequestException("Store not found");

      const existing = await tx.channel.findUnique({
        where: { shop: myshopifyDomain },
      });
      if (existing && existing.storeId !== store.id)
        throw new BadRequestException("Shop already linked to another store");

      const channel = existing
        ? await tx.channel.update({
            where: { id: existing.id },
            data: { storeId: store.id, config: { offlineAccessToken: token } },
          })
        : await tx.channel.create({
            data: {
              shop: myshopifyDomain,
              storeId: store.id,
              config: { offlineAccessToken: token },
            },
          });

      if (!existing) await this.storesProducer.init({ storeId: store.id });

      return {
        store_id: store.id,
        channel_id: channel.id,
        shop_domain: myshopifyDomain,
        shop_name: name,
        status: existing ? "UPDATED" : "CREATED",
      };
    });
  }

  private async exchangeCode(shop: string, code: string): Promise<string> {
    const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.config.shopifyApiKey,
        client_secret: this.config.shopifyApiSecret,
        code,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.access_token)
      throw new BadRequestException(`Token exchange failed: ${res.status}`);
    return data.access_token as string;
  }
}
