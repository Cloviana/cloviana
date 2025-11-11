import { Module } from "@nestjs/common";

import { GroqModule } from "@/clients";
import { SerankingModule } from "@/modules/seranking/seranking.module";
import { SuggestionsController } from "./suggestions.controller";
import { SuggestionsService } from "./suggestions.service";

@Module({
  imports: [SerankingModule, GroqModule],
  controllers: [SuggestionsController],
  providers: [SuggestionsService],
})
export class SuggestionsModule {}
