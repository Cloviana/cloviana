import { Module } from "@nestjs/common";
import { TopicSuggestionsController } from "./topic-suggestions.controller";
import { TopicSuggestionsService } from "./topic-suggestions.service";

@Module({
  controllers: [TopicSuggestionsController],
  providers: [TopicSuggestionsService],
})
export class TopicSuggestionsModule {}
