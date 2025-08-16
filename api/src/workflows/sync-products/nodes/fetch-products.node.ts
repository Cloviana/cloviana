import { RunnableConfig } from '@langchain/core/runnables';
import { StateAnnotation } from '../sync-products.state';
import { ShopifyService } from '@/clients/shopify/shopify.service';
import {
  Product,
  ProductsDocument,
  ProductsQuery,
  ProductsQueryVariables,
} from '@/clients/shopify/generated';
import pRetry from 'p-retry';

export async function fetchProducts(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig
): Promise<Partial<typeof StateAnnotation.State>> {
  const shopify = configurable?.shopify as ShopifyService;
  if (!shopify) throw new Error("Shopify client not provided");

  const client = await shopify.getAdminClient(state._shop, state._token);

  const first = 250;
  let after: string | null = null;
  const all: Product[] = [];

  do {
    const { data } = await pRetry(
      () =>
        client.rawRequest<ProductsQuery, ProductsQueryVariables>(
          ProductsDocument,
          { first, after, query: undefined }
        ),
      {
        retries: 5,
        factor: 2, 
        minTimeout: 500,
        maxTimeout: 4000, 
        onFailedAttempt: (err) => {
          console.warn(
            `Products fetch failed (attempt ${err.attemptNumber}): ${err.message}`
          );
        },
      }
    );

    all.push(...(data.products.nodes as Product[]));
    after = data.products.pageInfo.hasNextPage
      ? data.products.pageInfo.endCursor ?? null
      : null;
  } while (after);

  return { _products: all };
}
