import { Injectable, Logger } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';

type ShopQuery = { shop: { name: string } };

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name, { timestamp: true });
  private readonly clients = new Map<string, GraphQLClient>();

  private normalizeDomain(domain: string) {
    return domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }

  async getAdminClient(shopDomain: string, accessToken: string, apiVersion = '2025-07') {
    const key = `${this.normalizeDomain(shopDomain)}|${apiVersion}`;
    const existing = this.clients.get(key);
    if (existing) return existing;

    const adminUrl = `https://${this.normalizeDomain(shopDomain)}/admin/api/${apiVersion}/graphql.json`;

    const client = new GraphQLClient(adminUrl, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });

    const { data } = await client.rawRequest<ShopQuery>('query { shop { name } }');
    this.logger.log(`Connected to Shopify shop "${data.shop.name}" (${adminUrl})`);
    this.clients.set(key, client);
    return client;
  }
}
