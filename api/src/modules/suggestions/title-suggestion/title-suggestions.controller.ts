import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import { TitleSuggestionsService } from "./title-suggestions.service";

@Controller("stores/:storeId/suggestions/titles")
@UseGuards(StoreOwnerGuard)
export class TitleSuggestionsController {
  constructor(private readonly svc: TitleSuggestionsService) {}

  @Get()
  async list(
    @Param("storeId") storeId: string,
    @Query("blogId") blogId: string,
  ) {
    return this.svc.getTitles(storeId, blogId);
  }
}
