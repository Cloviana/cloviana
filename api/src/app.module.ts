import { ConfigifyModule } from "@itgorillaz/configify";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import * as Clients from "@/clients";
import * as Modules from "@/modules";
import * as Workflows from "@/workflows";
import * as infrastructure from "@/infrastructure";
import * as Integrations from "@/integrations";


@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    ScheduleModule.forRoot(),
    ...Object.values(Clients),
    ...Object.values(Modules),
    ...Object.values(Workflows),
    ...Object.values(infrastructure),
    ...Object.values(Integrations),
  ],
})
export class AppModule {}
