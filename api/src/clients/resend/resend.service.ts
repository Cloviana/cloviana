import { AppConfiguration } from "@/config/app.configuration";
import { Injectable } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class ResendService {
  private readonly resend: Resend;

  constructor(private readonly config: AppConfiguration) {
    this.resend = new Resend(config.resendApiKey);
  }

  async sendVerificationEmail(
    to: string,
    code: number,
    expiryMinutes: number,
  ) {
    const { error } = await this.resend.emails.send({
      to,
      template: {
        id: "d96fd778-a6fb-4871-9dc2-d2ad10b665a0",
        variables: {
          code,
          expiry_minutes: expiryMinutes,
        },
      },
    });

    if (error) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  async sendAuditComplete(to: string, auditId: string, brandName: string) {
    const { error } = await this.resend.emails.send({
      to,
      template: {
        id: "e2e0e914-c96a-469a-8115-742dbde0d9bf",
        variables: {
          audit_id: auditId,
          brand_name: brandName
        },
      },
    });

    if (error) {
      throw new Error(`Failed to send audit complete email: ${error.message}`);
    }
  }
}
