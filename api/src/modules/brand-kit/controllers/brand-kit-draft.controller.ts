import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  CreateAudienceDto,
  CreateCompetitorDto,
  CreateContentTypeDto,
  CreateCustomVariableDto,
  CreateProductDto,
  CreateRegionDto,
  CreateRuleDto,
  CreateSampleDto,
  UpdateAudienceDto,
  UpdateCompetitorDto,
  UpdateContentTypeDto,
  UpdateCustomVariableDto,
  UpdateProductDto,
  UpdateProfileDto,
  UpdateRegionDto,
  UpdateRuleDto,
  UpdateSampleDto,
  UpdateVoiceDto,
  UpdateWriterPersonaDto,
} from "../dto/brand-kit-draft.dto";
import { BrandKitDraftService } from "../services/brand-kit-draft.service";

const uuidPipe = new ParseUUIDPipe({ version: "4" });

@Controller("businesses/:businessId/brand-kit/foundations")
@UseGuards(BusinessAccessGuard)
export class BrandKitFoundationsController {
  constructor(private readonly drafts: BrandKitDraftService) {}

  @Patch("profile")
  updateProfile(
    @Param("businessId") businessId: string,
    @Body() body: UpdateProfileDto,
  ) {
    return this.drafts.updateProfile(businessId, body);
  }

  @Patch("voice")
  updateVoice(
    @Param("businessId") businessId: string,
    @Body() body: UpdateVoiceDto,
  ) {
    return this.drafts.updateVoice(businessId, body);
  }

  @Patch("writer-persona")
  updateWriterPersona(
    @Param("businessId") businessId: string,
    @Body() body: UpdateWriterPersonaDto,
  ) {
    return this.drafts.updateWriterPersona(businessId, body);
  }
}

@Controller("businesses/:businessId/brand-kit/products")
@UseGuards(BusinessAccessGuard)
export class BrandKitProductsController {
  constructor(private readonly drafts: BrandKitDraftService) {}

  @Post()
  createProduct(
    @Param("businessId") businessId: string,
    @Body() body: CreateProductDto,
  ) {
    return this.drafts.createProduct(businessId, body);
  }

  @Patch(":productId")
  updateProduct(
    @Param("businessId") businessId: string,
    @Param("productId", uuidPipe) productId: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.drafts.updateProduct(businessId, productId, body);
  }

  @Delete(":productId")
  deleteProduct(
    @Param("businessId") businessId: string,
    @Param("productId", uuidPipe) productId: string,
  ) {
    return this.drafts.deleteProduct(businessId, productId);
  }

  @Post(":productId/competitors/:brandId")
  addCompetitor(
    @Param("businessId") businessId: string,
    @Param("productId", uuidPipe) productId: string,
    @Param("brandId", uuidPipe) brandId: string,
  ) {
    return this.drafts.addProductCompetitor(businessId, productId, brandId);
  }

  @Delete(":productId/competitors/:brandId")
  removeCompetitor(
    @Param("businessId") businessId: string,
    @Param("productId", uuidPipe) productId: string,
    @Param("brandId", uuidPipe) brandId: string,
  ) {
    return this.drafts.removeProductCompetitor(businessId, productId, brandId);
  }
}

@Controller("businesses/:businessId/brand-kit/competitors")
@UseGuards(BusinessAccessGuard)
export class BrandKitCompetitorsController {
  constructor(private readonly drafts: BrandKitDraftService) {}

  @Get()
  getCompetitors(@Param("businessId") businessId: string) {
    return this.drafts.getCompetitors(businessId);
  }

  @Post()
  createCompetitor(
    @Param("businessId") businessId: string,
    @Body() body: CreateCompetitorDto,
  ) {
    return this.drafts.createCompetitor(businessId, body);
  }

  @Patch(":brandId")
  updateCompetitor(
    @Param("businessId") businessId: string,
    @Param("brandId", uuidPipe) brandId: string,
    @Body() body: UpdateCompetitorDto,
  ) {
    return this.drafts.updateCompetitor(businessId, brandId, body);
  }

  @Delete(":brandId")
  deleteCompetitor(
    @Param("businessId") businessId: string,
    @Param("brandId", uuidPipe) brandId: string,
  ) {
    return this.drafts.deleteCompetitor(businessId, brandId);
  }
}

@Controller("businesses/:businessId/brand-kit/content-types")
@UseGuards(BusinessAccessGuard)
export class BrandKitContentTypesController {
  constructor(private readonly drafts: BrandKitDraftService) {}

  @Post()
  createContentType(
    @Param("businessId") businessId: string,
    @Body() body: CreateContentTypeDto,
  ) {
    return this.drafts.createContentType(businessId, body);
  }

  @Patch(":contentTypeId")
  updateContentType(
    @Param("businessId") businessId: string,
    @Param("contentTypeId", uuidPipe) contentTypeId: string,
    @Body() body: UpdateContentTypeDto,
  ) {
    return this.drafts.updateContentType(businessId, contentTypeId, body);
  }

  @Delete(":contentTypeId")
  deleteContentType(
    @Param("businessId") businessId: string,
    @Param("contentTypeId", uuidPipe) contentTypeId: string,
  ) {
    return this.drafts.deleteContentType(businessId, contentTypeId);
  }
}

@Controller("businesses/:businessId/brand-kit/audiences")
@UseGuards(BusinessAccessGuard)
export class BrandKitAudiencesController {
  constructor(private readonly drafts: BrandKitDraftService) {}

  @Post()
  createAudience(
    @Param("businessId") businessId: string,
    @Body() body: CreateAudienceDto,
  ) {
    return this.drafts.createAudience(businessId, body);
  }

  @Patch(":audienceId")
  updateAudience(
    @Param("businessId") businessId: string,
    @Param("audienceId", uuidPipe) audienceId: string,
    @Body() body: UpdateAudienceDto,
  ) {
    return this.drafts.updateAudience(businessId, audienceId, body);
  }

  @Delete(":audienceId")
  deleteAudience(
    @Param("businessId") businessId: string,
    @Param("audienceId", uuidPipe) audienceId: string,
  ) {
    return this.drafts.deleteAudience(businessId, audienceId);
  }
}

@Controller("businesses/:businessId/brand-kit/regions")
@UseGuards(BusinessAccessGuard)
export class BrandKitRegionsController {
  constructor(private readonly drafts: BrandKitDraftService) {}

  @Post()
  createRegion(
    @Param("businessId") businessId: string,
    @Body() body: CreateRegionDto,
  ) {
    return this.drafts.createRegion(businessId, body);
  }

  @Patch(":regionId")
  updateRegion(
    @Param("businessId") businessId: string,
    @Param("regionId", uuidPipe) regionId: string,
    @Body() body: UpdateRegionDto,
  ) {
    return this.drafts.updateRegion(businessId, regionId, body);
  }

  @Delete(":regionId")
  deleteRegion(
    @Param("businessId") businessId: string,
    @Param("regionId", uuidPipe) regionId: string,
  ) {
    return this.drafts.deleteRegion(businessId, regionId);
  }
}

@Controller("businesses/:businessId/brand-kit/custom-variables")
@UseGuards(BusinessAccessGuard)
export class BrandKitCustomVariablesController {
  constructor(private readonly drafts: BrandKitDraftService) {}

  @Post()
  createCustomVariable(
    @Param("businessId") businessId: string,
    @Body() body: CreateCustomVariableDto,
  ) {
    return this.drafts.createCustomVariable(businessId, body);
  }

  @Patch(":variableId")
  updateCustomVariable(
    @Param("businessId") businessId: string,
    @Param("variableId", uuidPipe) variableId: string,
    @Body() body: UpdateCustomVariableDto,
  ) {
    return this.drafts.updateCustomVariable(businessId, variableId, body);
  }

  @Delete(":variableId")
  deleteCustomVariable(
    @Param("businessId") businessId: string,
    @Param("variableId", uuidPipe) variableId: string,
  ) {
    return this.drafts.deleteCustomVariable(businessId, variableId);
  }
}

@Controller("businesses/:businessId/brand-kit/rules")
@UseGuards(BusinessAccessGuard)
export class BrandKitRulesController {
  constructor(private readonly drafts: BrandKitDraftService) {}

  @Post()
  createRule(
    @Param("businessId") businessId: string,
    @Body() body: CreateRuleDto,
  ) {
    return this.drafts.createRule(businessId, body);
  }

  @Patch(":ruleId")
  updateRule(
    @Param("businessId") businessId: string,
    @Param("ruleId", uuidPipe) ruleId: string,
    @Body() body: UpdateRuleDto,
  ) {
    return this.drafts.updateRule(businessId, ruleId, body);
  }

  @Delete(":ruleId")
  deleteRule(
    @Param("businessId") businessId: string,
    @Param("ruleId", uuidPipe) ruleId: string,
  ) {
    return this.drafts.deleteRule(businessId, ruleId);
  }
}

@Controller("businesses/:businessId/brand-kit/samples")
@UseGuards(BusinessAccessGuard)
export class BrandKitSamplesController {
  constructor(private readonly drafts: BrandKitDraftService) {}

  @Post()
  createSample(
    @Param("businessId") businessId: string,
    @Body() body: CreateSampleDto,
  ) {
    return this.drafts.createSample(businessId, body);
  }

  @Patch(":sampleId")
  updateSample(
    @Param("businessId") businessId: string,
    @Param("sampleId", uuidPipe) sampleId: string,
    @Body() body: UpdateSampleDto,
  ) {
    return this.drafts.updateSample(businessId, sampleId, body);
  }

  @Delete(":sampleId")
  deleteSample(
    @Param("businessId") businessId: string,
    @Param("sampleId", uuidPipe) sampleId: string,
  ) {
    return this.drafts.deleteSample(businessId, sampleId);
  }
}
