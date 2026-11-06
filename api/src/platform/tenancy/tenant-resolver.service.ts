import { Injectable } from "@nestjs/common";

import { AppConfiguration } from "@/platform/config/app.configuration";
import { PrismaService } from "@/platform/database/prisma/prisma.service";
import { hostnameOf } from "./request-host";
import type { Tenant } from "./tenant";

const TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;

const tenantSelect = {
  id: true,
  slug: true,
  name: true,
  status: true,
} as const;

/**
 * Maps a host to a marketplace: <slug>.<PLATFORM_BASE_DOMAIN>, or a verified custom domain.
 * Slugs are generated as "xxxxxx-xx", so they cannot collide with admin/api/auth/www.
 */
@Injectable()
export class TenantResolverService {
  // ponytail: per-instance cache; a renamed or removed domain is stale for up to TTL_MS.
  private readonly cache = new Map<
    string,
    { tenant: Tenant | null; expiresAt: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfiguration,
  ) {}

  async resolveHost(host: string | undefined | null): Promise<Tenant | null> {
    if (!host) {
      return null;
    }
    const hostname = hostnameOf(host);
    if (!hostname) {
      return null;
    }

    const cached = this.cache.get(hostname);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tenant;
    }

    const tenant = await this.lookup(hostname);
    if (this.cache.size >= MAX_ENTRIES) {
      this.cache.clear();
    }
    this.cache.set(hostname, { tenant, expiresAt: Date.now() + TTL_MS });
    return tenant;
  }

  private async lookup(hostname: string): Promise<Tenant | null> {
    const base = this.config.platformBaseDomain.toLowerCase();
    const suffix = `.${base}`;

    let marketplace: {
      id: string;
      slug: string;
      name: string;
      status: Tenant["status"];
    } | null = null;

    if (hostname.endsWith(suffix)) {
      const slug = hostname.slice(0, -suffix.length);
      if (slug && !slug.includes(".")) {
        marketplace = await this.prisma.marketplace.findUnique({
          where: { slug },
          select: tenantSelect,
        });
      }
    } else {
      const domain = await this.prisma.marketplaceDomain.findFirst({
        where: { hostname, verifiedAt: { not: null } },
        select: { marketplace: { select: tenantSelect } },
      });
      marketplace = domain?.marketplace ?? null;
    }

    if (!marketplace || marketplace.status === "ARCHIVED") {
      return null;
    }

    return {
      marketplaceId: marketplace.id,
      slug: marketplace.slug,
      name: marketplace.name,
      status: marketplace.status,
      hostname,
    };
  }
}
