import { Module } from "@nestjs/common";

import { SuggestionsController } from "./suggestions.controller";
import { SuggestionsService } from "./suggestions.service";
import { SerankingModule } from "@/modules/seranking/seranking.module";
import { GroqModule } from "@/clients";

@Module({
  imports: [SerankingModule, GroqModule],
  controllers: [SuggestionsController],
  providers: [
    SuggestionsService,
  ],
})
export class SuggestionsModule {}
