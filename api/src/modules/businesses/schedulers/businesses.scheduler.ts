import { BusinessesProducer } from "@/infrastructure/messaging/producers/businesses.producer";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

const STALE_IN_PROGRESS_BUSINESS_WINDOW_MS = 1000 * 60 * 60 * 24;

@Injectable()
export class BusinessesScheduler {
  private readonly logger = new Logger(BusinessesScheduler.name);

  constructor(private readonly businessesProducer: BusinessesProducer) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStaleInProgressBusinesses(): Promise<void> {
    const cutoff = new Date(Date.now() - STALE_IN_PROGRESS_BUSINESS_WINDOW_MS);

    await this.businessesProducer.cleanupStaleBusinesses({
      cutoffIso: cutoff.toISOString(),
    });

    this.logger.log(
      `Enqueued stale in-progress business cleanup for cutoff=${cutoff.toISOString()}`,
    );
  }
}
