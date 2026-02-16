import { PrismaService } from "@/clients/prisma/prisma.service";
import { AppConfiguration } from "@/config/app.configuration";
import { AuthUser } from "@/interfaces/auth-user.interface";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { SubscriptionStatus } from "@prisma/client";
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
        subscription: { select: { id: true } },
      },
    });

    const hasHadSubscription = !!store.subscription;
    let { stripeCustomerId } = store;
    if (!stripeCustomerId) {
      const customer = await this.stripe.createCustomer(user.email, store.name);
      stripeCustomerId = customer.id;
      await this.prisma.store.update({
        where: { id: store.id },
        data: { stripeCustomerId },
      });
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
        ...(hasHadSubscription ? {} : { trial_period_days: 14 }),
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

  /**
   * Handles checkout.session.completed — upserts the subscription record
   * using metadata from both the session and the full Stripe subscription.
   */
  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const storeId = session.metadata?.storeId;
    const sub = session.subscription;

    if (!storeId || !sub) {
      this.logger.error(
        `checkout.session.completed → MISSING DATA: storeId=${storeId}, subscription=${sub}`,
      );
      return;
    }

    const subscriptionId = typeof sub === "string" ? sub : sub.id;
    const stripeSub = await this.stripe.retrieveSubscription(subscriptionId);

    await this.upsertSubscriptionFromStripe(storeId, stripeSub);
  }

  /**
   * Handles customer.subscription.created — self-sufficient handler that
   * resolves storeId from subscription metadata and plan from line items.
   * Does NOT depend on checkout.session.completed having fired first.
   */
  async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const storeId = subscription.metadata?.storeId;
    if (!storeId) {
      this.logger.error(
        `customer.subscription.created → NO storeId in metadata! Full metadata: ${JSON.stringify(subscription.metadata)}`,
      );
      return;
    }

    await this.upsertSubscriptionFromStripe(storeId, subscription);
  }

  /**
   * Handles customer.subscription.updated — updates an existing record,
   * or upserts if the record doesn't exist yet (idempotent).
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const storeId =
      subscription.metadata?.storeId ??
      (
        await this.prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
          select: { storeId: true },
        })
      )?.storeId;

    if (!storeId) {
      this.logger.warn(
        `customer.subscription.updated: cannot resolve storeId for ${subscription.id}`,
      );
      return;
    }

    await this.upsertSubscriptionFromStripe(storeId, subscription);
  }

  async handleCustomerSubscriptionDeleted(subscription: Stripe.Subscription) {
    const existing = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!existing) {
      this.logger.warn(
        `customer.subscription.deleted: no record for ${subscription.id}`,
      );
      return;
    }

    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: SubscriptionStatus.CANCELED },
    });
  }

  async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const sub = invoice.parent?.subscription_details?.subscription;
    if (!sub) return;

    const subscriptionId = typeof sub === "string" ? sub : sub.id;
    const existing = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });
    if (!existing) {
      this.logger.warn(
        `No subscription record for failed invoice ${invoice.id}`,
      );
      return;
    }

    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: SubscriptionStatus.PAST_DUE },
    });
  }

  /**
   * Resolves the plan from the subscription's line items price ID.
   * This is the canonical way to determine the plan — it reads from Stripe's
   * subscription object rather than relying on checkout session metadata.
   */
  private async resolvePlanFromSubscription(subscription: Stripe.Subscription) {
    const priceId = subscription.items.data[0]?.price?.id;

    if (!priceId) {
      this.logger.error(
        `resolvePlan → NO price in line items! items.data: ${JSON.stringify(subscription.items.data)}`,
      );
      throw new BadRequestException(
        `Stripe subscription ${subscription.id} has no price in line items`,
      );
    }

    const plan = await this.prisma.plan.findUnique({
      where: { stripePriceId: priceId },
    });

    if (!plan) {
      this.logger.error(
        `resolvePlan → NO plan found in DB for stripePriceId=${priceId}. Check your plans table.`,
      );
      throw new BadRequestException(
        `No plan found for Stripe price ${priceId}`,
      );
    }
    return plan;
  }

  /**
   * Single idempotent write path for all subscription webhook handlers.
   * Upserts by storeId so duplicate events are harmless.
   */
  private async upsertSubscriptionFromStripe(
    storeId: string,
    subscription: Stripe.Subscription,
  ) {
    const plan = await this.resolvePlanFromSubscription(subscription);
    const status = this.mapStripeStatus(subscription.status);
    const trialEndsAt = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;
    await this.prisma.subscription.upsert({
      where: { storeId },
      create: {
        status,
        stripeSubscriptionId: subscription.id,
        trialEndsAt,
        storeId,
        planId: plan.id,
      },
      update: {
        status,
        stripeSubscriptionId: subscription.id,
        trialEndsAt,
        planId: plan.id,
      },
    });
  }

  private mapStripeStatus(status: string): SubscriptionStatus {
    switch (status) {
      case "trialing":
        return SubscriptionStatus.TRIALLING;
      case "active":
        return SubscriptionStatus.ACTIVE;
      case "past_due":
        return SubscriptionStatus.PAST_DUE;
      case "canceled":
        return SubscriptionStatus.CANCELED;
      case "incomplete":
      case "incomplete_expired":
        return SubscriptionStatus.INCOMPLETE;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }
}
