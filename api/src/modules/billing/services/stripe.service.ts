import { AppConfiguration } from "@/config/app.configuration";
import { Injectable, Logger } from "@nestjs/common";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly config: AppConfiguration) {
    this.stripe = new Stripe(this.config.stripeApiKey, {
      apiVersion: "2025-07-30.basil",
    });
  }

  // Get Products
  async getProducts(): Promise<Stripe.Product[]> {
    try {
      const products = await this.stripe.products.list();
      this.logger.log("Products fetched successfully");
      return products.data;
    } catch (error) {
      this.logger.error(
        "Failed to fetch products",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // Get Customers
  async getCustomers() {
    try {
      const customers = await this.stripe.customers.list({});
      this.logger.log("Customers fetched successfully");
      return customers.data;
    } catch (error) {
      this.logger.error(
        "Failed to fetch customers",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // Accept Payments (Create Payment Intent)
  async createPaymentIntent(
    amount: number,
    currency: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
      });
      this.logger.log(
        `PaymentIntent created successfully with amount: ${amount} ${currency}`,
      );
      return paymentIntent;
    } catch (error) {
      this.logger.error(
        "Failed to create PaymentIntent",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // Subscriptions (Create Subscription)
  async createSubscription(
    customerId: string,
    priceId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
      });
      this.logger.log(
        `Subscription created successfully for customer ${customerId}`,
      );
      return subscription;
    } catch (error) {
      this.logger.error(
        "Failed to create subscription",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // Customer Management (Create Customer)
  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({ email, name });
      this.logger.log(`Customer created successfully with email: ${email}`);
      return customer;
    } catch (error) {
      this.logger.error(
        "Failed to create customer",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // Product & Pricing Management (Create Product with Price)
  async createProduct(
    name: string,
    description: string,
    price: number,
  ): Promise<Stripe.Product> {
    try {
      const product = await this.stripe.products.create({ name, description });
      await this.stripe.prices.create({
        product: product.id,
        unit_amount: price * 100,
        currency: "usd",
      });
      this.logger.log(`Product created successfully: ${name}`);
      return product;
    } catch (error) {
      this.logger.error(
        "Failed to create product",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // Refunds (Process Refund)
  async refundPayment(paymentIntentId: string): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
      });
      this.logger.log(
        `Refund processed successfully for PaymentIntent: ${paymentIntentId}`,
      );
      return refund;
    } catch (error) {
      this.logger.error(
        "Failed to process refund",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // Payment Method Integration (Attach Payment Method)
  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<void> {
    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      this.logger.log(
        `Payment method ${paymentMethodId} attached to customer ${customerId}`,
      );
    } catch (error) {
      this.logger.error(
        "Failed to attach payment method",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // Reports and Analytics (Retrieve Balance)
  async getBalance(): Promise<Stripe.Balance> {
    try {
      const balance = await this.stripe.balance.retrieve();
      this.logger.log("Balance retrieved successfully");
      return balance;
    } catch (error) {
      this.logger.error(
        "Failed to retrieve balance",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // Payment Links
  async createPaymentLink(priceId: string): Promise<Stripe.PaymentLink> {
    try {
      const paymentLink = await this.stripe.paymentLinks.create({
        line_items: [{ price: priceId, quantity: 1 }],
      });
      this.logger.log("Payment link created successfully");
      return paymentLink;
    } catch (error) {
      this.logger.error(
        "Failed to create payment link",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams,
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create(params);
      this.logger.log("Checkout session created successfully");
      return session;
    } catch (error) {
      this.logger.error(
        "Failed to create checkout session",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async createPortalSession(
    params: Stripe.BillingPortal.SessionCreateParams,
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await this.stripe.billingPortal.sessions.create(params);
      this.logger.log("Billing portal session created successfully");
      return session;
    } catch (error) {
      this.logger.error(
        "Failed to create billing portal session",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  constructEventFromPayload(
    payload: Buffer | string,
    signature: string,
    secret: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  async retrieveSubscription(
    subscriptionId: string,
    params?: Stripe.SubscriptionRetrieveParams,
  ): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId, params);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve subscription ${subscriptionId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
