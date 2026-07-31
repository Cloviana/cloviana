import { ExaModule } from "@/integrations/exa/exa.module";
import { Module } from "@nestjs/common";
import { BusinessResearchService } from "./business-research.service";

@Module({
  imports: [ExaModule],
  providers: [BusinessResearchService],
  exports: [BusinessResearchService],
})
export class BusinessResearchModule {}
