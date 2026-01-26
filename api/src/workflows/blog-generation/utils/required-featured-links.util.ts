import { Context } from "@/workflows/blog-generation/schemas/context.schema";
import { Outline } from "@/workflows/blog-generation/schemas/outline";

type Section = Outline["sections"][number];

function getFeaturedAssetIds(section: Section): string[] {
  if (!("featuredAssetIds" in section)) return [];
  const ids = (section as { featuredAssetIds?: string[] }).featuredAssetIds;
  return Array.isArray(ids) ? ids : [];
}

export function requiredFeaturedLinks(
  section: Section,
  context: Context,
): string[] {
  const ids = getFeaturedAssetIds(section);
  if (!ids.length) return [];

  const products = context.referenceMaterial.products;

  const links: string[] = [];

  for (const id of ids) {
    const p = products?.[id];
    const url = p?.url;
    const name = p?.title ?? "View product";
    if (url) links.push(`[${name}](${url})`);
  }

  return links;
}
