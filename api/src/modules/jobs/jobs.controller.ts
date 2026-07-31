import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JobType } from "@prisma/client";
import { JobsService } from "./jobs.service";

@Controller("businesses/:businessId/jobs")
@UseGuards(BusinessAccessGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(
    @Param("businessId") businessId: string,
    @Query("type", new ParseEnumPipe(JobType, { optional: true }))
    type?: JobType,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.jobs.list(businessId, type, limit);
  }

  @Get("latest")
  latest(
    @Param("businessId") businessId: string,
    @Query("type", new ParseEnumPipe(JobType)) type: JobType,
  ) {
    return this.jobs.latest(businessId, type);
  }

  @Get(":jobId")
  get(@Param("businessId") businessId: string, @Param("jobId") jobId: string) {
    return this.jobs.getById(businessId, jobId);
  }
}
