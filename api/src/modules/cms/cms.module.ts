import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { InternalTokenGuard } from "@/common/guards/internal-token.guard";
import { Module } from "@nestjs/common";
import { CmsController } from "./cms.controller";
import { CmsService } from "./cms.service";
import { InternalCmsController } from "./internal-cms.controller";

@Module({
  controllers: [CmsController, InternalCmsController],
  providers: [BusinessAccessGuard, InternalTokenGuard, CmsService],
  exports: [CmsService],
})
export class CmsModule {}
