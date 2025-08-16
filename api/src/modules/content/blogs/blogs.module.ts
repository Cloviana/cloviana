import { Module } from "@nestjs/common";

import { BlogsController } from "./blogs.controller";
import { BlogsService } from "./services/blogs.service";
import { SourceRecommendationService } from "./services/source-recommendation.service";
import { BlogsConsumer } from "./blogs.consumer";
import { BlogOwnerGuard } from "./guards/blog-owner.guard";
import { BlogWriterAgent } from "./agents/blog-writer";

@Module({
  controllers: [BlogsController, BlogsConsumer],
  providers: [
    BlogsService,
    SourceRecommendationService,
    BlogOwnerGuard,
    BlogWriterAgent
  ],
})
export class BlogsModule {}
