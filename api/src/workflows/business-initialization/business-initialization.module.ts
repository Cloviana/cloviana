import { BusinessesModule, JobsModule } from "@/modules";
import { Module } from "@nestjs/common";
import { BusinessInitializationWorkflow } from "./business-initialization.workflow";

@Module({
  imports: [JobsModule, BusinessesModule],
  providers: [BusinessInitializationWorkflow],
  exports: [BusinessInitializationWorkflow],
})
export class BusinessInitializationWorkflowModule {}
