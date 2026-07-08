import { PrismaService } from "@/clients/prisma/prisma.service";
import { AppConfiguration } from "@/config/app.configuration";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { BusinessMembershipRole, SubscriptionStatus } from "@prisma/client";
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
    businessId: string,
    priceId: string,
  ) {
    const business = await this.prisma.business.findFirstOrThrow({
      where: {
        id: businessId,
        OR: [
          { ownerId: user.sub },
          {
            members: {
              some: {
                profileId: user.sub,
                role: BusinessMembershipRole.OWNER,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        stripeCustomerId: true,
        subscription: { select: { id: true } },
      },
    });

    const hasHadSubscription = !!business.subscription;
    let { stripeCustomerId } = business;
    if (!stripeCustomerId) {
      // Concurrent checkouts for the same business collapse to one customer.
      const customer = await this.stripe.createCustomer(
        user.email,
        business.name,
        `customer-create-${business.id}`,
      );
      stripeCustomerId = customer.id;
      await this.prisma.business.update({
        where: { id: business.id },
        data: { stripeCustomerId },
      });
    }

    const baseAppUrl = this.normalizeAppUrl();
    const session = await this.stripe.createCheckoutSession({
      mode: "subscription",
      customer: stripeCustomerId,
      success_url: `${baseAppUrl}/${businessId}?status=success`,
      cancel_url: `${baseAppUrl}/${businessId}?status=cancelled`,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { businessId, priceId },
      subscription_data: {
        ...(hasHadSubscription ? {} : { trial_period_days: 14 }),
        metadata: { businessId },
      },
    });

    if (!session.url) {
      throw new BadRequestException(
        "Stripe did not return a checkout session URL. Please try again.",
      );
    }

    return { url: session.url };
  }

  async createPortalSession(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findFirstOrThrow({
      where: {
        id: businessId,
        OR: [
          { ownerId: user.sub },
          {
            members: {
              some: {
                profileId: user.sub,
                role: BusinessMembershipRole.OWNER,
              },
            },
          },
        ],
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!business.stripeCustomerId) {
      throw new BadRequestException(
        "Business is not linked to a Stripe customer yet. Please start a checkout session first.",
      );
    }

    const baseAppUrl = this.normalizeAppUrl();
    const session = await this.stripe.createPortalSession({
      customer: business.stripeCustomerId,
      return_url: `${baseAppUrl}/${businessId}`,
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
    const businessId = session.metadata?.businessId;
    const sub = session.subscription;

    if (!businessId || !sub) {
      this.logger.error(
        `checkout.session.completed → MISSING DATA: businessId=${businessId}, subscription=${sub}`,
      );
      return;
    }

    const subscriptionId = typeof sub === "string" ? sub : sub.id;
    const stripeSub = await this.stripe.retrieveSubscription(subscriptionId);

    await this.upsertSubscriptionFromStripe(businessId, stripeSub);
  }

  /**
   * Handles customer.subscription.created — self-sufficient handler that
   * resolves businessId from subscription metadata and plan from line items.
   * Does NOT depend on checkout.session.completed having fired first.
   */
  async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const businessId = subscription.metadata?.businessId;
    if (!businessId) {
      this.logger.error(
        `customer.subscription.created → NO businessId in metadata! Full metadata: ${JSON.stringify(subscription.metadata)}`,
      );
      return;
    }

    await this.upsertSubscriptionFromStripe(businessId, subscription);
  }

  /**
   * Handles customer.subscription.updated — updates an existing record,
   * or upserts if the record doesn't exist yet (idempotent).
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const businessId =
      subscription.metadata?.businessId ??
      (
        await this.prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
          select: { businessId: true },
        })
      )?.businessId;

    if (!businessId) {
      this.logger.warn(
        `customer.subscription.updated: cannot resolve businessId for ${subscription.id}`,
      );
      return;
    }

    await this.upsertSubscriptionFromStripe(businessId, subscription);
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
   * Upserts by businessId so duplicate events are harmless.
   */
  private async upsertSubscriptionFromStripe(
    businessId: string,
    subscription: Stripe.Subscription,
  ) {
    const plan = await this.resolvePlanFromSubscription(subscription);
    const status = this.mapStripeStatus(subscription.status);
    const trialEndsAt = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;
    await this.prisma.subscription.upsert({
      where: { businessId },
      create: {
        status,
        stripeSubscriptionId: subscription.id,
        trialEndsAt,
        businessId,
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
