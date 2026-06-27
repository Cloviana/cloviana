import { BusinessInitializationWorkflowModule } from "@/workflows/business-initialization/business-initialization.module";
import { Module } from "@nestjs/common";
import { BusinessesConsumer } from "./consumers/businesses.consumer";

@Module({
  imports: [BusinessInitializationWorkflowModule],
  controllers: [BusinessesConsumer],
})
export class BusinessesWorkerModule {}
