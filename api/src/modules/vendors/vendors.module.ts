import { Module } from "@nestjs/common";

import { ResendModule } from "@/integrations/resend/resend.module";
import { MarketplacesModule } from "@/modules/marketplaces/marketplaces.module";
import { MarketplaceAuthModule } from "@/platform/auth/marketplace/marketplace-auth.module";
import { AcceptInviteUseCase } from "./application/accept-invite/accept-invite.use-case";
import { CreateSellerUseCase } from "./application/create-seller/create-seller.use-case";
import { GetMemberUseCase } from "./application/get-member/get-member.use-case";
import { ListSellersUseCase } from "./application/list-sellers/list-sellers.use-case";
import { MEMBER_REPOSITORY } from "./application/ports/member.repository.port";
import { SellerInviteNotifier } from "./application/ports/seller-invite-notifier.port";
import { SELLER_REPOSITORY } from "./application/ports/seller.repository.port";
import { ResendSellerInviteUseCase } from "./application/resend-seller-invite/resend-seller-invite.use-case";
import { UpdateSellersUseCase } from "./application/update-sellers/update-sellers.use-case";
import { SellerInviteMailer } from "./infrastructure/mail/seller-invite.mailer";
import { PrismaMemberRepository } from "./infrastructure/prisma/prisma-member.repository";
import { PrismaSellerRepository } from "./infrastructure/prisma/prisma-seller.repository";
import { SellersController } from "./presentation/http/sellers.controller";
import { VendorAuthGuard } from "./presentation/http/vendor-auth.guard";
import { VendorController } from "./presentation/http/vendor.controller";

@Module({
  imports: [MarketplaceAuthModule, MarketplacesModule, ResendModule],
  controllers: [VendorController, SellersController],
  providers: [
    AcceptInviteUseCase,
    GetMemberUseCase,
    ListSellersUseCase,
    CreateSellerUseCase,
    ResendSellerInviteUseCase,
    UpdateSellersUseCase,
    { provide: SellerInviteNotifier, useClass: SellerInviteMailer },
    VendorAuthGuard,
    { provide: MEMBER_REPOSITORY, useClass: PrismaMemberRepository },
    { provide: SELLER_REPOSITORY, useClass: PrismaSellerRepository },
  ],
})
export class VendorsModule {}
