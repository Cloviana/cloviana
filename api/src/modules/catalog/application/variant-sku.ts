import { StateConflictError } from "@/shared/errors/application-error";
import { VariantSkuConflictError } from "../domain/catalog.errors";
import { hasUniqueVariantSkus } from "../domain/variant-sku";

import type { ProductVariantEdit } from "../domain/product";

export function assertUniqueVariantSkus(
  variants: ProductVariantEdit[] = [],
): void {
  if (!hasUniqueVariantSkus(variants)) {
    throw new StateConflictError(
      "A variant with this SKU already exists in this marketplace.",
    );
  }
}

export function isSkuConflict(error: unknown): boolean {
  return error instanceof VariantSkuConflictError;
}
