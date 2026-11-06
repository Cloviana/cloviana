/** A product or category handle is already used in the marketplace. */
export class CatalogHandleConflictError extends Error {
  constructor() {
    super("Catalog handle is already in use");
    this.name = "CatalogHandleConflictError";
  }
}

/** A product variant SKU is already used in the marketplace. */
export class VariantSkuConflictError extends Error {
  constructor() {
    super("Variant SKU is already in use");
    this.name = "VariantSkuConflictError";
  }
}
