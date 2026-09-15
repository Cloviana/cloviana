import { PrismaService } from "@/clients/prisma/prisma.service";
import { PromptStatus } from "@prisma/client";
import type { SerializedMonitoringRunInput } from "../monitoring.types";

export async function loadContextStep(
  prisma: PrismaService,
  businessId: string,
  runDateIso: string,
  promptIds?: string[],
): Promise<SerializedMonitoringRunInput> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    include: {
      brandKit: {
        include: { brands: { orderBy: { createdAt: "asc" } } },
      },
      prompts: {
        where: {
          status: PromptStatus.ACTIVE,
          ...(promptIds?.length ? { id: { in: promptIds } } : {}),
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!business.brandKit) {
    throw new Error(`Business ${business.id} is missing its brand kit`);
  }

  return {
    businessId: business.id,
    dateIso: runDateIso,
    prompts: business.prompts.map(({ id, text }) => ({ id, text })),
    brands: business.brandKit.brands.map(
      ({ id, kind, domain, name, aliases }) => ({
        id,
        kind,
        domain,
        name,
        aliases,
      }),
    ),
  };
}
