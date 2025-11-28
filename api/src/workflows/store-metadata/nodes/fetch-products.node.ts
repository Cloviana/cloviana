import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../store-metadata.state";
import { ShopifyCatalogService } from "@/integrations/shopify/shopify-catalog.service";

export async function fetchProducts(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const catalog = configurable?.catalog as ShopifyCatalogService;
  if (!catalog) throw new Error("Catalog service not provided");

  const first = 250;
  const products = await catalog.listAllProducts(state._shop, state._token, {
    first,
    query: undefined,
  });

  return { _products: products };
}
