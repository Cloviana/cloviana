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
    const record = await this.prisma.blog.findUnique({
      where: { id: blogId },
      select: { generationStatus: true },
    });

    if (record?.generationStatus !== BlogGenerationStatus.QUEUED) {
      this.logger.log(
        `Skipping blog ${blogId}, status is ${record?.generationStatus}`,
      );
      return;
    }

    this.logger.log(`Starting blog generation for ${blogId}`);

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

      this.logger.log(`Completed blog generation for ${blogId}`);
    } catch (err) {
      await this.prisma.blog
        .update({
          where: { id: blogId },
          data: { generationStatus: BlogGenerationStatus.ERROR },
        })
        .catch(() =>
          this.logger.error(`Failed to mark ERROR for ${blogId}`, err as any),
        );

      this.logger.error(
        `Blog generation failed for ${blogId}`,
        (err as any).stack,
      );
    }
  }
}
