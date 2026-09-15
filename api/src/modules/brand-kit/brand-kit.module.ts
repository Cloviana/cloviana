import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Module } from "@nestjs/common";
import { ContentTypeResearchWorkflowModule } from "./background/workflows/content-type-research/content-type-research-workflow.module";
import { ProductResearchWorkflowModule } from "./background/workflows/product-research/product-research-workflow.module";
import {
  BrandKitAudiencesController,
  BrandKitCompetitorsController,
  BrandKitContentTypesController,
  BrandKitCustomVariablesController,
  BrandKitFoundationsController,
  BrandKitProductsController,
  BrandKitRegionsController,
  BrandKitRulesController,
  BrandKitSamplesController,
} from "./controllers/brand-kit-draft.controller";
import { BrandKitController } from "./controllers/brand-kit.controller";
import { BrandKitDraftService } from "./services/brand-kit-draft.service";
import { BrandKitService } from "./services/brand-kit.service";

@Module({
  imports: [ContentTypeResearchWorkflowModule, ProductResearchWorkflowModule],
  controllers: [
    BrandKitController,
    BrandKitFoundationsController,
    BrandKitProductsController,
    BrandKitCompetitorsController,
    BrandKitContentTypesController,
    BrandKitAudiencesController,
    BrandKitRegionsController,
    BrandKitCustomVariablesController,
    BrandKitRulesController,
    BrandKitSamplesController,
  ],
  providers: [BrandKitService, BrandKitDraftService, BusinessAccessGuard],
})
export class BrandKitModule {}
