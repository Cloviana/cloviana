import { JobsModule } from "@/modules/jobs/jobs.module";
import { Module } from "@nestjs/common";
import { BlogGenerationWorkflow } from "./blog-generation.workflow";

@Module({
  imports: [JobsModule],
  providers: [BlogGenerationWorkflow],
  exports: [BlogGenerationWorkflow],
})
export class BlogGenerationModule {}
