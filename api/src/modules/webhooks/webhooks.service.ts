import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { StripeService } from "@/clients/stripe/stripe.service";
import Stripe from "stripe";
import { AppConfiguration } from "@/config/app.configuration";
import { StoreStatus, SubscriptionStatus } from "@prisma/client";
import { KeywordsProducer } from "../messaging/producers/keywords.producer";

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: AppConfiguration,
    private readonly keywordsProducer: KeywordsProducer,
  ) {}

  verifyEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.client.webhooks.constructEvent(
      payload,
      signature,
      this.config.stripeWebhookSecret,
    );
  }

  async handleEvent(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed":
        await this.onCheckoutSession(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.deleted":
        await this.onSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      default:
        this.logger.debug(`Unhandled event: ${event.type}`);
    }
  }

  private async onCheckoutSession(session: Stripe.Checkout.Session) {
    const stripeSub = await this.stripe.client.subscriptions.retrieve(
      session.subscription as string,
    );
    const storeId = stripeSub.metadata?.storeId;
    if (!storeId) {
      this.logger.warn("Missing storeId in session metadata");
      return;
    }

    const priceId = stripeSub.items.data[0].price.id;
    const plan = await this.prisma.plan.findUnique({
      where: { stripePriceId: priceId },
    });
    if (!plan) {
      this.logger.error(`Plan not found for priceId ${priceId}`);
      return;
    }

    const status =
      stripeSub.status === "trialing"
        ? SubscriptionStatus.TRIALING
        : SubscriptionStatus.ACTIVE;

    await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.upsert({
        where: { storeId },
        create: {
          storeId,
          planId: plan.id,
          stripeSubscriptionId: stripeSub.id,
          status,
        },
        update: {
          planId: plan.id,
          stripeSubscriptionId: stripeSub.id,
          status,
        },
      });

      const newStoreStatus =
        subscription.status === SubscriptionStatus.TRIALING
          ? StoreStatus.SETTING_UP
          : StoreStatus.ACTIVE;

      await tx.store.update({
        where: { id: storeId },
        data: { status: newStoreStatus },
      });
    });

    if (status === SubscriptionStatus.TRIALING) {
      //let email = session.customer_details?.email as string;
      this.keywordsProducer.seedKeywords({
        storeId,
      });
    }
  }

  private async onSubscriptionDeleted(subscription: Stripe.Subscription) {
    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: SubscriptionStatus.CANCELED },
    });
  }
}
