import { Module } from "@nestjs/common";
import { BlogGenerationWorkflow } from "./blog-generation.workflow";

@Module({
  providers: [BlogGenerationWorkflow],
  exports: [BlogGenerationWorkflow],
})
export class BlogGenerationModule {}
