import { AppConfiguration } from "@/config/app.configuration";
import { Injectable, OnModuleInit } from "@nestjs/common";
import Stripe from "stripe";

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe;

  constructor(private readonly config: AppConfiguration) {}

  onModuleInit() {
    this.stripe = new Stripe(this.config.stripeSecretKey);
  }

  async createCustomer(email: string): Promise<Stripe.Customer> {
    return this.stripe.customers.create({ email });
  }

  get client(): Stripe {
    return this.stripe;
  }
}
