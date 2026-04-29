import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Module } from "@nestjs/common";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { ManagedJobsService } from "./services/managed-jobs.service";

@Module({
  providers: [JobsService, ManagedJobsService, BusinessAccessGuard],
  controllers: [JobsController],
  exports: [JobsService, ManagedJobsService],
})
export class JobsModule {}
