import { Module } from "@nestjs/common";
import { BlogsModule } from "@/modules/blogs/blogs.module";
import { BlogGenerationModule } from "@/workflows/blog-generation/blog-generation.module";
import { SmtpModule } from "@/clients/smtp/smtp.module";
import { AutopilotBlogWorkflow } from "./autopilot-blog.workflow";

@Module({
  imports: [BlogsModule, BlogGenerationModule, SmtpModule],
  providers: [AutopilotBlogWorkflow],
  exports: [AutopilotBlogWorkflow],
})
export class AutopilotBlogModule {}
