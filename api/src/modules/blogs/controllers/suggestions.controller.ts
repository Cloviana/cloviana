import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SuggestionsService } from "../services/suggestions.service";

@Controller("stores/:storeId/blogs/:blogId/suggestions")
@UseGuards(StoreOwnerGuard)
export class SuggestionsController {
  constructor(private readonly suggestions: SuggestionsService) {}

  @Get("topic")
  @HttpCode(HttpStatus.OK)
  async suggestTopic(@Param("blogId") blogId: string) {
    return this.suggestions.suggestTopic(blogId);
  }

  @Get("primary-keyword")
  @HttpCode(HttpStatus.OK)
  async suggestPrimaryKeyword(@Param("blogId") blogId: string) {
    return this.suggestions.suggestPrimaryKeyword(blogId);
  }

  @Get("secondary-keywords")
  @HttpCode(HttpStatus.OK)
  async suggestSecondaryKeyword(@Param("blogId") blogId: string) {
    return this.suggestions.suggestSecondaryKeywords(blogId);
  }
}
