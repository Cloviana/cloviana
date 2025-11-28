import { Module } from "@nestjs/common";

import { BlogGenerationModule } from "@/workflows";
import { BlogsController } from "./blogs.controller";
import { BlogsConsumer } from "./services/blogs.consumer";
import { BlogsService } from "./services/blogs.service";
import { ShopifyCatalogModule } from "@/integrations";

@Module({
  imports: [BlogGenerationModule, ShopifyCatalogModule],
  controllers: [BlogsController, BlogsConsumer],
  providers: [BlogsService],
})
export class BlogsModule {}
