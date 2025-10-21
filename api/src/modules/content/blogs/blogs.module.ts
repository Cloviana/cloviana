import { Module } from "@nestjs/common";

import { BlogsController } from "./blogs.controller";
import { BlogsService } from "./services/blogs.service";
import { BlogsConsumer } from "./services/blogs.consumer";
import { BlogGenerationModule } from "@/workflows";
import { CatalogModule } from "@/modules/commerce";

@Module({
  imports: [BlogGenerationModule, CatalogModule],
  controllers: [BlogsController, BlogsConsumer],
  providers: [
    BlogsService,
  ],
})
export class BlogsModule {}
