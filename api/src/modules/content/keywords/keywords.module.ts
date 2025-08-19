import { Module } from "@nestjs/common";

import { KeywordsController } from "./keywords.controller";
import { KeywordsConsumer } from "./keywords.consumer";
import { KeywordsService } from "./keywords.service";

@Module({
  controllers: [KeywordsController, KeywordsConsumer],
  providers: [KeywordsService],
})
export class KeywordsModule {}
