import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { StripeService } from "@/clients/stripe/stripe.service";
import { AppConfiguration } from "@/config/app.configuration";
import { PlanInterval, PlanName, Store } from "@prisma/client";
import { ERROR_MESSAGES } from "./constants/error.constant";

const TRIAL_PERIOD_DAYS = 7;

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: AppConfiguration,
  ) {}

  async createTrialCheckoutSession(email: string, store: Store) {
    if (store.status !== "DRAFT") {
      throw new BadRequestException(ERROR_MESSAGES.STORE_MUST_BE_DRAFT);
    }

    const existingSub = await this.prisma.subscription.findUnique({
      where: { storeId: store.id },
    });
    if (existingSub) {
      throw new ConflictException(ERROR_MESSAGES.SUBSCRIPTION_ALREADY_EXISTS);
    }

    const plan = await this.prisma.plan.findFirst({
      where: {
        name: PlanName.STANDARD,
        interval: PlanInterval.MONTHLY,
      },
    });
    if (!plan) {
      throw new NotFoundException(ERROR_MESSAGES.PLAN_NOT_FOUND);
    }

    const customerId = await this.ensureCustomer(
      store.id,
      email,
      store.stripeCustomerId,
    );

    const session = await this.stripe.client.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_PERIOD_DAYS,
        metadata: { storeId: store.id },
      },
      success_url: `${this.config.appUrl}/store/${store.id}`,
      cancel_url: `${this.config.appUrl}/onboarding/trial?store=${store.id}`,
    });

    return { sessionId: session.id, url: session.url };
  }

  private async ensureCustomer(
    storeId: string,
    email: string,
    existingCustomerId?: string | null,
  ): Promise<string> {
    if (existingCustomerId) {
      return existingCustomerId;
    }

    const customer = await this.stripe.createCustomer(email);
    await this.prisma.store.update({
      where: { id: storeId },
      data: { stripeCustomerId: customer.id },
    });
    return customer.id;
  }
}
