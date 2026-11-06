import { AppConfiguration } from "@/platform/config/app.configuration";
import { Injectable } from "@nestjs/common";
import { type CreateEmailOptions, Resend } from "resend";

@Injectable()
export class ResendService {
  private client: Resend | null = null;

  constructor(private readonly config: AppConfiguration) {}

  async send(options: CreateEmailOptions) {
    if (!this.config.resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    this.client ??= new Resend(this.config.resendApiKey);
    const { data, error } = await this.client.emails.send(options);
    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
    return data;
  }
}
