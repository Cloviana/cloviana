import { Module } from "@nestjs/common";

import { DataForSeoModule, ShopifyCatalogModule } from "@/integrations";
import { SuggestionsController } from "@/modules/blogs/controllers/suggestions.controller";
import { SuggestionsService } from "@/modules/blogs/services/suggestions.service";
import { BlogGenerationModule } from "@/workflows";
import { BlogsController } from "./controllers/blogs.controller";
import { BlogsConsumer } from "./services/blogs.consumer";
import { BlogsService } from "./services/blogs.service";

@Module({
  imports: [BlogGenerationModule, ShopifyCatalogModule, DataForSeoModule],
  controllers: [BlogsController, BlogsConsumer, SuggestionsController],
  providers: [BlogsService, SuggestionsService],
  exports: [BlogsService, SuggestionsService],
})
export class BlogsModule {}
