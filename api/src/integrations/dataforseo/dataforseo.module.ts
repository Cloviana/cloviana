import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { DataForSeoService } from "./dataforseo.service";

@Module({
  imports: [HttpModule],
  providers: [DataForSeoService],
  exports: [DataForSeoService],
})
export class DataForSeoModule {}
