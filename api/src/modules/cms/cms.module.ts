import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { InternalTokenGuard } from "@/common/guards/internal-token.guard";
import { JobsModule } from "@/modules/jobs/jobs.module";
import { Module } from "@nestjs/common";
import { CmsController } from "./cms.controller";
import { CmsService } from "./cms.service";
import { InternalCmsController } from "./internal-cms.controller";
import { CmsSyncService } from "./services/cms-sync.service";

@Module({
  imports: [JobsModule],
  controllers: [CmsController, InternalCmsController],
  providers: [
    BusinessAccessGuard,
    InternalTokenGuard,
    CmsService,
    CmsSyncService,
  ],
  exports: [CmsService, CmsSyncService],
})
export class CmsModule {}
