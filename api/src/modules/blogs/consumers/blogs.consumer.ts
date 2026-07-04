import type { RunBlogGenerationPayload } from "@/infrastructure/messaging/rabbitmq.contracts";
import { RUN_BLOG_GENERATION_EVENT } from "@/infrastructure/messaging/rabbitmq.contracts";
import { BlogWorkflow } from "@/workflows/blogs/blog.workflow";
import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";

@Controller()
export class BlogsConsumer {
  private readonly logger = new Logger(BlogsConsumer.name);

  constructor(private readonly blogWorkflow: BlogWorkflow) {}

  @EventPattern(RUN_BLOG_GENERATION_EVENT)
  async handleRunBlogGeneration(
    @Payload() payload: RunBlogGenerationPayload,
    @Ctx() context?: RmqContext,
  ) {
    const jobId = payload?.jobId?.trim();
    const businessId = payload?.businessId?.trim();
    const topic = payload?.topic?.trim();

    if (!jobId || !businessId || !topic) {
      this.logger.error(
        `Received ${RUN_BLOG_GENERATION_EVENT} with invalid jobId=${payload?.jobId} businessId=${payload?.businessId} topic=${payload?.topic}`,
      );
      this.ack(context);
      return;
    }

    this.logger.log(
      `Received ${RUN_BLOG_GENERATION_EVENT} for businessId=${businessId} jobId=${jobId}`,
    );

    try {
      const job = await this.blogWorkflow.run(
        jobId,
        businessId,
        topic,
        payload.instructions,
      );
      this.logger.log(
        `Blog workflow handled businessId=${businessId} jobId=${jobId} status=${job.status}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Blog workflow failed for businessId=${businessId}: ${err.message}`,
        err.stack,
      );
    }

    this.ack(context);
  }

  private ack(context?: RmqContext) {
    if (!context) return;

    try {
      const channel = context.getChannelRef();
      const message = context.getMessage();
      channel.ack(message);
    } catch (err: any) {
      this.logger.warn(
        `Failed to ack message — channel already closed: ${err.message}`,
      );
    }
  }
}
