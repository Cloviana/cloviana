import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { BlogGenerationStatus } from "@prisma/client";
import { BlogsService } from "./services/blogs.service";
import { GENERATE_BLOG_EVENT } from "@/constants/rabbitmq.constants";

interface GenerateBlogsEvent {
  blogId: string;
  storeId: string;
}

@Controller()
export class BlogsConsumer {
  private readonly logger = new Logger(BlogsConsumer.name);

  constructor(
    private readonly blogs: BlogsService,
    private readonly prisma: PrismaService,
  ) {}

  @EventPattern(GENERATE_BLOG_EVENT)
  async handleGenerateBlog(@Payload() { blogId, storeId }: GenerateBlogsEvent) {
    this.logger.log(`Starting blog generation job for blog ${blogId}`);

    try {
      await this.prisma.blog.update({
        where: { id: blogId },
        data: { generationStatus: BlogGenerationStatus.IN_PROGRESS },
      });

      await this.blogs.generateBlog(storeId, blogId);

      await this.prisma.blog.update({
        where: { id: blogId },
        data: { generationStatus: BlogGenerationStatus.READY },
      });

      this.logger.log(`Job succeeded for blog ${blogId}`);
    } catch (err) {
      try {
        await this.prisma.blog.update({
          where: { id: blogId },
          data: { generationStatus: BlogGenerationStatus.ERROR },
        });
      } catch (updateErr) {
        this.logger.error(
          `Failed to update blog generation status for ${blogId}`,
          updateErr.stack,
        );
      }

      this.logger.error(`Job failed for blog ${blogId}`, err.stack);
    }
  }
}
