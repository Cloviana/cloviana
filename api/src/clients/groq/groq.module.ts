import { Global, Module } from "@nestjs/common";
import { GroqClient } from "./groq.client";

@Global()
@Module({
  providers: [GroqClient],
  exports: [GroqClient],
})
export class GroqModule {}
