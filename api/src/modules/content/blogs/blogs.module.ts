import { Module } from "@nestjs/common";

import { BlogsController } from "./blogs.controller";
import { BlogsService } from "./services/blogs.service";
import { BlogsConsumer } from "./services/blogs.consumer";
import { BlogOwnerGuard } from "./guards/blog-owner.guard";
import { BlogGenerationModule } from "@/workflows";
import { CatalogModule } from "@/modules/commerce";

@Module({
  imports: [BlogGenerationModule, CatalogModule],
  controllers: [BlogsController, BlogsConsumer],
  providers: [
    BlogsService,
    BlogOwnerGuard,
  ],
})
export class BlogsModule {}
