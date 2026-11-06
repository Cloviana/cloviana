import type { MarketplaceStatus } from "@prisma/client";

/** The marketplace a request is addressed to, resolved from its host. */
export interface Tenant {
  marketplaceId: string;
  slug: string;
  name: string;
  status: MarketplaceStatus;
  /** Lowercased host without port. */
  hostname: string;
}
