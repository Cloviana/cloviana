import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../store-metadata.state";
import { CatalogService } from "@/modules/catalog/catalog.service";

export async function fetchCollections(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const catalog = configurable?.catalog as CatalogService;
  if (!catalog) throw new Error("Catalog service not provided");

  const first = 250;
  const collections = await catalog.listAllCollections(
    state._shop,
    state._token,
    {
      first,
      query: undefined,
    },
  );

  return { _collections: collections };
}
