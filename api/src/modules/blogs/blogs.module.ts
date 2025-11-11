import { Module } from "@nestjs/common";

import { CatalogModule } from "@/modules/catalog/catalog.module";
import { BlogGenerationModule } from "@/workflows";
import { BlogsController } from "./blogs.controller";
import { BlogsConsumer } from "./services/blogs.consumer";
import { BlogsService } from "./services/blogs.service";

@Module({
  imports: [BlogGenerationModule, CatalogModule],
  controllers: [BlogsController, BlogsConsumer],
  providers: [BlogsService],
})
export class BlogsModule {}
