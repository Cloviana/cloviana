import { Inject, Injectable } from "@nestjs/common";

import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from "@/modules/customers/application/ports/customer.repository.port";
import type { Customer } from "@/modules/customers/domain/customer";

export interface EnsureCustomerInput {
  marketplaceId: string;
  marketplaceUser: { id: string; email: string; name: string };
}

@Injectable()
export class EnsureCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: CustomerRepository,
  ) {}

  execute(input: EnsureCustomerInput): Promise<Customer> {
    const [firstName, ...rest] = input.marketplaceUser.name.trim().split(/\s+/);

    return this.customers.ensureForMarketplaceUser({
      marketplaceId: input.marketplaceId,
      marketplaceUserId: input.marketplaceUser.id,
      email: input.marketplaceUser.email,
      firstName: firstName || null,
      lastName: rest.join(" ") || null,
    });
  }
}
