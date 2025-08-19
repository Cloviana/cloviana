import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { Smtp2GoClient } from "@/clients/smtp/services/smtp2go.service";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { KEYWORDS_SEEDED_EVENT } from "@/constants/rabbitmq.constants";
import { KeywordsService } from "./keywords.service";
import { StoreStatus } from "@prisma/client";

interface KeywordsSeededEvent {
  storeId: string;
}

@Controller()
export class KeywordsConsumer {
  private readonly logger = new Logger(KeywordsConsumer.name);

  constructor(
    private readonly keywords: KeywordsService,
    private readonly smtp: Smtp2GoClient,
    private readonly prisma: PrismaService,
  ) {}

  @EventPattern(KEYWORDS_SEEDED_EVENT)
  async handleKeywordsSeeded(@Payload() { storeId }: KeywordsSeededEvent) {
    this.logger.log(`Starting keyword‐seeding job for store ${storeId}`);

    let status: StoreStatus = StoreStatus.ACTIVE;
    try {
      await this.keywords.seedKeywords(storeId);
      /*await this.smtp.sendMail({
        to: email,
        subject: "Welcome to your new SEO workspace!",
        html: "<h1>Your keywords are ready</h1>",
      });
      */
      this.logger.log(`Job succeeded for store ${storeId}`);
    } catch (err) {
      status = StoreStatus.FAILED;
      this.logger.error(`Job failed for store ${storeId}`, err.stack);
    } finally {
      try {
        await this.prisma.store.update({
          where: { id: storeId },
          data: { status },
        });
        this.logger.log(`Store ${storeId} status updated to ${status}`);
      } catch (updateErr) {
        this.logger.error(
          `Failed to update store status for ${storeId}`,
          updateErr.stack,
        );
      }
    }
  }
}
