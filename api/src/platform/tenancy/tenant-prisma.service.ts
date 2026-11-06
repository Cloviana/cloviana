import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "@/platform/database/prisma/prisma.service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Runs queries as one marketplace. Inside `run`, Postgres Row Level Security filters every
 * tenant table to `marketplaceId`, regardless of what the query itself says.
 *
 * Use it for everything reachable from a storefront or vendor route. Platform-owner code
 * (platform_users, marketplaces) keeps using PrismaService directly.
 */
@Injectable()
export class TenantPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(
    marketplaceId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (!UUID.test(marketplaceId)) {
      throw new Error("Invalid marketplace id");
    }

    return this.prisma.$transaction(async (tx) => {
      // Both settings are transaction-local, so they cannot leak to the next request.
      await tx.$executeRawUnsafe("SET LOCAL ROLE cloviana_tenant");
      await tx.$queryRaw`SELECT set_config('app.marketplace_id', ${marketplaceId}, true)`;
      return fn(tx);
    });
  }
}
