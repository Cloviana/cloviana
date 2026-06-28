import type { RunBusinessInitializationPayload } from "@/infrastructure/messaging/rabbitmq.contracts";
import { RUN_BUSINESS_INITIALIZATION_EVENT } from "@/infrastructure/messaging/rabbitmq.contracts";
import { BusinessInitializationWorkflow } from "@/workflows/business-initialization/business-initialization.workflow";
import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";

@Controller()
export class BusinessesConsumer {
  private readonly logger = new Logger(BusinessesConsumer.name);

  constructor(
    private readonly businessInitializationRunner: BusinessInitializationWorkflow,
  ) {}

  @EventPattern(RUN_BUSINESS_INITIALIZATION_EVENT)
  async handleRunBusinessInitialization(
    @Payload() payload: RunBusinessInitializationPayload,
  ): Promise<void> {
    if (!payload?.businessId?.trim()) {
      this.logger.error(
        `Received ${RUN_BUSINESS_INITIALIZATION_EVENT} with invalid businessId=${payload?.businessId}`,
      );
      return;
    }

    this.logger.log(
      `Received ${RUN_BUSINESS_INITIALIZATION_EVENT} event for businessId=${payload.businessId}`,
    );

    try {
      await this.businessInitializationRunner.run(payload.businessId);
      this.logger.log(
        `Business initialization completed for businessId=${payload.businessId}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Business initialization failed for businessId=${payload.businessId}: ${err.message}`,
        err.stack,
      );
    }
  }
}
