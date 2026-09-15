import { PrismaService } from "@/clients/prisma/prisma.service";
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { BusinessResearchService } from "@/modules/businesses/research/business-research.service";
import type { AuditInput } from "../audit.types";

export async function loadContextStep(
  prisma: PrismaService,
  businessResearch: BusinessResearchService,
  auditId: string,
): Promise<AuditInput> {
  const audit = await prisma.audit.findUniqueOrThrow({
    where: { id: auditId },
  });
  const domain = normalizeDomain(audit.domain);

  if (!domain) {
    throw new Error(`Could not normalize domain: ${audit.domain}`);
  }

  const [profile, competitors] = await Promise.all([
    businessResearch.enrichProfile(domain),
    businessResearch.findCompetitors(domain, 30),
  ]);

  return {
    auditId,
    email: audit.email,
    country: audit.country,
    profile: { ...profile, domain },
    competitors: competitors.map((competitor) => ({
      id: competitor.domain,
      domain: competitor.domain,
      name: competitor.name,
      aliases: competitor.aliases,
    })),
  };
}
