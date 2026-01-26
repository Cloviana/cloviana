import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { UseGuards } from "@nestjs/common";
import { JobType } from "@prisma/client";
import { JobsService } from "./jobs.service";

@Controller("stores/:storeId/jobs")
@UseGuards(StoreOwnerGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(
    @Param("storeId") storeId: string,
    @Query("type", new ParseEnumPipe(JobType, { optional: true }))
    type?: JobType,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.jobs.list(storeId, type, limit);
  }

  @Get(":jobId")
  async get(@Param("storeId") storeId: string, @Param("jobId") jobId: string) {
    return this.jobs.getStatus(storeId, jobId);
  }
}
