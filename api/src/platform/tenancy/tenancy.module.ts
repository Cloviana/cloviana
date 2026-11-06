import { Global, Module } from "@nestjs/common";

import { TenantPrismaService } from "./tenant-prisma.service";
import { TenantResolverService } from "./tenant-resolver.service";

@Global()
@Module({
  providers: [TenantResolverService, TenantPrismaService],
  exports: [TenantResolverService, TenantPrismaService],
})
export class TenancyModule {}
