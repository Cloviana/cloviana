import {
  BadRequestException,
  Controller,
  Header,
  HttpCode,
  Post,
  Req,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { WebhooksService } from "./webhooks.service";
import { Public } from "@/decorators/public.decorator";

@Controller("webhooks")
@Public()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post("stripe")
  @HttpCode(200)
  @Header("Content-Type", "application/json")
  async handleStripeEvent(@Req() req: FastifyRequest & { rawBody: Buffer }) {
    const sig = req.headers["stripe-signature"] as string;
    if (!sig) {
      throw new BadRequestException("Missing Stripe signature");
    }

    const event = this.webhooksService.verifyEvent(req.rawBody, sig);
    await this.webhooksService.handleEvent(event);

    return { received: true };
  }
}
