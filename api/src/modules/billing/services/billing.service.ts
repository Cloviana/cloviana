import { PrismaService } from "@/clients/prisma/prisma.service";
import { AppConfiguration } from "@/config/app.configuration";
import { AuthUser } from "@/interfaces/auth-user.interface";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Prisma, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";
import { StripeService } from "./stripe.service";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: AppConfiguration,
  ) {}

  async createCheckoutSession(
    user: AuthUser,
    storeId: string,
    priceId: string,
  ) {
    const store = await this.prisma.store.findFirstOrThrow({
      where: { id: storeId, ownerId: user.sub },
      select: {
        id: true,
        name: true,
        stripeCustomerId: true,
      },
    });

    let { stripeCustomerId } = store;
    if (!stripeCustomerId) {
      const customer = await this.stripe.createCustomer(user.email, store.name);
      stripeCustomerId = customer.id;
      await this.prisma.store.update({
        where: { id: store.id },
        data: { stripeCustomerId },
      });
      this.logger.log(
        `Created Stripe customer ${stripeCustomerId} for store ${storeId}`,
      );
    }

    const baseAppUrl = this.normalizeAppUrl();
    const session = await this.stripe.createCheckoutSession({
      mode: "subscription",
      customer: stripeCustomerId,
      success_url: `${baseAppUrl}/${storeId}?status=success`,
      cancel_url: `${baseAppUrl}/${storeId}?status=cancelled`,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { storeId, priceId },
      subscription_data: {
        metadata: { storeId },
      },
    });

    if (!session.url) {
      throw new BadRequestException(
        "Stripe did not return a checkout session URL. Please try again.",
      );
    }

    return { url: session.url };
  }

  async createPortalSession(user: AuthUser, storeId: string) {
    const store = await this.prisma.store.findFirstOrThrow({
      where: { id: storeId, ownerId: user.sub },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!store.stripeCustomerId) {
      throw new BadRequestException(
        "Store is not linked to a Stripe customer yet. Please start a checkout session first.",
      );
    }

    const baseAppUrl = this.normalizeAppUrl();
    const session = await this.stripe.createPortalSession({
      customer: store.stripeCustomerId,
      return_url: `${baseAppUrl}/${storeId}`,
    });
    return { url: session.url };
  }

  private normalizeAppUrl() {
    return this.config.appUrl.replace(/\/$/, "");
  }

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const storeId = session.metadata?.storeId;
    const priceId = session.metadata?.priceId;
    const sub = session.subscription;

    if (!storeId || !priceId || !sub) {
      console.log(storeId, priceId, sub);
      this.logger.error(
        `Missing required billing data for session ${session.id}`,
      );
      return;
    }

    const subscriptionId = typeof sub === "string" ? sub : sub.id;

    const plan = await this.prisma.plan.findUniqueOrThrow({
      where: { stripePriceId: priceId },
    });

    await this.prisma.subscription.upsert({
      where: { storeId },
      create: {
        status: SubscriptionStatus.ACTIVE,
        stripeSubscriptionId: subscriptionId,
        trialEndsAt: null,
        storeId,
        planId: plan.id,
      },
      update: {
        status: SubscriptionStatus.ACTIVE,
        stripeSubscriptionId: subscriptionId,
        trialEndsAt: null,
        planId: plan.id,
      },
    });
  }

  async handleCustomerSubscriptionDeleted(subscription: Stripe.Subscription) {
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!existingSubscription) {
      this.logger.warn(
        `No subscription record found when handling subscription deletion`,
      );
      return;
    }

    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: SubscriptionStatus.CANCELED },
    });
    this.logger.log(
      `Subscription for store ${existingSubscription.storeId} marked as canceled (Stripe subscription ${existingSubscription.stripeSubscriptionId})`,
    );
  }
}
