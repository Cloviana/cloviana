import { randomInt } from "node:crypto";
import { StateConflictError } from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import {
  SELLER_REPOSITORY,
  type SellerRepository,
} from "@/modules/vendors/application/ports/seller.repository.port";
import { issueOwnerInvite } from "@/modules/vendors/domain/owner-invite";
import type { Seller } from "@/modules/vendors/domain/seller";
import { slugifyHandle } from "@/modules/vendors/domain/seller-handle";
import { SellerHandleConflictError } from "@/modules/vendors/domain/seller.errors";
import { SellerInviteNotifier } from "../ports/seller-invite-notifier.port";

export interface CreateSellerInput {
  ownerId: string;
  slug: string;
  name: string;
  handle?: string;
  email: string;
  phone?: string;
  currencyCode: string;
  adminEmail: string;
}

const MAX_HANDLE_ATTEMPTS = 10;

@Injectable()
export class CreateSellerUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(SELLER_REPOSITORY) private readonly sellers: SellerRepository,
    private readonly mailer: SellerInviteNotifier,
  ) {}

  async execute(input: CreateSellerInput): Promise<Seller> {
    const marketplace = await this.getMarketplace.execute(input);
    const now = new Date();
    const { token, invite } = issueOwnerInvite(input.adminEmail, now);

    const seller = await this.create(marketplace.id, input, invite);

    // After commit, so a rollback can never leave an email pointing at nothing.
    await this.mailer.send({
      to: input.adminEmail,
      slug: marketplace.slug,
      marketplaceName: marketplace.name,
      sellerName: seller.name,
      token,
      expiresAt: invite.expiresAt,
    });
    return seller;
  }

  private async create(
    marketplaceId: string,
    input: CreateSellerInput,
    invite: ReturnType<typeof issueOwnerInvite>["invite"],
  ): Promise<Seller> {
    const base = {
      marketplaceId,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      currencyCode: input.currencyCode,
    };

    // A handle the owner typed is theirs to fix; a generated one is safe to retry with a suffix.
    if (input.handle) {
      try {
        return await this.sellers.createWithOwnerInvite(
          { ...base, handle: input.handle },
          invite,
        );
      } catch (error) {
        if (isUniqueConflict(error)) {
          throw new StateConflictError("This handle is already taken");
        }
        throw error;
      }
    }

    const stem = slugifyHandle(input.name);
    for (let attempt = 0; attempt < MAX_HANDLE_ATTEMPTS; attempt += 1) {
      const handle = attempt === 0 ? stem : `${stem}-${randomSuffix()}`;
      try {
        return await this.sellers.createWithOwnerInvite(
          { ...base, handle },
          invite,
        );
      } catch (error) {
        if (!isUniqueConflict(error)) {
          throw error;
        }
      }
    }
    throw new StateConflictError("Could not generate a unique handle");
  }
}

function randomSuffix(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length: 4 },
    () => alphabet[randomInt(alphabet.length)],
  ).join("");
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof SellerHandleConflictError;
}
