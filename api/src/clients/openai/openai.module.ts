import { Global, Module } from "@nestjs/common";
import { OpenAIClient } from "./openai.client";

@Global()
@Module({
  providers: [OpenAIClient],
  exports: [OpenAIClient],
})
export class OpenAIModule {}
