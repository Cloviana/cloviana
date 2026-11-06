import type { FastifyRequest } from "fastify";

import type { Tenant } from "@/platform/tenancy/tenant";

/** The shared marketplace-realm login (Better Auth user). */
export interface MarketplaceSessionUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

/** A valid session on a known marketplace host. */
export interface MarketplacePrincipalSession {
  tenant: Tenant;
  marketplaceUser: MarketplaceSessionUser;
}

/** Who is acting inside one marketplace. */
export type MarketplacePrincipal =
  | {
      kind: "customer";
      marketplaceId: string;
      marketplaceUserId: string;
      customerId: string;
    }
  | {
      kind: "member";
      marketplaceId: string;
      marketplaceUserId: string;
      memberId: string;
    };

export type MarketplaceRequest = FastifyRequest & {
  marketplaceSession?: MarketplacePrincipalSession;
  principal?: MarketplacePrincipal;
};
