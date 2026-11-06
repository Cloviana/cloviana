import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";

import { CreateMarketplaceUseCase } from "@/modules/marketplaces/application/create-marketplace/create-marketplace.use-case";
import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import { ListMarketplacesUseCase } from "@/modules/marketplaces/application/list-marketplaces/list-marketplaces.use-case";
import { CreateMarketplaceDto } from "@/modules/marketplaces/presentation/http/dto/create-marketplace.dto";
import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { CurrentUser } from "@/platform/auth/decorators/current-user.decorator";

@Controller("marketplaces")
export class MarketplacesController {
  constructor(
    private readonly createMarketplace: CreateMarketplaceUseCase,
    private readonly listMarketplaces: ListMarketplacesUseCase,
    private readonly getMarketplace: GetMarketplaceUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.listMarketplaces.execute({ ownerId: user.sub });
  }

  @Get(":slug")
  get(@CurrentUser() user: AuthUser, @Param("slug") slug: string) {
    return this.getMarketplace.execute({ ownerId: user.sub, slug });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() body: CreateMarketplaceDto) {
    return this.createMarketplace.execute({
      name: body.name,
      ownerId: user.sub,
    });
  }
}
