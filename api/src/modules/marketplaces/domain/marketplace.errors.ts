/** The generated marketplace slug is already in use. */
export class MarketplaceSlugConflictError extends Error {
  constructor() {
    super("Marketplace slug is already in use");
    this.name = "MarketplaceSlugConflictError";
  }
}
