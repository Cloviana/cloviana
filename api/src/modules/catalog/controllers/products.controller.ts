import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe, UseGuards, Param } from "@nestjs/common";
import { CatalogService } from "../catalog.service";
import { StoreOwnerGuard } from "@/guards/store-owner.guard";

@Controller("stores/:storeId/catalog/products")
@UseGuards(StoreOwnerGuard)
export class ProductsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  async findAll(
    @Param("storeId") storeId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.catalog.getProducts(storeId, { page, limit });
  }
}