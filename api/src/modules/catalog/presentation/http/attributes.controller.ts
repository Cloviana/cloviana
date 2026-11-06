import { Controller, Get, Param, Query } from "@nestjs/common";

import { ListAttributesUseCase } from "@/modules/catalog/application/list-attributes/list-attributes.use-case";
import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { CurrentUser } from "@/platform/auth/decorators/current-user.decorator";

import { ListAttributesDto } from "./dto/list-attributes.dto";

@Controller("marketplaces/:slug/attributes")
export class AttributesController {
  constructor(private readonly listAttributes: ListAttributesUseCase) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Query() query: ListAttributesDto,
  ) {
    return this.listAttributes.execute({ ...query, ownerId: user.sub, slug });
  }
}
