import { Injectable } from "@nestjs/common";

import type { CustomerRepository } from "@/modules/customers/application/ports/customer.repository.port";
import type {
  Customer,
  EnsureCustomerRecord,
} from "@/modules/customers/domain/customer";
import { TenantPrismaService } from "@/platform/tenancy/tenant-prisma.service";

@Injectable()
export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly tenant: TenantPrismaService) {}

  ensureForMarketplaceUser(input: EnsureCustomerRecord): Promise<Customer> {
    return this.tenant.run(input.marketplaceId, async (tx) => {
      // ON CONFLICT DO NOTHING: two first requests at once must not fail or abort the transaction.
      await tx.customer.createMany({ data: [input], skipDuplicates: true });

      return tx.customer.findFirstOrThrow({
        where: {
          marketplaceId: input.marketplaceId,
          marketplaceUserId: input.marketplaceUserId,
        },
      });
    });
  }
}
