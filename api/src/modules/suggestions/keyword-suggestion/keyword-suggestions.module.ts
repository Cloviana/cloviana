import { Module } from "@nestjs/common";
import { KeywordSuggestionsController } from "./keyword-suggestions.controller";
import { KeywordSuggestionsService } from "./keyword-suggestions.service";

@Module({
  controllers: [KeywordSuggestionsController],
  providers: [KeywordSuggestionsService],
})
export class KeywordSuggestionsModule {}
