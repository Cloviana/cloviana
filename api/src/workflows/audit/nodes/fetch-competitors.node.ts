import { ExaService } from "@/integrations/exa/exa.service";
import { RunnableConfig } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import { StateAnnotation } from "../audit.state";

const PLACEHOLDER = [
  { domain: "vizard.ai", title: "Vizard" },
  { domain: "kapwing.com", title: "Kapwing" },
  { domain: "2short.ai", title: "2short" },
  { domain: "klap.app", title: "Klap" },
];

export async function fetchCompetitors(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const exa = configurable?.exa as ExaService;
  if (!exa) throw new Error("ExaService not provided");

  const logger = configurable?.logger as Logger;
  const { summary, icp, category } = state._product;

  logger?.debug(`Fetching competitors for domain: ${state._domain}`);

  if (process.env.NODE_ENV === "development") {
    logger?.debug(`[DEV] Using placeholder competitors`);
    return { _competitors: PLACEHOLDER };
  }

  const competitors = await exa.findCompetitors(
    state._domain,
    category,
    icp,
    summary,
  );

  const domains = competitors.map((c) => c.domain).join(", ");
  logger?.debug(`Found ${competitors.length} competitors for ${state._domain}: ${domains}`);

  return { _competitors: competitors };
}