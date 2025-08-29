import { Controller, Get, UseGuards } from "@nestjs/common";
import { KeywordsService } from "./keywords.service";
import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import { StoreEntity } from "@/decorators/store.decorator";
import type { Store } from "@prisma/client";

@Controller("stores/:storeId/keywords")
@UseGuards(StoreOwnerGuard)
export class KeywordsController {
  constructor(private readonly keywords: KeywordsService) {}

  @Get()
  async getAll(@StoreEntity() { id }: Store) {
    return this.keywords.getStoreKeywords(id);
  }
}
