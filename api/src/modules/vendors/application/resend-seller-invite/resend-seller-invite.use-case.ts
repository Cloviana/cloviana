import {
  ResourceNotFoundError,
  StateConflictError,
} from "@/shared/errors/application-error";
import { Inject, Injectable } from "@nestjs/common";

import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import {
  SELLER_REPOSITORY,
  type SellerRepository,
} from "@/modules/vendors/application/ports/seller.repository.port";
import { issueOwnerInvite } from "@/modules/vendors/domain/owner-invite";
import type { Seller } from "@/modules/vendors/domain/seller";
import { SellerInviteNotifier } from "../ports/seller-invite-notifier.port";

export interface ResendSellerInviteInput {
  ownerId: string;
  slug: string;
  sellerId: string;
  email: string;
}

@Injectable()
export class ResendSellerInviteUseCase {
  constructor(
    private readonly getMarketplace: GetMarketplaceUseCase,
    @Inject(SELLER_REPOSITORY) private readonly sellers: SellerRepository,
    private readonly mailer: SellerInviteNotifier,
  ) {}

  async execute(input: ResendSellerInviteInput): Promise<Seller> {
    const marketplace = await this.getMarketplace.execute(input);

    if (await this.sellers.hasOwner(marketplace.id, input.sellerId)) {
      throw new StateConflictError("This store already has an owner");
    }

    const now = new Date();
    const { token, invite } = issueOwnerInvite(input.email, now);
    const seller = await this.sellers.replaceOwnerInvite(
      marketplace.id,
      input.sellerId,
      invite,
      now,
    );
    if (!seller) {
      throw new ResourceNotFoundError("Store not found");
    }

    await this.mailer.send({
      to: input.email,
      slug: marketplace.slug,
      marketplaceName: marketplace.name,
      sellerName: seller.name,
      token,
      expiresAt: invite.expiresAt,
    });
    return seller;
  }
}
