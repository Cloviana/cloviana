import { MonitoringProducer } from "@/infrastructure/messaging/producers/monitoring.producer";
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MonitoringEligibilityService } from "../services/monitoring-eligibility.service";

const DUE_WINDOW_MS = 1000 * 60 * 60 * 24 * 3;

@Injectable()
export class MonitoringScheduler {
  private readonly logger = new Logger(MonitoringScheduler.name);

  constructor(
    private readonly monitoringEligibility: MonitoringEligibilityService,
    private readonly monitoringProducer: MonitoringProducer,
  ) {}

  @Cron("*/10 * * * *")
  async enqueueDueMonitoringRuns(): Promise<void> {
    const cutoff = new Date(Date.now() - DUE_WINDOW_MS);
    const groups = await this.monitoringEligibility.findDuePromptGroups(cutoff);

    for (const group of groups) {
      await this.monitoringProducer.runMonitoring(group);
    }

    this.logger.log(
      `Enqueued monitoring runs count=${groups.length} cutoff=${cutoff.toISOString()}`,
    );
  }
}
