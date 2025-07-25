import { Module } from "@nestjs/common";

import { BlogsController } from "./blogs.controller";
import { BlogsService } from "./services/blogs.service";
import { BlogGenerationService } from "./services/blog-generation.service";
import { SourceRecommendationService } from "./services/source-recommendation.service";
import { BlogsConsumer } from "./blogs.consumer";
import { BlogOwnerGuard } from "./guards/blog-owner.guard";

@Module({
  controllers: [BlogsController, BlogsConsumer],
  providers: [
    BlogsService,
    BlogGenerationService,
    SourceRecommendationService,
    BlogOwnerGuard,
  ],
})
export class BlogsModule {}
