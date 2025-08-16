import { Module } from "@nestjs/common";
import { TitleSuggestionsController } from "./title-suggestions.controller";
import { TitleSuggestionsService } from "./title-suggestions.service";

@Module({
  controllers: [TitleSuggestionsController],
  providers: [TitleSuggestionsService],
})
export class TitleSuggestionsModule {}
