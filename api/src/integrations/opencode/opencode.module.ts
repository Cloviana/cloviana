import { SandboxModule } from "@/integrations/sandbox/sandbox.module";
import { Module } from "@nestjs/common";
import { OpenCodeService } from "./opencode.service";
@Module({
  imports: [SandboxModule],
  providers: [OpenCodeService],
  exports: [OpenCodeService],
})
export class OpenCodeModule {}
