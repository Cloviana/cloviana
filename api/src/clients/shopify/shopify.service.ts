import { Injectable } from "@nestjs/common";
import { GraphQLClient } from "graphql-request";

type ShopQuery = { shop: { name: string } };

@Injectable()
export class ShopifyService {
  private normalizeDomain(domain: string) {
    return domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  }

  async getAdminClient(
    shopDomain: string,
    accessToken: string,
    apiVersion = "2025-07"
  ) {
    const adminUrl = `https://${this.normalizeDomain(shopDomain)}/admin/api/${apiVersion}/graphql.json`;
    const client = new GraphQLClient(adminUrl);
    client.setHeader("X-Shopify-Access-Token", accessToken);
    await client.rawRequest<ShopQuery>("query { shop { name } }");
    return client;
  }
}
