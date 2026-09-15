import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ContentTypeResearchService } from "../background/workflows/content-type-research/content-type-research.service";
import { ProductResearchService } from "../background/workflows/product-research/product-research.service";
import { CreateContentTypeResearchDto } from "../dto/create-content-type-research.dto";
import { CreateProductResearchDto } from "../dto/create-product-research.dto";
import { BrandKitService } from "../services/brand-kit.service";

@Controller("businesses/:businessId/brand-kit")
@UseGuards(BusinessAccessGuard)
export class BrandKitController {
  constructor(
    private readonly brandKitService: BrandKitService,
    private readonly productResearch: ProductResearchService,
    private readonly contentTypeResearch: ContentTypeResearchService,
  ) {}

  @Get()
  getBrandKit(@Param("businessId") businessId: string) {
    return this.brandKitService.getBrandKit(businessId);
  }

  @Post("product-research")
  @HttpCode(HttpStatus.ACCEPTED)
  researchProduct(
    @Param("businessId") businessId: string,
    @Body() body: CreateProductResearchDto,
  ) {
    return this.productResearch.enqueue(businessId, body);
  }

  @Post("content-type-research")
  @HttpCode(HttpStatus.ACCEPTED)
  researchContentType(
    @Param("businessId") businessId: string,
    @Body() body: CreateContentTypeResearchDto,
  ) {
    return this.contentTypeResearch.enqueue(businessId, body);
  }

  @Post("publish")
  publish(@Param("businessId") businessId: string) {
    return this.brandKitService.publish(businessId);
  }

  @Post("discard")
  discard(@Param("businessId") businessId: string) {
    return this.brandKitService.discard(businessId);
  }

  @Get("versions")
  getVersions(@Param("businessId") businessId: string) {
    return this.brandKitService.getVersions(businessId);
  }

  @Get("versions/:versionId")
  getVersion(
    @Param("businessId") businessId: string,
    @Param("versionId", new ParseUUIDPipe({ version: "4" })) versionId: string,
  ) {
    return this.brandKitService.getVersion(businessId, versionId);
  }
}
