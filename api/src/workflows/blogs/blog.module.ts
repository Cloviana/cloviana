import { JobsModule } from "@/modules/jobs/jobs.module";
import { Module } from "@nestjs/common";
import { BlogWorkflow } from "./blog.workflow";

@Module({
  imports: [JobsModule],
  providers: [BlogWorkflow],
  exports: [BlogWorkflow],
})
export class BlogWorkflowModule {}
