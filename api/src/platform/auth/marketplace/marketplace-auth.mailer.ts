import { Injectable, Logger } from "@nestjs/common";

import { ResendService } from "@/integrations/resend/resend.service";
import { AppConfiguration } from "@/platform/config/app.configuration";

@Injectable()
export class MarketplaceAuthMailer {
  private readonly logger = new Logger(MarketplaceAuthMailer.name);

  constructor(
    private readonly resend: ResendService,
    private readonly config: AppConfiguration,
  ) {}

  send(input: { to: string; subject: string; text: string }): void {
    const canSend = Boolean(this.config.resendApiKey);

    if (!canSend && this.config.environment === "production") {
      this.logger.error("RESEND_API_KEY is not configured; auth email dropped");
      return;
    }

    if (!canSend) {
      // Development: no email provider, so print the message (it contains the link).
      this.logger.log(
        `[dev email] to=${input.to} subject="${input.subject}"\n${input.text}`,
      );
      return;
    }

    this.resend
      .send({ from: this.config.marketplaceAuthEmailFrom, ...input })
      .catch((error: unknown) =>
        this.logger.error(`Auth email to ${input.to} failed: ${String(error)}`),
      );
  }
}
