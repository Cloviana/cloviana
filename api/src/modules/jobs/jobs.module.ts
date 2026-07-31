import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Module } from "@nestjs/common";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { ManagedJobsService } from "./managed-jobs.service";

@Module({
  providers: [JobsService, ManagedJobsService, BusinessAccessGuard],
  controllers: [JobsController],
  exports: [ManagedJobsService],
})
export class JobsModule {}
