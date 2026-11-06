/** A seller could not be created because its handle is already in use. */
export class SellerHandleConflictError extends Error {
  constructor() {
    super("Seller handle is already in use");
    this.name = "SellerHandleConflictError";
  }
}
