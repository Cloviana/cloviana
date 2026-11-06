import type { ProductVariantEdit } from "./product";

export function normalizeSku(value?: string | null): string | null {
  return value?.trim().toUpperCase() || null;
}

export function hasUniqueVariantSkus(
  variants: ProductVariantEdit[] = [],
): boolean {
  const skus = variants
    .map((variant) => normalizeSku(variant.sku))
    .filter((sku): sku is string => sku !== null);
  return new Set(skus).size === skus.length;
}
