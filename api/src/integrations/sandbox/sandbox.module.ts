import { DaytonaModule } from "@/integrations/daytona/daytona.module";
import { DockerService } from "@/integrations/docker/docker.service";
import { Module } from "@nestjs/common";
import { SandboxService } from "./sandbox.service";
@Module({
  imports: [DaytonaModule],
  providers: [SandboxService, DockerService],
  exports: [SandboxService],
})
export class SandboxModule {}
