import { Module } from "@nestjs/common";
import { AuditsController } from "./audits.controller";
import { AuditsService } from "./audits.service";
import { AuditsQueueModule } from "./background/queue/audits-queue.module";

@Module({
  imports: [AuditsQueueModule],
  controllers: [AuditsController],
  providers: [AuditsService],
})
export class AuditsModule {}
