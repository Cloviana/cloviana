import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { CreateCategoryUseCase } from "@/modules/catalog/application/create-category/create-category.use-case";
import { DeleteCategoryUseCase } from "@/modules/catalog/application/delete-category/delete-category.use-case";
import { GetCategoryImpactUseCase } from "@/modules/catalog/application/get-category-impact/get-category-impact.use-case";
import { GetCategoryUseCase } from "@/modules/catalog/application/get-category/get-category.use-case";
import { ListCategoriesUseCase } from "@/modules/catalog/application/list-categories/list-categories.use-case";
import { UpdateCategoryUseCase } from "@/modules/catalog/application/update-category/update-category.use-case";
import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { CurrentUser } from "@/platform/auth/decorators/current-user.decorator";

import { CreateCategoryDto } from "./dto/create-category.dto";
import { GetCategoryDto } from "./dto/get-category.dto";
import { ListCategoriesDto } from "./dto/list-categories.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("marketplaces/:slug/categories")
export class CategoriesController {
  constructor(
    private readonly listCategories: ListCategoriesUseCase,
    private readonly getCategory: GetCategoryUseCase,
    private readonly createCategory: CreateCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
    private readonly getCategoryImpact: GetCategoryImpactUseCase,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Query() query: ListCategoriesDto,
  ) {
    return this.listCategories.execute({ ...query, ownerId: user.sub, slug });
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Body() body: CreateCategoryDto,
  ) {
    return this.createCategory.execute({ ...body, ownerId: user.sub, slug });
  }

  @Get(":id")
  get(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("id", ParseUUIDPipe) categoryId: string,
    @Query() query: GetCategoryDto,
  ) {
    return this.getCategory.execute({
      ownerId: user.sub,
      slug,
      categoryId,
      includeHidden: query.includeHidden,
    });
  }

  @Get(":id/impact")
  impact(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("id", ParseUUIDPipe) categoryId: string,
  ) {
    return this.getCategoryImpact.execute({
      ownerId: user.sub,
      slug,
      categoryId,
    });
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("id", ParseUUIDPipe) categoryId: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.updateCategory.execute({
      ...body,
      ownerId: user.sub,
      slug,
      categoryId,
    });
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("id", ParseUUIDPipe) categoryId: string,
  ) {
    return this.deleteCategory.execute({ ownerId: user.sub, slug, categoryId });
  }
}
