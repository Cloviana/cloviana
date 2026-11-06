import type { Customer, EnsureCustomerRecord } from "../../domain/customer";

export const CUSTOMER_REPOSITORY = Symbol("CUSTOMER_REPOSITORY");

export interface CustomerRepository {
  /** Returns the login's customer in this marketplace, creating it on first use. */
  ensureForMarketplaceUser(input: EnsureCustomerRecord): Promise<Customer>;
}
