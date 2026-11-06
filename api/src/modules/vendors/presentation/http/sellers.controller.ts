import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { CreateSellerUseCase } from "@/modules/vendors/application/create-seller/create-seller.use-case";
import { ListSellersUseCase } from "@/modules/vendors/application/list-sellers/list-sellers.use-case";
import { ResendSellerInviteUseCase } from "@/modules/vendors/application/resend-seller-invite/resend-seller-invite.use-case";
import { UpdateSellersUseCase } from "@/modules/vendors/application/update-sellers/update-sellers.use-case";
import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { CurrentUser } from "@/platform/auth/decorators/current-user.decorator";

import { CreateSellerDto } from "./dto/create-seller.dto";
import { ListSellersDto } from "./dto/list-sellers.dto";
import { ResendSellerInviteDto } from "./dto/resend-seller-invite.dto";
import { UpdateSellersDto } from "./dto/update-sellers.dto";

@Controller("marketplaces/:slug/sellers")
export class SellersController {
  constructor(
    private readonly listSellers: ListSellersUseCase,
    private readonly createSeller: CreateSellerUseCase,
    private readonly resendInvite: ResendSellerInviteUseCase,
    private readonly updateSellers: UpdateSellersUseCase,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Query() query: ListSellersDto,
  ) {
    return this.listSellers.execute({ ...query, ownerId: user.sub, slug });
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Body() body: CreateSellerDto,
  ) {
    return this.createSeller.execute({ ...body, ownerId: user.sub, slug });
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  update(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Body() body: UpdateSellersDto,
  ) {
    return this.updateSellers.execute({ ownerId: user.sub, slug, ...body });
  }

  @Post(":sellerId/invites")
  @HttpCode(HttpStatus.OK)
  resend(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("sellerId", ParseUUIDPipe) sellerId: string,
    @Body() body: ResendSellerInviteDto,
  ) {
    return this.resendInvite.execute({
      ownerId: user.sub,
      slug,
      sellerId,
      email: body.email,
    });
  }
}
