import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JobsService } from "./jobs.service";
import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import { JobType } from "@prisma/client";

@Controller("stores/:storeId/jobs")
@UseGuards(StoreOwnerGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  async list(
    @Param("storeId") storeId: string,
    @Query("type") type?: JobType,
    @Query("limit") limit?: string,
  ) {
    return this.jobs.list(storeId, type, limit ? Number(limit) : undefined);
  }

  @Get("latest")
  async latest(
    @Param("storeId") storeId: string,
    @Query("type") type: JobType,
  ) {
    return this.jobs.latest(storeId, type);
  }

  @Get("latest/status")
  async latestStatus(
    @Param("storeId") storeId: string,
    @Query("type") type: JobType,
  ) {
    return this.jobs.latestStatus(storeId, type);
  }

  @Get(":jobId")
  async get(@Param("storeId") storeId: string, @Param("jobId") jobId: string) {
    return this.jobs.getById(storeId, jobId);
  }
}
