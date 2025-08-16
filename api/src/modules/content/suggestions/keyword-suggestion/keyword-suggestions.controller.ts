import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import { KeywordSuggestionsService } from "./keyword-suggestions.service";

@Controller("stores/:storeId/suggestions/keywords")
@UseGuards(StoreOwnerGuard)
export class KeywordSuggestionsController {
  constructor(private readonly svc: KeywordSuggestionsService) {}

  @Get()
  async list(
    @Param("storeId") storeId: string,
    @Query("blogId") blogId: string,
  ) {
    return this.svc.getKeywords(storeId, blogId);
  }
}
