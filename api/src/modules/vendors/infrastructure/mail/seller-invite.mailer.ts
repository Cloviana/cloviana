import { Injectable, Logger } from "@nestjs/common";

import { ResendService } from "@/integrations/resend/resend.service";
import { AppConfiguration } from "@/platform/config/app.configuration";

import {
  type SellerInviteNotification,
  SellerInviteNotifier,
} from "../../application/ports/seller-invite-notifier.port";

@Injectable()
export class SellerInviteMailer extends SellerInviteNotifier {
  private readonly logger = new Logger(SellerInviteMailer.name);

  constructor(
    private readonly resend: ResendService,
    private readonly config: AppConfiguration,
  ) {
    super();
  }

  /** Never throws: the invite exists either way, and the owner can resend it. */
  async send(input: SellerInviteNotification): Promise<void> {
    const subject = `You're invited to manage ${input.sellerName} on ${input.marketplaceName}`;
    const text =
      `You've been invited to manage ${input.sellerName} on ${input.marketplaceName}.\n\n` +
      `Accept the invite: ${this.link(input.slug, input.token)}\n\n` +
      `This link expires on ${input.expiresAt.toUTCString()}.`;

    if (!this.config.resendApiKey) {
      if (this.config.environment === "production") {
        this.logger.error("RESEND_API_KEY is not configured; invite dropped");
        return;
      }
      // Development: no email provider, so print the message (it contains the link).
      this.logger.log(
        `[dev email] to=${input.to} subject="${subject}"\n${text}`,
      );
      return;
    }

    try {
      await this.resend.send({
        from: this.config.marketplaceAuthEmailFrom,
        to: input.to,
        subject,
        text,
      });
    } catch (error) {
      this.logger.error(`Invite email to ${input.to} failed: ${String(error)}`);
    }
  }

  // ponytail: always the <slug> subdomain; link to a verified custom domain once domains exist.
  private link(slug: string, token: string): string {
    const { protocol, port } = new URL(this.config.marketplaceAuthUrl);
    const host = `${slug}.${this.config.platformBaseDomain}${port ? `:${port}` : ""}`;
    return `${protocol}//${host}/sell/accept-invite?token=${encodeURIComponent(token)}`;
  }
}
