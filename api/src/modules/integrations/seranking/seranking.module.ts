import { Module } from "@nestjs/common";
import { SerankingClient } from "./seranking.client";
import { SerankingMetricsService } from "./services/seranking.metrics.service";

@Module({
  providers: [SerankingClient, SerankingMetricsService],
  exports: [SerankingMetricsService],
})
export class SerankingModule {}
