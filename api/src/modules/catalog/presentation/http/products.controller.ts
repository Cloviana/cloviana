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

import { ArchiveProductUseCase } from "@/modules/catalog/application/archive-product/archive-product.use-case";
import { CreateProductUseCase } from "@/modules/catalog/application/create-product/create-product.use-case";
import { DeleteProductUseCase } from "@/modules/catalog/application/delete-product/delete-product.use-case";
import { DeleteProductsUseCase } from "@/modules/catalog/application/delete-products/delete-products.use-case";
import { GetProductUseCase } from "@/modules/catalog/application/get-product/get-product.use-case";
import { ListProductsUseCase } from "@/modules/catalog/application/list-products/list-products.use-case";
import { SetProductsStatusUseCase } from "@/modules/catalog/application/set-products-status/set-products-status.use-case";
import { UnarchiveProductUseCase } from "@/modules/catalog/application/unarchive-product/unarchive-product.use-case";
import { UpdateProductUseCase } from "@/modules/catalog/application/update-product/update-product.use-case";
import { CreateProductDto } from "@/modules/catalog/presentation/http/dto/create-product.dto";
import { DeleteProductsDto } from "@/modules/catalog/presentation/http/dto/delete-products.dto";
import { ListProductsDto } from "@/modules/catalog/presentation/http/dto/list-products.dto";
import { SetProductsStatusDto } from "@/modules/catalog/presentation/http/dto/set-products-status.dto";
import { UpdateProductDto } from "@/modules/catalog/presentation/http/dto/update-product.dto";
import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { CurrentUser } from "@/platform/auth/decorators/current-user.decorator";

@Controller("marketplaces/:slug/products")
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly archiveProduct: ArchiveProductUseCase,
    private readonly unarchiveProduct: UnarchiveProductUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
    private readonly setProductsStatus: SetProductsStatusUseCase,
    private readonly deleteProducts: DeleteProductsUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Query() query: ListProductsDto,
  ) {
    return this.listProducts.execute({ ...query, ownerId: user.sub, slug });
  }

  @Get(":id")
  get(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("id", ParseUUIDPipe) productId: string,
  ) {
    return this.getProduct.execute({ ownerId: user.sub, slug, productId });
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("id", ParseUUIDPipe) productId: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.updateProduct.execute({
      ...body,
      ownerId: user.sub,
      slug,
      productId,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Body() body: CreateProductDto,
  ) {
    return this.createProduct.execute({ ownerId: user.sub, slug, ...body });
  }

  @Post("delete")
  @HttpCode(HttpStatus.OK)
  deleteMany(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Body() body: DeleteProductsDto,
  ) {
    return this.deleteProducts.execute({ ownerId: user.sub, slug, ...body });
  }

  @Post("status")
  @HttpCode(HttpStatus.OK)
  setStatus(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Body() body: SetProductsStatusDto,
  ) {
    return this.setProductsStatus.execute({ ownerId: user.sub, slug, ...body });
  }

  @Post(":id/archive")
  @HttpCode(HttpStatus.NO_CONTENT)
  archive(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("id", ParseUUIDPipe) productId: string,
  ) {
    return this.archiveProduct.execute({ ownerId: user.sub, slug, productId });
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("id", ParseUUIDPipe) productId: string,
  ) {
    return this.deleteProduct.execute({ ownerId: user.sub, slug, productId });
  }

  @Post(":id/unarchive")
  @HttpCode(HttpStatus.NO_CONTENT)
  unarchive(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("id", ParseUUIDPipe) productId: string,
  ) {
    return this.unarchiveProduct.execute({
      ownerId: user.sub,
      slug,
      productId,
    });
  }
}
