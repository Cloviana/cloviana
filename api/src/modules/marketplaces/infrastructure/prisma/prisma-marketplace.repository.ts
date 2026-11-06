import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { MarketplaceRepository } from "@/modules/marketplaces/application/ports/marketplace.repository.port";
import type {
  CreateMarketplaceRecord,
  Marketplace,
} from "@/modules/marketplaces/domain/marketplace";
import {
  DEFAULT_COMMISSION_RATE,
  DEFAULT_ROLE,
  SEQUENCE_NAMES,
} from "@/modules/marketplaces/domain/marketplace-defaults";
import { MarketplaceSlugConflictError } from "@/modules/marketplaces/domain/marketplace.errors";
import { PrismaService } from "@/platform/database/prisma/prisma.service";

@Injectable()
export class PrismaMarketplaceRepository implements MarketplaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateMarketplaceRecord): Promise<Marketplace> {
    // Platform-owner write: runs as the privileged role, so RLS does not apply here.
    return this.prisma.$transaction(async (tx) => {
      const marketplace = await tx.marketplace
        .create({ data: input })
        .catch((error: unknown) => {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            throw new MarketplaceSlugConflictError();
          }
          throw error;
        });
      const marketplaceId = marketplace.id;

      await tx.role.create({
        data: {
          marketplaceId,
          name: DEFAULT_ROLE.name,
          description: DEFAULT_ROLE.description,
          permissions: [...DEFAULT_ROLE.permissions],
          isSystem: true,
        },
      });
      await tx.commissionRate.create({
        data: {
          marketplaceId,
          name: DEFAULT_COMMISSION_RATE.name,
          code: DEFAULT_COMMISSION_RATE.code,
          type: "PERCENTAGE",
          value: DEFAULT_COMMISSION_RATE.percentage,
          isDefault: true,
        },
      });
      await tx.marketplaceSequence.createMany({
        data: SEQUENCE_NAMES.map((name) => ({ marketplaceId, name })),
      });

      return marketplace;
    });
  }

  findByOwnerAndSlug(
    ownerId: string,
    slug: string,
  ): Promise<Marketplace | null> {
    return this.prisma.marketplace.findFirst({ where: { ownerId, slug } });
  }

  findByOwner(ownerId: string): Promise<Marketplace[]> {
    return this.prisma.marketplace.findMany({
      where: { ownerId },
      orderBy: { createdAt: "asc" },
    });
  }
}
