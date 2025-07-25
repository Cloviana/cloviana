import { AppConfiguration } from "@/config/app.configuration";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class Smtp2GoClient {
  private client: AxiosInstance;
  private apiKey: string;
  private defaultFrom: string;

  constructor(private readonly config: AppConfiguration) {
    this.apiKey = this.config.smtp2goApiKey;
    this.defaultFrom = this.config.smtp2goDefaultFrom;
    if (!this.apiKey) {
      throw new InternalServerErrorException("SMTP2GO API key not configured");
    }

    this.client = axios.create({
      baseURL: "https://api.smtp2go.com/v3/email/send",
      headers: { "Content-Type": "application/json" },
    });
  }

  async sendMail(options: EmailOptions): Promise<any> {
    const toList = Array.isArray(options.to) ? options.to : [options.to];
    const fromAddr = options.from || this.defaultFrom;
    if (!fromAddr) {
      throw new InternalServerErrorException(
        "`from` address is not configured",
      );
    }

    const payload = {
      api_key: this.apiKey,
      to: toList,
      sender: fromAddr,
      subject: options.subject,
      text_body: options.text,
      html_body: options.html,
    };

    try {
      const response = await this.client.post("", payload);
      const { data } = response;
      const result = data?.data;

      const sentCount = result?.succeeded ?? 0;
      if (sentCount > 0) {
        return data;
      }
      throw new Error(`SMTP2GO sendMail failed: ${JSON.stringify(data)}`);
    } catch (error) {
      // You could add more sophisticated error handling or retries here
      throw new InternalServerErrorException(
        `SMTP2GO API error: ${error.message}`,
      );
    }
  }
}
