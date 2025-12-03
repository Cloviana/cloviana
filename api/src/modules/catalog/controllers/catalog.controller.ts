import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe, UseGuards, Param } from "@nestjs/common";
import { CatalogService } from "../catalog.service";
import { StoreOwnerGuard } from "@/guards/store-owner.guard";

@Controller("stores/:storeId/catalog")
@UseGuards(StoreOwnerGuard)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("search")
  async search(
    @Param("storeId") storeId: string,
    @Query("q") query: string,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim().length === 0) {
      return { products: [], collections: [] };
    }

    return this.catalog.searchCatalog(storeId, query, limit);
  }
}