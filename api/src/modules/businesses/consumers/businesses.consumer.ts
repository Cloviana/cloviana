import { PrismaService } from "@/clients/prisma/prisma.service";
import type {
  CleanupStaleBusinessesPayload,
  RunBusinessInitializationPayload,
  RunPromptGenerationPayload,
} from "@/infrastructure/messaging/rabbitmq.contracts";
import {
  CLEANUP_STALE_BUSINESSES_EVENT,
  RUN_BUSINESS_INITIALIZATION_EVENT,
  RUN_PROMPT_GENERATION_EVENT,
} from "@/infrastructure/messaging/rabbitmq.contracts";
import { BusinessInitializationWorkflow } from "@/workflows/business-initialization/business-initialization.workflow";
import { PromptGenerationWorkflow } from "@/workflows/prompt-generation/prompt-generation.workflow";
import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { BusinessesMaintenanceService } from "../services/businesses-maintenance.service";

@Controller()
export class BusinessesConsumer {
  private readonly logger = new Logger(BusinessesConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessInitializationRunner: BusinessInitializationWorkflow,
    private readonly promptGeneration: PromptGenerationWorkflow,
    private readonly businessesMaintenance: BusinessesMaintenanceService,
  ) {}

  @EventPattern(RUN_PROMPT_GENERATION_EVENT)
  async handleRunPromptGeneration(
    @Payload() payload: RunPromptGenerationPayload,
  ): Promise<void> {
    const businessId = payload?.businessId?.trim();

    if (!businessId) {
      this.logger.error(
        `Received ${RUN_PROMPT_GENERATION_EVENT} with invalid businessId=${payload?.businessId}`,
      );
      return;
    }

    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      include: { competitors: { orderBy: { createdAt: "asc" } } },
    });

    try {
      await this.promptGeneration.run({
        businessId,
        profile: {
          domain: business.domain,
          name: business.name,
          description: business.description ?? "",
          icp: business.icp ?? "",
          category: business.category ?? "",
        },
        competitors: business.competitors,
        extraContext: [
          business.industry ? `Industry: ${business.industry}` : "",
          business.location ? `Target location: ${business.location}` : "",
          business.distributionChannels.length
            ? `Distribution channels: ${business.distributionChannels.join(", ")}`
            : "",
        ].filter(Boolean),
      });

      this.logger.log(
        `Prompt generation completed for businessId=${businessId}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Prompt generation failed for businessId=${businessId}: ${err.message}`,
        err.stack,
      );
    }
  }

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

  @EventPattern(CLEANUP_STALE_BUSINESSES_EVENT)
  async handleCleanupStaleBusinesses(
    @Payload() payload: CleanupStaleBusinessesPayload,
  ): Promise<void> {
    const cutoff = new Date(payload?.cutoffIso ?? "");

    if (!payload?.cutoffIso || Number.isNaN(cutoff.getTime())) {
      this.logger.error(
        `Received ${CLEANUP_STALE_BUSINESSES_EVENT} with invalid cutoffIso=${payload?.cutoffIso}`,
      );
      return;
    }

    const deletedCount =
      await this.businessesMaintenance.clearStaleInProgressBusinesses(cutoff);

    this.logger.log(
      `Completed ${CLEANUP_STALE_BUSINESSES_EVENT} deletedCount=${deletedCount} cutoff=${cutoff.toISOString()}`,
    );
  }
}
