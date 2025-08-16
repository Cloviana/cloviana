import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { KeywordsService } from "./keywords.service";
import { GetKeywordsQueryDto } from "./dtos/get-keywords-query.dto";
import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import { StoreEntity } from "@/decorators/store.decorator";
import type { Store } from "@prisma/client";
import { GetKeywordQueryDto } from "./dtos/get-keyword.dto";
import { AttachKeywordDto } from "./dtos/attach-keyword.dto";

@Controller("stores/:storeId/keywords")
@UseGuards(StoreOwnerGuard)
export class KeywordsController {
  constructor(private readonly keywords: KeywordsService) {}

  @Get()
  async getKeywords(
    @Query() query: GetKeywordsQueryDto,
    @StoreEntity() store: Store,
  ) {
    const { type } = query;

    return this.keywords.getStoreKeywords(store, type);
  }

  @Get("detail")
  async getKeywordDetail(
    @Query() dto: GetKeywordQueryDto,
    @StoreEntity() store: Store,
  ) {
    return this.keywords.getKeywordDetail(store.id, dto.phrase);
  }

  @Post(":keywordId/attach")
  async attachKeyword(
    @Param("keywordId") keywordId: string,
    @Body() dto: AttachKeywordDto,
    @StoreEntity() store: Store,
  ) {
    return this.keywords.attachKeyword(store.id, keywordId, dto.type);
  }
}
