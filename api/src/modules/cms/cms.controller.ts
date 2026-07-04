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

class CreateConnectionDto {
  @IsEnum(CmsPlatform)
  platform!: CmsPlatform;

  @IsObject()
  config!: Record<string, unknown>;
}

@Controller("businesses/:businessId/cms")
@UseGuards(BusinessAccessGuard)
export class CmsController {
  constructor(private readonly cms: CmsService) {}

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
