import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CatalogService } from "../catalog.service";

@Controller("stores/:storeId/catalog/products")
@UseGuards(StoreOwnerGuard)
export class ProductsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  async findAll(
    @Param("storeId") storeId: string,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("cursor") cursor?: string,
    @Query("q") q?: string,
  ) {
    return this.catalog.getProducts(storeId, { limit, cursor, q });
  }
}
