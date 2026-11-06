import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";

import { GetCollectionUseCase } from "@/modules/catalog/application/get-collection/get-collection.use-case";
import { ListCollectionsUseCase } from "@/modules/catalog/application/list-collections/list-collections.use-case";
import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { CurrentUser } from "@/platform/auth/decorators/current-user.decorator";

import { ListCollectionsDto } from "./dto/list-collections.dto";

@Controller("marketplaces/:slug/collections")
export class CollectionsController {
  constructor(
    private readonly listCollections: ListCollectionsUseCase,
    private readonly getCollection: GetCollectionUseCase,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Query() query: ListCollectionsDto,
  ) {
    return this.listCollections.execute({ ...query, ownerId: user.sub, slug });
  }

  @Get(":id")
  get(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("id", ParseUUIDPipe) collectionId: string,
  ) {
    return this.getCollection.execute({
      ownerId: user.sub,
      slug,
      collectionId,
    });
  }
}
