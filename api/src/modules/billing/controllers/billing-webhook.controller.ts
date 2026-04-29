import { Public } from "@/common/decorators/public.decorator";
import { AppConfiguration } from "@/config/app.configuration";
import {
  BadRequestException,
  Controller,
  Headers,
  Logger,
  Post,
  Req,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import Stripe from "stripe";

import { BillingService } from "../services/billing.service";
import { StripeService } from "../services/stripe.service";

type RawBodyRequest = FastifyRequest & { rawBody?: Buffer | string };

@Controller("billing/webhook")
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly billing: BillingService,
    private readonly config: AppConfiguration,
  ) {}

  @Post()
  @Public()
  async handleStripeWebhook(
    @Req() request: FastifyRequest,
    @Headers("stripe-signature") signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException("Missing Stripe signature");
    }

    const rawBodyData = (request as RawBodyRequest).rawBody;
    const rawBody =
      typeof rawBodyData === "string" ? Buffer.from(rawBodyData) : rawBodyData;
    if (!rawBody) {
      throw new BadRequestException("Missing raw body for Stripe webhook");
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructEventFromPayload(
        rawBody,
        signature,
        this.config.stripeWebhookSecret,
      );
    } catch (error) {
      this.logger.error(
        "Stripe webhook signature verification failed",
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException("Invalid Stripe signature");
    }

    this.logger.log(`Received Stripe event: ${event.type} (id: ${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await this.billing.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;
        case "customer.subscription.created":
          await this.billing.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription,
          );
          break;
        case "customer.subscription.updated":
          await this.billing.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;
        case "customer.subscription.deleted":
          await this.billing.handleCustomerSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;
        case "invoice.payment_failed":
          await this.billing.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;
        default:
          this.logger.debug(`Unhandled Stripe event ${event.type}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle Stripe event ${event.type} (id: ${event.id})`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }

    return { received: true };
  }
}
