import { randomInt } from "node:crypto";
import { StateConflictError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import {
  MARKETPLACE_REPOSITORY,
  type MarketplaceRepository,
} from "@/modules/marketplaces/application/ports/marketplace.repository.port";
import type { Marketplace } from "@/modules/marketplaces/domain/marketplace";
import { MarketplaceSlugConflictError } from "@/modules/marketplaces/domain/marketplace.errors";

export interface CreateMarketplaceInput {
  name: string;
  ownerId: string;
}

@Injectable()
export class CreateMarketplaceUseCase {
  constructor(
    @Inject(MARKETPLACE_REPOSITORY)
    private readonly marketplaces: MarketplaceRepository,
  ) {}

  async execute(input: CreateMarketplaceInput): Promise<Marketplace> {
    // The database is the source of truth for handle uniqueness; collisions are safe to retry
    // (a failed attempt rolls back entirely, and a new marketplace cannot clash on anything else).
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const slug = generateMarketplaceSlug();

      try {
        return await this.marketplaces.create({
          name: input.name,
          slug,
          ownerId: input.ownerId,
          status: "ACTIVE",
        });
      } catch (error) {
        if (!(error instanceof MarketplaceSlugConflictError)) {
          throw error;
        }
      }
    }

    throw new StateConflictError("Could not create a unique marketplace slug");
  }
}

function generateMarketplaceSlug(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const value = Array.from(
    { length: 8 },
    () => alphabet[randomInt(alphabet.length)],
  ).join("");

  return `${value.slice(0, 6)}-${value.slice(6, 8)}`;
}
