import { Module } from "@nestjs/common";
import { CmsModule } from "./cms.module";
import { CmsSyncScheduler } from "./schedulers/cms-sync.scheduler";

@Module({
  imports: [CmsModule],
  providers: [CmsSyncScheduler],
})
export class CmsWorkerModule {}
