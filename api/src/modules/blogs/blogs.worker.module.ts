import { BlogWorkflowModule } from "@/workflows/blogs/blog.module";
import { Module } from "@nestjs/common";
import { BlogsConsumer } from "./consumers/blogs.consumer";

@Module({
  imports: [BlogWorkflowModule],
  controllers: [BlogsConsumer],
})
export class BlogsWorkerModule {}
