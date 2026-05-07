import { BusinessInitializationWorkflowModule } from "@/workflows/business-initialization/business-initialization.module";
import { Module } from "@nestjs/common";
import { BusinessesConsumer } from "./consumers/businesses.consumer";
import { BusinessesMaintenanceService } from "./services/businesses-maintenance.service";
import { BusinessesScheduler } from "@/modules/businesses/schedulers/businesses.scheduler";

@Module({
  imports: [BusinessInitializationWorkflowModule],
  controllers: [BusinessesConsumer],
  providers: [BusinessesMaintenanceService, BusinessesScheduler],
})
export class BusinessesWorkerModule {}
