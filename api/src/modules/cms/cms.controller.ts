import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CmsPlatform, Prisma } from "@prisma/client";
import { IsEnum, IsObject } from "class-validator";
import { CmsService } from "./cms.service";
import { CmsSyncService } from "./services/cms-sync.service";

class CreateConnectionDto {
  @IsEnum(CmsPlatform)
  platform!: CmsPlatform;

  @IsObject()
  config!: Record<string, unknown>;
}

@Controller("businesses/:businessId/cms")
@UseGuards(BusinessAccessGuard)
export class CmsController {
  constructor(
    private readonly cms: CmsService,
    private readonly cmsSync: CmsSyncService,
  ) {}

  @Post("sync")
  sync(@Param("businessId") businessId: string) {
    // Minute-bucketed dedupe: absorbs double-clicks, allows quick re-runs.
    return this.cmsSync.runSync(
      businessId,
      `manual:${new Date().toISOString().slice(0, 16)}`,
    );
  }

  @Get("connections")
  listConnections(@Param("businessId") businessId: string) {
    return this.cms.listConnections(businessId);
  }

  @Post("connections")
  upsertConnection(
    @Param("businessId") businessId: string,
    @Body() dto: CreateConnectionDto,
  ) {
    return this.cms.upsertConnection(
      businessId,
      dto.platform,
      dto.config as Prisma.InputJsonValue,
    );
  }

  @Delete("connections/:connectionId")
  deleteConnection(
    @Param("businessId") businessId: string,
    @Param("connectionId") connectionId: string,
  ) {
    return this.cms.deleteConnection(businessId, connectionId);
  }
}
