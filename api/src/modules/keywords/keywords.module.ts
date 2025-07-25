import { Module } from "@nestjs/common";

import { SemrushModule } from "@/clients/semrush/semrush.module";
import { KeywordsController } from "./keywords.controller";
import { KeywordsConsumer } from "./keywords.consumer";
import { KeywordsService } from "./keywords.service";

@Module({
  imports: [SemrushModule],
  controllers: [KeywordsController, KeywordsConsumer],
  providers: [KeywordsService],
})
export class KeywordsModule {}
