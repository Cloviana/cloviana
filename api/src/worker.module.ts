import { ConfigifyModule } from "@itgorillaz/configify";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import * as Clients from "@/clients";
import * as infrastructure from "@/infrastructure";
import * as Integrations from "@/integrations";
import { AuditsBackgroundModule } from "@/modules/audits/background/audits-background.module";
import { KnowledgeBackgroundModule } from "@/modules/knowledge/background/knowledge-background.module";
import { MonitoringBackgroundModule } from "@/modules/monitoring/background/monitoring-background.module";

@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    ScheduleModule.forRoot(),
    ...Object.values(Clients),
    ...Object.values(infrastructure),
    ...Object.values(Integrations),
    AuditsBackgroundModule,
    KnowledgeBackgroundModule,
    MonitoringBackgroundModule,
  ],
})
export class WorkerModule {}
