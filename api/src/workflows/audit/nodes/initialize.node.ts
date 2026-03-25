import { RunnableConfig } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { StateAnnotation } from "../audit.state";
import { normalizeDomain } from "../utils/normalize-domain";
import { scrapeHomepage } from "../utils/scrape-homepage";
import { summarizeProduct } from "../utils/summarize-product";

export async function initialize(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");

  const logger = configurable?.logger as Logger;

  const audit = await prisma.audit.findUniqueOrThrow({
    where: { id: state._auditId },
  });

  const domain = normalizeDomain(audit.domain);
  if (!domain) throw new Error(`Could not normalize domain: ${audit.domain}`);

  const homepageText = await scrapeHomepage(domain);
  const product = await summarizeProduct(homepageText, domain);

  logger?.debug(
    `[${state._auditId}] Product: ${product.summary} | ICP: ${product.icp} | Category: ${product.category}`,
  );

  return {
    _domain: domain,
    _country: audit.country,
    _brandName: product.brandName,
    _product: product,
  };
}
