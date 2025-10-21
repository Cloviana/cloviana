import { Module } from "@nestjs/common";

import { SuggestionsController } from "./suggestions.controller";
import { SuggestionsService } from "./suggestions.service";
import { SerankingModule } from "@/modules/integrations";

@Module({
  imports: [SerankingModule],
  controllers: [SuggestionsController],
  providers: [
    SuggestionsService,
  ],
})
export class SuggestionsModule {}
