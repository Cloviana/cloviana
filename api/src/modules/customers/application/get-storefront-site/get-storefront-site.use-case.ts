import {
  AccessDeniedError,
  ResourceNotFoundError,
} from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";

import { StorefrontResolver } from "../ports/storefront-resolver.port";

export interface StorefrontSite {
  name: string;
  slug: string;
}

/** Public: tells a storefront which marketplace its host belongs to. Exposes nothing private. */
@Injectable()
export class GetStorefrontSiteUseCase {
  constructor(private readonly resolver: StorefrontResolver) {}

  async execute(host: string | undefined): Promise<StorefrontSite> {
    const tenant = await this.resolver.resolveHost(host);
    // A marketplace that is not live yet looks the same as one that does not exist.
    if (!tenant || tenant.status === "DRAFT") {
      throw new ResourceNotFoundError("Marketplace not found");
    }
    if (tenant.status === "SUSPENDED") {
      throw new AccessDeniedError("This marketplace is suspended");
    }
    return { name: tenant.name, slug: tenant.slug };
  }
}
