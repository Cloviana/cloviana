import { Injectable } from "@nestjs/common";
import { ShopifyService } from "@/clients/shopify/shopify.service";
import {
  ProductsDocument,
  ProductsQuery,
  ProductsQueryVariables,
  Product,
  CollectionsDocument,
  CollectionsQuery,
  CollectionsQueryVariables,
  Collection,
} from "@/clients/shopify/generated";
import pRetry from "p-retry";

@Injectable()
export class CatalogService {
  constructor(private readonly shopify: ShopifyService) {}

  async listAllProducts(
    shop: string,
    token: string,
    opts?: { query?: string; first?: number },
  ): Promise<Product[]> {
    const client = await this.shopify.getAdminClient(shop, token);
    const first = opts?.first ?? 250;
    let after: string | null = null;
    const all: Product[] = [];
    do {
      const data = await pRetry(
        () =>
          client.request<ProductsQuery, ProductsQueryVariables>(
            ProductsDocument,
            { first, after: after ?? undefined, query: opts?.query },
          ),
        { retries: 5, factor: 2, minTimeout: 2000, maxTimeout: 4000 },
      );
      all.push(...(data.products.nodes as Product[]));
      after = data.products.pageInfo.hasNextPage
        ? (data.products.pageInfo.endCursor ?? null)
        : null;
    } while (after);
    return all;
  }

  async listAllCollections(
    shop: string,
    token: string,
    opts?: { query?: string; first?: number },
  ): Promise<Collection[]> {
    const client = await this.shopify.getAdminClient(shop, token);
    const first = opts?.first ?? 250;
    let after: string | null = null;
    const all: Collection[] = [];
    do {
      const data = await pRetry(
        () =>
          client.request<CollectionsQuery, CollectionsQueryVariables>(
            CollectionsDocument,
            { first, after: after ?? undefined, query: opts?.query },
          ),
        { retries: 5, factor: 2, minTimeout: 500, maxTimeout: 4000 },
      );
      all.push(...(data.collections.nodes as Collection[]));
      after = data.collections.pageInfo.hasNextPage
        ? (data.collections.pageInfo.endCursor ?? null)
        : null;
    } while (after);
    return all;
  }
}
