import { ShopifyCatalogService } from "@/integrations/shopify/shopify-catalog.service";
import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../sync-catalog.state";

export async function fetchCollections(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const catalog = configurable?.catalog as ShopifyCatalogService;
  if (!catalog) throw new Error("Catalog service not provided");

  const collections = await catalog.listAllCollections(
    state._shop,
    state._token,
  );

  return { _collections: collections };
}
