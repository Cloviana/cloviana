import { ConfigifyModule } from "@itgorillaz/configify";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import * as Clients from "@/clients";
import * as infrastructure from "@/infrastructure";
import * as Integrations from "@/integrations";
import { AuditsWorkerModule } from "@/modules/audits/audits.worker.module";
import { BlogsWorkerModule } from "@/modules/blogs/blogs.worker.module";
import { BusinessesWorkerModule } from "@/modules/businesses/businesses.worker.module";
import { JobsModule } from "@/modules/jobs/jobs.module";
import { MonitoringWorkerModule } from "@/modules/monitoring/monitoring.worker.module";

@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    ScheduleModule.forRoot(),
    ...Object.values(Clients),
    ...Object.values(infrastructure),
    ...Object.values(Integrations),
    JobsModule,
    AuditsWorkerModule,
    BlogsWorkerModule,
    BusinessesWorkerModule,
    MonitoringWorkerModule,
  ],
})
export class WorkerModule {}
