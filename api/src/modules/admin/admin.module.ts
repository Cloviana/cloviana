import { MonitoringModule } from "@/modules/monitoring/monitoring.module";
import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [MonitoringModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
