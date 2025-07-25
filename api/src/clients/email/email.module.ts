import { Global, Module } from "@nestjs/common";
import { Smtp2GoClient } from "./services/smtp2go.service";

@Global()
@Module({
  providers: [Smtp2GoClient],
  exports: [Smtp2GoClient],
})
export class EmailClientModule {}
