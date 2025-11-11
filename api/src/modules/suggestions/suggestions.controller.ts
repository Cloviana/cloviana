import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
  async suggestPrimaryKeyword(@Param("blogId") blogId: string) {
    return this.suggestions.suggestPrimaryKeyword(blogId);
  }

  @Get("secondary-keywords")
  @HttpCode(HttpStatus.OK)
  async suggestSecondaryKeywords(@Param("blogId") blogId: string) {
    return this.suggestions.suggestSecondaryKeywords(blogId);
  }

  @Get("product")
  @HttpCode(HttpStatus.OK)
  async suggestProduct(@Param("blogId") blogId: string) {
    return this.suggestions.suggestProduct(blogId);
  }
}
