import { Public } from "@/common/decorators/public.decorator";
import { InternalTokenGuard } from "@/common/guards/internal-token.guard";
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CmsService } from "./cms.service";

@Controller("internal/cms-pages")
@UseGuards(InternalTokenGuard)
export class InternalCmsController {
  constructor(private readonly cms: CmsService) {}

  @Public()
  @Get()
  search(
    @Query("businessId") businessId?: string,
    @Query("q") q?: string,
    @Query("limit") limit?: string,
  ) {
    if (!businessId) throw new BadRequestException("businessId is required");
    return this.cms.searchPages(businessId, q, Number(limit) || 50);
  }
}
