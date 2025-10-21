import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SuggestionsService } from "./suggestions.service";
import { BlogOwnerGuard } from "@/guards/blog-owner.guard";

@Controller("blogs/:blogId/suggestions")
@UseGuards(BlogOwnerGuard)
export class SuggestionsController {
  constructor(private readonly suggestions: SuggestionsService) {}

  @Get("topic")
  @HttpCode(HttpStatus.OK)
  async suggestTopic(@Req() req: any) {
    const storeId = req.blog.storeId;
    return this.suggestions.suggestTopic(storeId);
  }

  @Get("primary-keyword")
  @HttpCode(HttpStatus.OK)
  async suggestPrimaryKeyword(@Query("topic") topic: string) {
    return this.suggestions.suggestPrimaryKeyword(topic);
  }

  @Get("title")
  @HttpCode(HttpStatus.OK)
  async suggestTitle(@Query("topic") topic: string, @Query("primary-keyword") primaryKeyword: string) {
    return this.suggestions.suggestTitle(topic, primaryKeyword);
  }

  @Get("secondary-keywords")
  @HttpCode(HttpStatus.OK)
  async suggestSecondaryKeywords(@Query("title") title: string, @Query("topic") topic: string, @Query("primary-keyword") primaryKeyword: string) {
    return this.suggestions.suggestSecondaryKeywords(topic, primaryKeyword, title);
  }

  @Get("product")
  @HttpCode(HttpStatus.OK)
  async suggestProduct(@Query("title") title: string, @Query("topic") topic: string, @Param("blogId") blogId: string) {
    return this.suggestions.suggestProduct(blogId, topic, title);
  }
}
