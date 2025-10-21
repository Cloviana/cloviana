import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { GENERATE_BLOG_EVENT } from "@/constants/rabbitmq.constants";
import { BlogGenerationWorkflow } from "@/workflows/blog-generation/blog-generation.workflow";

interface GenerateBlogsEvent {
  blogId: string;
  storeId: string;
}

@Controller()
export class BlogsConsumer {
  private readonly logger = new Logger(BlogsConsumer.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly blogGenerationWorkflow: BlogGenerationWorkflow
  ) {}

  @EventPattern(GENERATE_BLOG_EVENT)
  async handleGenerateBlog(@Payload() { blogId }: GenerateBlogsEvent) {
    const blog = await this.prisma.blog.findUnique({ where: { id: blogId }, select: { id: true } });
    if (!blog) {
      this.logger.warn(`Blog ${blogId} not found`);
      return;
    }
    try {
      const res = await this.blogGenerationWorkflow.run(blogId);
      this.logger.log(`Blog ${blogId} job ${res.id} ${res.status}`);
    } catch (err) {
      this.logger.error(`Blog generation failed for ${blogId}: ${String((err as any)?.message ?? err)}`);
    }
  }
}
