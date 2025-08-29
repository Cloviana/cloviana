import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import { TopicSuggestionsService } from "./topic-suggestions.service";

@Controller("stores/:storeId/suggestions/topics")
@UseGuards(StoreOwnerGuard)
export class TopicSuggestionsController {
  constructor(private readonly svc: TopicSuggestionsService) {}

  @Get()
  async list(@Param("storeId") storeId: string) {
    return this.svc.getTopics(storeId);
  }
}
